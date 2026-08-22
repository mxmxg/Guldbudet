import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// 10s är taket på Vercels gratisplan; tidsbudgeten nedan (8s) håller sig under.
export const maxDuration = 10

// Engångsverktyg: krymper redan uppladdade bilder i item-images-bucketen till
// max 2048px JPEG, så de gamla råa telefonfotona (flera MB) blir några hundra kB.
// Behåller SAMMA sökväg, så befintliga bild-URL:er fortsätter fungera.
// Skyddas med EMAIL_WEBHOOK_SECRET (?secret=...). Servicerollen läses ur env och
// lämnar aldrig servern. Idempotent: en redan krympt bild hoppas över nästa gång,
// så kör om tills "done": true.
const BUCKET = 'item-images'
const MIN_BYTES = 400 * 1024
const MAX_EDGE = 2048
const QUALITY = 80
// Antal bilder som bearbetas samtidigt per anrop. Fler = snabbare, men måste
// hinna klart under Vercels 10s-tak och rymmas i minnet. 5 är en trygg balans.
const BATCH = 5

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const run = url.searchParams.get('run') === '1'

  const SB = process.env.NEXT_PUBLIC_SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SB || !KEY) return NextResponse.json({ error: 'missing env' }, { status: 500 })
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

  // Auth: antingen en inloggad admin (Bearer access_token) eller
  // EMAIL_WEBHOOK_SECRET som ?secret= (för direktanrop). Adminknappen i
  // adminpanelen använder det första, så ingen nyckel behövs i URL:en.
  let authed = false
  const secret = url.searchParams.get('secret')
  if (process.env.EMAIL_WEBHOOK_SECRET && secret === process.env.EMAIL_WEBHOOK_SECRET) authed = true
  if (!authed) {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (token) {
      const sb = createRouteClient(req)
      const {
        data: { user },
      } = await sb.auth.getUser(token)
      if (user) {
        // Slå upp rollen med service role – RLS döljer profilen för ett
        // oautentiserat anon-anrop, så vi frågar rakt via REST med den
        // redan validerade user-iden.
        const r = await fetch(`${SB}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
          headers: H,
          cache: 'no-store',
        })
        const rows = r.ok ? await r.json() : []
        if (Array.isArray(rows) && rows[0]?.role === 'admin') authed = true
      }
    }
  }
  if (!authed) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const listFolder = async (prefix: string): Promise<any[]> => {
    const res = await fetch(`${SB}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
      cache: 'no-store',
    })
    return res.ok ? await res.json() : []
  }

  const mb = (b: number) => Math.round((b / 1024 / 1024) * 10) / 10

  try {
    // Samla alla filer (en nivå av användarmappar under roten).
    const files: { path: string; size: number | null }[] = []
    const top = await listFolder('')
    for (const e of top) {
      const isFolder = e.id == null && e.metadata == null
      if (isFolder) {
        const sub = await listFolder(e.name)
        for (const f of sub)
          if (f.id != null || f.metadata != null) files.push({ path: `${e.name}/${f.name}`, size: f.metadata?.size ?? null })
      } else {
        files.push({ path: e.name, size: e.metadata?.size ?? null })
      }
    }

    const bigOnes = files.filter((f) => f.size != null && f.size >= MIN_BYTES)
    const totalBig = bigOnes.reduce((s, f) => s + (f.size || 0), 0)

    // ANALYS (dry): bara storlekar ur metadatan, ingen nedladdning eller
    // bildbehandling. Snabbt och kan aldrig time-outa.
    if (!run) {
      return NextResponse.json({
        mode: 'testkörning',
        filer_totalt: files.length,
        stora_bilder: bigOnes.length,
        total_mb: mb(totalBig),
        sparat_mb: mb(Math.round(totalBig * 0.7)), // uppskattning ~70 %
        done: true,
        tips: bigOnes.length ? 'Klicka "Krymp bilderna" för att köra skarpt.' : 'Inget att göra.',
      })
    }

    // SKARPT: bearbeta en bunt bilder SAMTIDIGT (snabbare), en batch per anrop
    // så vi håller oss under Vercels 10s-tak.
    let changed = 0
    let saved = 0
    const batch = bigOnes.slice(0, BATCH)

    const processOne = async (f: { path: string; size: number | null }) => {
      try {
        const dl = await fetch(`${SB}/storage/v1/object/${BUCKET}/${encodeURI(f.path)}`, { headers: H, cache: 'no-store' })
        if (!dl.ok) return
        const buf = Buffer.from(await dl.arrayBuffer())
        if (buf.length < MIN_BYTES) return
        const out = await sharp(buf)
          .rotate()
          .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: QUALITY })
          .toBuffer()
        if (out.length >= buf.length) return // ingen vinst
        const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${encodeURI(f.path)}`, {
          method: 'POST',
          headers: { ...H, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'cache-control': 'max-age=31536000' },
          body: out as any,
        })
        if (!up.ok) return
        changed++
        saved += buf.length - out.length
      } catch {
        // hoppa över trasiga filer
      }
    }

    await Promise.all(batch.map(processOne))

    return NextResponse.json({
      mode: 'skarpt',
      stora_bilder: bigOnes.length,
      behandlade_denna_körning: batch.length,
      krympta: changed,
      sparat_mb: mb(saved),
      done: bigOnes.length <= BATCH,
      tips: bigOnes.length <= BATCH ? 'Klart!' : 'Kör igen tills done=true.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'okänt fel' }, { status: 500 })
  }
}
