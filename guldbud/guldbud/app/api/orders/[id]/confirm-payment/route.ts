import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/orders/[id]/confirm-payment
//
// Säljaren bekräftar att köpeskillingen kommit in på kontot. Det är signalen
// som släpper föremålet vidare till handlaren under väg C: utbetalningsspärren
// i databasen (enforce_payment_before_release) tillåter inte verified_paid
// eller shipped_to_dealer utan dealer_paid_at, och det är den kolumnen som
// sätts här.
//
// Går via servicerollen eftersom parterna bara har läsrätt på orders i RLS.
// Rutten kontrollerar själv att det är säljaren som bekräftar, att affären
// lever, och att GuldBud faktiskt tagit emot och kontrollerat föremålet:
// innan dess har handlaren inte fått kontouppgifterna och ska inte ha
// betalat.
//
// Admin kan fortfarande registrera betalningen manuellt i affärsvyn, till
// exempel när säljaren bekräftat per telefon.

const CONFIRMABLE_STATES = ['received', 'dealer_paid', 'verified_paid', 'shipped_to_dealer', 'completed']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id
  if (!orderId) return NextResponse.json({ error: 'missing_order_id' }, { status: 400 })

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

  const found = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
      orderId
    )}&select=id,seller_id,status,dealer_paid_at,refunded_at`,
    { headers, cache: 'no-store' }
  )
  const rows = await found.json().catch(() => [])
  const order = Array.isArray(rows) ? rows[0] : null
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  // Bara säljaren. Samma svar som för en affär som inte finns hade dolt att
  // affären existerar, men 403 räcker här: den som inte är part kan ändå
  // inte läsa raden via RLS.
  if (order.seller_id !== user.id) {
    return NextResponse.json({ error: 'not_seller' }, { status: 403 })
  }
  if (order.refunded_at || order.status === 'cancelled') {
    return NextResponse.json({ error: 'deal_reverted' }, { status: 409 })
  }
  if (order.dealer_paid_at) {
    return NextResponse.json({ ok: true, already: true })
  }
  if (!CONFIRMABLE_STATES.includes(order.status)) {
    return NextResponse.json({ error: 'not_received' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const res = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ dealer_paid_at: now, updated_at: now }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json({ error: 'update_failed', detail }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
