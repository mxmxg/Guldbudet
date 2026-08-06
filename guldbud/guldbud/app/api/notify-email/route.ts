import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called by a Supabase Database Webhook whenever a row is inserted into
// public.notifications. It looks up the recipient's e-mail, enriches the
// message with the related item (image, specs, current top bid) and sends a
// branded e-mail via Resend. Configure the webhook to send the header
// `x-webhook-secret: <EMAIL_WEBHOOK_SECRET>`.

const FROM = process.env.EMAIL_FROM || 'GuldBud <onboarding@resend.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

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

function emailHtml(opts: {
  title: string
  message: string
  link: string | null
  item: Item | null
  topBid: number | null
  cta: string
}) {
  const { title, message, link, item, topBid, cta } = opts
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

  // Recipient e-mail.
  const profiles = await (await sb(`profiles?id=eq.${record.user_id}&select=email`)).json()
  const email = Array.isArray(profiles) && profiles[0]?.email
  if (!email) return NextResponse.json({ ok: true, skipped: 'no email' })

  // Enrich with the related item + current top bid, if any.
  let item: Item | null = null
  let topBid: number | null = null
  if (record.item_id) {
    const items = await (
      await sb(`items?id=eq.${record.item_id}&select=id,title,image_urls,weight_grams,karat,category`)
    ).json()
    item = Array.isArray(items) && items[0] ? items[0] : null
    const bids = await (
      await sb(`bids?item_id=eq.${record.item_id}&select=amount&order=amount.desc&limit=1`)
    ).json()
    if (Array.isArray(bids) && bids[0]) topBid = bids[0].amount
  }

  const link = record.link || (record.item_id ? `/auctions/${record.item_id}` : null)
  const t = String(record.title).toLowerCase()
  const cta = t.includes('överbjuden')
    ? 'Höj ditt bud →'
    : record.item_id
    ? 'Öppna auktionen →'
    : 'Öppna på GuldBud →'

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: record.title,
      html: emailHtml({ title: record.title, message: record.message || '', link, item, topBid, cta }),
    }),
  })

  if (!sendRes.ok) {
    const detail = await sendRes.text()
    return NextResponse.json({ error: 'resend failed', detail }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
