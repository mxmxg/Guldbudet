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

  let dataUrl: string
  try {
    const body = await req.json()
    dataUrl = body.dataUrl
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 })
  }
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || '')
  if (!m) return NextResponse.json({ error: 'bad_image' }, { status: 400 })
  const mediaType = m[1]
  const base64 = m[2]

  const prompt = `Du skriver säljande annonstext för ett guldföremål som ska läggas ut på en svensk guldauktion. Målet är att locka handlare att buda, inte att analysera bilden.

Svara ENDAST med giltig JSON, inga andra ord, i formatet:
{"title": "...", "description": "...", "category": "..."}

Ton och stil:
- Skriv som en professionell annons: självsäker, tilltalande och lyftande, men trovärdig. Tänk auktionshus, inte utredning.
- Skriv i påståendeform. Referera ALDRIG till fotot eller bilden, och använd ALDRIG osäkra ord som "verkar", "ser ut att", "det går inte att avgöra", "från bilden" eller liknande brasklappar.
- Lyft föremålets karaktär: modell/länktyp, stil, uttryck och finish. Måla upp något en köpare vill ha.

Innehåll:
- Identifiera den specifika modellen med korrekta svenska guldsmedstermer: länktyp (t.ex. pansarlänk, kejsarlänk, cordell/kordel, ankarlänk, bismarck, figaro, bröstlänk), ringtyp (t.ex. vigselring, signetring, solitär) eller annan smyckestyp.
- title: kort, säljande rubrik på svenska, max 6 ord (t.ex. "Klassisk kejsarlänk i guld"). Ingen prissättning.
- description: 2–3 säljande meningar på svenska som beskriver modell/länktyp, stil och uttryck.
- category: välj exakt en ur denna lista: ${CATEGORIES.join(', ')}.

Viktigt:
- Nämn INTE vikt, längd eller exakt karat, och skriv inga meningar om att sådant inte kan avgöras. Säljaren fyller i de uppgifterna separat, så utelämna dem helt.
- Hitta inte på ett modellnamn du inte är säker på. Är du osäker, beskriv stilen säljande i stället för att gissa fel.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
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
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: prompt },
            ],
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
  }
}
