import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called by a Supabase Database Webhook whenever a row is inserted into
// public.notifications. It looks up the recipient's e-mail and sends the
// notification via Resend. Configure the webhook to send the header
// `x-webhook-secret: <EMAIL_WEBHOOK_SECRET>`.

// Avsändaradress och sajt-URL styrs av miljövariabler så vi kan köra i
// testläge (onboarding@resend.dev) innan en egen domän är verifierad, och
// byta till no-reply@guldbud.com sedan – utan kodändring.
const FROM = process.env.EMAIL_FROM || 'GuldBud <onboarding@resend.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

function emailHtml(title: string, message: string, link?: string | null) {
  const button = link
    ? `<a href="${SITE}${link}" style="display:inline-block;margin-top:20px;background:#B8860B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px">Öppna på GuldBud</a>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#0f0a04;padding:32px 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#1a1208;border:1px solid #3d2d0f;border-radius:16px;padding:32px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-family:Georgia,serif;font-style:italic;font-size:32px;color:#D4AF37">GuldBud</span>
        <div style="color:#8B6914;font-size:9px;letter-spacing:3px;margin-top:2px">SVERIGES GULDAUKTION</div>
      </div>
      <h1 style="color:#f5e6c8;font-size:18px;margin:0 0 12px">${title}</h1>
      <p style="color:#c9a84c;font-size:14px;line-height:1.6;margin:0">${message || ''}</p>
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

  // Look up the recipient's e-mail with the service role.
  const profRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${record.user_id}&select=email`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const profiles = await profRes.json()
  const email = Array.isArray(profiles) && profiles[0]?.email
  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'no email' })
  }

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: record.title,
      html: emailHtml(record.title, record.message || '', record.link),
    }),
  })

  if (!sendRes.ok) {
    const detail = await sendRes.text()
    return NextResponse.json({ error: 'resend failed', detail }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
