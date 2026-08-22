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
const TIME_BUDGET_MS = 8000

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const run = url.searchParams.get('run') === '1'

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
        const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
        if (prof?.role === 'admin') authed = true
      }
    }
  }
  if (!authed) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const SB = process.env.NEXT_PUBLIC_SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SB || !KEY) return NextResponse.json({ error: 'missing env' }, { status: 500 })
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

  const listFolder = async (prefix: string): Promise<any[]> => {
    const res = await fetch(`${SB}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
      cache: 'no-store',
    })
    return res.ok ? await res.json() : []
  }

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

  const started = Date.now()
  let scanned = 0
  let changed = 0
  let saved = 0
  let candidates = 0
  let timedOut = false

  for (const f of files) {
    if (f.size != null && f.size < MIN_BYTES) continue // redan liten
    candidates++
    if (Date.now() - started > TIME_BUDGET_MS) {
      timedOut = true
      continue
    }
    scanned++
    try {
      const dl = await fetch(`${SB}/storage/v1/object/${BUCKET}/${encodeURI(f.path)}`, { headers: H, cache: 'no-store' })
      if (!dl.ok) continue
      const buf = Buffer.from(await dl.arrayBuffer())
      if (buf.length < MIN_BYTES) continue
      const out = await sharp(buf)
        .rotate()
        .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
      if (out.length >= buf.length) continue // ingen vinst
      if (run) {
        const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${encodeURI(f.path)}`, {
          method: 'POST',
          headers: { ...H, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'cache-control': 'max-age=31536000' },
          body: out as any,
        })
        if (!up.ok) continue
      }
      changed++
      saved += buf.length - out.length
    } catch {
      // hoppa över trasiga filer
    }
  }

  const mb = (b: number) => Math.round((b / 1024 / 1024) * 10) / 10
  // Kvar att göra ≈ kandidater vi inte hann med (grov uppskattning).
  const remaining = timedOut ? candidates - scanned : 0
  return NextResponse.json({
    mode: run ? 'skarpt' : 'testkörning',
    filer_totalt: files.length,
    stora_bilder: candidates,
    behandlade_denna_körning: scanned,
    krympta: changed,
    sparat_mb: mb(saved),
    kvar_ungefär: remaining,
    done: !timedOut,
    tips: timedOut ? 'Öppna samma länk igen tills done=true.' : run ? 'Klart!' : 'Lägg till &run=1 för att skriva om på riktigt.',
  })
}
