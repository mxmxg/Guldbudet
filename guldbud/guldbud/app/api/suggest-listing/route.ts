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

  const prompt = `Du är expert på guldsmycken och begagnat guld. Titta på bilden och föreslå säljtext för en svensk guldauktion.

Svara ENDAST med giltig JSON, inga andra ord, i formatet:
{"title": "...", "description": "...", "category": "..."}

Regler:
- Identifiera den specifika modellen/typen med korrekta svenska guldsmedstermer när det syns: länktyp (t.ex. pansarlänk, kejsarlänk, cordell/kordel, ankarlänk, bismarck, figaro, bröstlänk), ringtyp (t.ex. vigselring, signetring, solitär), eller annan smyckestyp. Är du osäker, beskriv formen utan att gissa fel modellnamn.
- title: kort och saklig rubrik på svenska, max 6 ord (t.ex. "Kejsarlänk i 18K guld"). Ingen prissättning.
- description: 2–3 meningar på svenska. Nämn modell/länktyp, synligt skick, eventuell stämpel eller gravyr. Var ärlig och saklig, inga överdrifter.
- category: välj exakt en ur denna lista: ${CATEGORIES.join(', ')}.
- Gissa ALDRIG vikt eller exakt karat om det inte tydligt syns på en stämpel. Hitta inte på modellnamn eller detaljer du inte ser.`

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
