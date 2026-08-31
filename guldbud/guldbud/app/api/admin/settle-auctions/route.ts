import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/admin/settle-auctions
// Kör settle_ended_auctions direkt, i stället för att vänta på cron-jobbet.
// Används när admin avslutar en auktion i förtid: säljaren ska notifieras nu,
// inte upp till en minut senare.
//
// Finns som rutt för att funktionen med flit inte får anropas av vanliga
// användare. supabase-schema.sql återkallar exekveringsrätten från anon och
// authenticated som djupförsvar, eftersom den annars gick att trigga rakt via
// PostgREST. Adminpanelen anropade den ändå via supabase.rpc() från
// webbläsaren, inuti ett tomt catch-block, så anropet misslyckades tyst vid
// varje klick. Servicerollen går förbi återkallandet och lämnar aldrig servern.

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const {
    data: { user },
  } = await createRouteClient(req).auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  const profRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    { headers, cache: 'no-store' }
  )
  const profRows = await profRes.json().catch(() => [])
  if (!Array.isArray(profRows) || profRows[0]?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/settle_ended_auctions`, {
    method: 'POST',
    headers,
    body: '{}',
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json({ error: 'settle_failed', detail }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
