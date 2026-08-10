import { NextRequest, NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Tar emot en bild (data-URL) och ber Claude om ett förslag på rubrik,
// beskrivning och kategori för ett guldföremål. Nyckeln stannar på servern.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    // Funktionen är byggd men inte aktiverad än – klienten döljer knappen snyggt.
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

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

  const prompt = `Du skriver säljande annonstext för ett guldföremål som ska läggas ut på en svensk guldauktion. Bilderna visar SAMMA föremål från olika vinklar. Målet är att locka handlare att buda, inte att analysera bilden.

Svara ENDAST med giltig JSON, inga andra ord, i formatet:
{"title": "...", "description": "...", "category": "..."}

STEG 1 – avgör exakt vilken typ av föremål det är, det är det viktigaste:
- Är det en ring, ett armband, ett halsband, ett par örhängen eller ett hänge? Blanda ALDRIG ihop en ring med ett armband. En liten cirkel som får plats på ett finger är en ring, inte ett armband.
- Ringtyper: en ring med en rad infattade stenar runt om är en alliansring (eller eternityring om stenarna går hela varvet). Andra: vigselring/slätring, solitär (en stor sten), signetring, kattfotsring.
- Länktyper (halsband/armband): pansarlänk, kejsarlänk, cordell/kordel, ankarlänk, bismarck, figaro, bröstlänk.
- Sätt category till exakt en ur denna lista, matchande typen: ${CATEGORIES.join(', ')}.

STEG 2 – skriv annonsen:
- Ton: professionell, självsäker och lyftande, som ett auktionshus. Skriv i påståendeform.
- Referera ALDRIG till fotot/bilden och använd ALDRIG osäkra ord ("verkar", "ser ut att", "det går inte att avgöra", "från bilden").
- title: kort, säljande, max 6 ord, och måste innehålla rätt föremålstyp (t.ex. "Elegant alliansring i vitguld").
- description: 2–3 säljande meningar som nämner rätt modell/typ, stil och uttryck.

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
