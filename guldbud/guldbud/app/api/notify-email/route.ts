import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called by a Supabase Database Webhook whenever a row is inserted into
// public.notifications. It looks up the recipient's e-mail, enriches the
// message with the related item (image, specs, current top bid) and sends a
// branded e-mail via Resend. Configure the webhook to send the header
// `x-webhook-secret: <EMAIL_WEBHOOK_SECRET>`.

import { DEALER_COMMISSION_LABEL } from '@/lib/fees'

const FROM = process.env.EMAIL_FROM || 'GuldBud <onboarding@resend.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'
// Mottagningsadress för föremål. Byt till er box-adress innan lansering.
const SHIP_ADDR = 'GuldBud AB, Storgatan 1, 111 22 Stockholm'

function esc(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sek(n: number) {
  return new Intl.NumberFormat('sv-SE').format(n) + ' kr'
}

type Item = {
  id: string
  title: string
  image_urls?: string[]
  weight_grams?: number
  karat?: string
  category?: string
}

// Numrerad instruktionsruta som visas i mejlet.
function stepsBox(heading: string, steps: string[], footer?: string) {
  const rows = steps
    .map(
      (s, i) =>
        `<tr><td style="color:#B8860B;font-weight:700;font-size:13px;padding:3px 8px 3px 0;vertical-align:top">${
          i + 1
        }.</td><td style="color:#c9a84c;font-size:13px;line-height:1.55;padding:3px 0">${s}</td></tr>`
    )
    .join('')
  return `<div style="margin-top:18px;border:1px solid #3d2d0f;border-radius:12px;padding:16px;background:#0f0a04">
    <p style="color:#f5e6c8;font-size:14px;font-weight:600;margin:0 0 10px">${esc(heading)}</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    ${footer ? `<p style="color:#8B6914;font-size:12px;margin:12px 0 0;line-height:1.5">${footer}</p>` : ''}
  </div>`
}

// Färdiga instruktioner beroende på vilken notis det gäller, så varje part
// vet exakt vad som händer efter en avslutad affär.
function instructionsFor(title: string): string {
  const t = title.toLowerCase()
  // Välkomstbrev – så kommer man igång.
  if (t.includes('välkommen')) {
    return stepsBox(
      'Så kommer du igång',
      [
        'Fotografera ditt föremål och fyll i vikt och karat.',
        'Auktoriserade guldhandlare budar mot varandra om ditt guld.',
        'Du väljer om du accepterar högsta budet och får betalt. Helt gratis för dig.',
      ],
      'Det tar under fem minuter att lägga ut ditt första föremål.'
    )
  }
  // Säljaren – affären är skapad, skicka in direkt (påsen är på väg men behöver inte inväntas).
  if (t.includes('affär skapad') || t.includes('skicka in')) {
    return stepsBox(
      'Så här slutför du affären',
      [
        'En säkerhetspåse är på väg till dig, men du kan posta redan idag utan att vänta på den.',
        `Skicka föremålet som <strong style="color:#f5e6c8">rekommenderat och försäkrat</strong> brev till: <strong style="color:#f5e6c8">${SHIP_ADDR}</strong>.`,
        'Vi verifierar äktheten så snart vi tagit emot föremålet.',
        `Du får betalt, normalt inom <strong style="color:#f5e6c8">1–2 bankdagar</strong> efter verifieringen.`,
      ],
      'Att sälja är helt kostnadsfritt för dig. Har du frågor når du oss direkt i affären.'
    )
  }
  // Handlaren – du vann budgivningen, betala så går affären vidare.
  if (t.includes('accepterades') || t.includes('bud accepterat') || t.includes('vann')) {
    return stepsBox(
      'Så går affären vidare',
      [
        `Betala budet + <strong style="color:#f5e6c8">${DEALER_COMMISSION_LABEL}</strong> provision <strong style="color:#f5e6c8">omgående</strong>. Betalningsinstruktioner finns i affären.`,
        'Föremålet är redan ditt, betalningen sätter igång affären.',
        'Säljaren skickar in det och vi äkthetskontrollerar det.',
        'Vi skickar sedan föremålet vidare till dig.',
      ],
      'Följ varje steg och skriv till oss under Affärer.'
    )
  }
  return ''
}

function emailHtml(opts: {
  title: string
  message: string
  link: string | null
  item: Item | null
  topBid: number | null
  cta: string
  extra: string
}) {
  const { title, message, link, item, topBid, cta, extra } = opts
  const href = link ? `${SITE}${link}` : null

  const image =
    item?.image_urls?.[0]
      ? `<a href="${href || SITE}"><img src="${esc(item.image_urls[0])}" alt="${esc(item.title)}" width="416" style="width:100%;max-width:416px;height:auto;border-radius:12px;display:block;margin:0 0 20px;background:#0f0a04" /></a>`
      : ''

  const specsParts = [item?.category, item?.weight_grams ? `${item.weight_grams} g` : '', item?.karat]
    .filter(Boolean)
    .join(' · ')
  const specs = item
    ? `<p style="color:#8B6914;font-size:13px;margin:0 0 4px">${esc(specsParts)}</p>`
    : ''
  const itemName = item ? `<p style="color:#f5e6c8;font-size:16px;font-weight:600;margin:0 0 6px">${esc(item.title)}</p>` : ''
  const top =
    topBid != null
      ? `<p style="color:#D4AF37;font-size:15px;font-weight:600;margin:0 0 4px">Högsta bud: ${sek(topBid)}</p>`
      : ''

  const button = href
    ? `<a href="${href}" style="display:inline-block;margin-top:22px;background:#B8860B;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:600;font-size:14px">${esc(cta)}</a>`
    : ''

  return `<!doctype html><html><body style="margin:0;background:#0f0a04;padding:32px 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#1a1208;border:1px solid #3d2d0f;border-radius:16px;padding:28px">
      <div style="text-align:center;margin-bottom:22px">
        <span style="font-family:Georgia,serif;font-style:italic;font-size:30px;color:#D4AF37">GuldBud</span>
        <div style="color:#8B6914;font-size:9px;letter-spacing:3px;margin-top:2px">SVERIGES GULDAUKTION</div>
      </div>
      <h1 style="color:#f5e6c8;font-size:18px;margin:0 0 16px">${esc(title)}</h1>
      ${image}
      ${itemName}
      ${specs}
      ${top}
      <p style="color:#c9a84c;font-size:14px;line-height:1.6;margin:10px 0 0">${esc(message)}</p>
      ${extra}
      ${button}
      <p style="color:#5a4020;font-size:11px;margin-top:28px">Du får det här mejlet för att du har ett konto på GuldBud.</p>
    </div>
  </body></html>`
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (!process.env.EMAIL_WEBHOOK_SECRET || secret !== process.env.EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY
  if (!supabaseUrl || !serviceKey || !resendKey) {
    return NextResponse.json({ error: 'missing env' }, { status: 500 })
  }
  const sb = (path: string) =>
    fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    })

  let record: any
  try {
    const body = await req.json()
    record = body.record || body
  } catch {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 })
  }
  if (!record?.user_id || !record?.title) {
    return NextResponse.json({ ok: true, skipped: 'no record' })
  }

  const uuid = /^[0-9a-f-]{36}$/i
  const userId = String(record.user_id)
  if (!uuid.test(userId)) return NextResponse.json({ ok: true, skipped: 'bad user_id' })

  // Recipient e-mail + notification preference.
  const profiles = await (
    await sb(`profiles?id=eq.${encodeURIComponent(userId)}&select=email,email_notifications`)
  ).json()
  const prof = Array.isArray(profiles) ? profiles[0] : null
  const email = prof?.email
  if (!email) return NextResponse.json({ ok: true, skipped: 'no email' })
  if (prof?.email_notifications === false) return NextResponse.json({ ok: true, skipped: 'opted out' })

  // Enrich with the related item + current top bid, if any.
  let item: Item | null = null
  let topBid: number | null = null
  if (record.item_id && uuid.test(String(record.item_id))) {
    const itemId = encodeURIComponent(String(record.item_id))
    const items = await (
      await sb(`items?id=eq.${itemId}&select=id,title,image_urls,weight_grams,karat,category`)
    ).json()
    item = Array.isArray(items) && items[0] ? items[0] : null
    const bids = await (
      await sb(`bids?item_id=eq.${itemId}&select=amount&order=amount.desc&limit=1`)
    ).json()
    if (Array.isArray(bids) && bids[0]) topBid = bids[0].amount
  }

  const link = record.link || (record.item_id ? `/auctions/${record.item_id}` : null)
  const t = String(record.title).toLowerCase()
  const isOrder = !!link && link.includes('/orders/')
  const cta = t.includes('överbjuden')
    ? 'Höj ditt bud →'
    : t.includes('vann')
    ? 'Betala och följ affären →'
    : t.includes('grattis') || t.includes('högsta bud')
    ? 'Godkänn budet →'
    : t.includes('välkommen')
    ? 'Kom igång →'
    : isOrder
    ? 'Öppna affären →'
    : record.item_id
    ? 'Öppna auktionen →'
    : 'Öppna på GuldBud →'
  const extra = instructionsFor(String(record.title))

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: record.title,
      html: emailHtml({ title: record.title, message: record.message || '', link, item, topBid, cta, extra }),
    }),
  })

  if (!sendRes.ok) {
    const detail = await sendRes.text()
    return NextResponse.json({ error: 'resend failed', detail }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
