import { NextRequest, NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/catalog'
import { createRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Tar emot en bild (data-URL) och ber Claude om ett förslag på rubrik,
// beskrivning och kategori för ett guldföremål. Nyckeln stannar på servern.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

// Enkel rate limit per användare (best-effort per serverinstans). Skyddar den
// betalda AI-modellen mot loop-missbruk. Legitimt annonsflöde gör bara ett fåtal
// anrop, så taket är rymligt. En instans kan nollställas vid cold start, det är
// ok, det verkliga skyddet är inloggningskravet nedan.
const RL_MAX = 20
const RL_WINDOW_MS = 5 * 60 * 1000
const rlHits = new Map<string, number[]>()
function allowRequest(userId: string): boolean {
  const now = Date.now()
  const recent = (rlHits.get(userId) || []).filter((t) => now - t < RL_WINDOW_MS)
  if (recent.length >= RL_MAX) {
    rlHits.set(userId, recent)
    return false
  }
  recent.push(now)
  rlHits.set(userId, recent)
  return true
}

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    // Funktionen är byggd men inte aktiverad än, klienten döljer knappen snyggt.
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

  // Kräv inloggad användare. Den betalda vision-modellen får inte vara öppen för
  // anonymt/scriptat missbruk (kostnads- och DoS-skydd).
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const {
    data: { user },
  } = await createRouteClient(req).auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!allowRequest(user.id)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  let dataUrls: string[]
  try {
    const body = await req.json()
    dataUrls = body.dataUrls || (body.dataUrl ? [body.dataUrl] : [])
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 })
  }
  // Bygg upp till 3 bildblock så modellen kan avgöra typ från flera vinklar.
  const images: any[] = []
  for (const du of (dataUrls || []).slice(0, 3)) {
    const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(du || '')
    if (m) images.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } })
  }
  if (images.length === 0) return NextResponse.json({ error: 'bad_image' }, { status: 400 })
  // Tak på sammanlagd bildstorlek så en enda begäran inte kan svälla minnet.
  const totalBytes = images.reduce((s, im) => s + (im.source?.data?.length || 0), 0)
  if (totalBytes > 15_000_000) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  const prompt = `Du skriver säljande annonstext för ett guldföremål som ska läggas ut på en svensk guldauktion. Bilderna visar SAMMA föremål från olika vinklar. Målet är att locka handlare att buda, inte att analysera bilden.

Svara ENDAST med giltig JSON, inga andra ord, i formatet:
{"title": "...", "description": "...", "category": "..."}

STEG 1, avgör exakt vilken typ av föremål det är, det är det viktigaste:
- Är det en ring, ett armband, ett halsband, ett par örhängen eller ett hänge? Blanda ALDRIG ihop en ring med ett armband. En liten cirkel som får plats på ett finger är en ring, inte ett armband.
- Ringtyper: en ring med en rad infattade stenar runt om är en alliansring (eller eternityring om stenarna går hela varvet). Andra: vigselring/slätring, solitär (en stor sten), signetring, kattfotsring.
- Länktyper (halsband/armband): pansarlänk, kejsarlänk, cordell/kordel, ankarlänk, bismarck, figaro, bröstlänk.
- Sätt category till exakt en ur denna lista, matchande typen: ${CATEGORIES.join(', ')}.

STEG 2, skriv annonsen:
- Ton: professionell, självsäker och lyftande, som ett auktionshus. Skriv i påståendeform.
- Referera ALDRIG till fotot/bilden och använd ALDRIG osäkra ord ("verkar", "ser ut att", "det går inte att avgöra", "från bilden").
- title: kort, säljande, max 6 ord, och måste innehålla rätt föremålstyp (t.ex. "Elegant alliansring i vitguld").
- description: 2-3 säljande meningar som nämner rätt modell/typ, stil och uttryck.

Viktigt:
- Nämn INTE vikt, längd eller exakt karat, och skriv inga meningar om att sådant inte kan avgöras. Säljaren fyller i det separat.
- Hitta inte på ett modellnamn du inte är säker på. Men var alltid säker på grundtypen (ring/armband/halsband/örhänge/hänge).`

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 30000)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: [...images, { type: 'text', text: prompt }],
          },
        ],
      }),
    })

    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ error: 'ai_failed', detail: txt.slice(0, 300) }, { status: 502 })
    }

    const data = await res.json()
    const text: string = data?.content?.[0]?.text || ''
    // Plocka ut JSON-objektet även om modellen råkar linda in det.
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'no_json' }, { status: 502 })
    let parsed: any
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'no_json' }, { status: 502 })
    }

    const category = CATEGORIES.includes(parsed.category) ? parsed.category : ''
    return NextResponse.json({
      title: String(parsed.title || '').slice(0, 80),
      description: String(parsed.description || '').slice(0, 600),
      category,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'ai_error', detail: String(e?.message || e).slice(0, 200) }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
