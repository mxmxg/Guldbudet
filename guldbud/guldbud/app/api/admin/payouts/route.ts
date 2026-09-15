import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/admin/payouts  { orderId, method: 'bank_transfer' }
//
// Registrerar en utbetalning till säljaren. Samma grindar som databasens
// utbetalningsspärr, kontrollerade här också eftersom utbetalningen lämnar
// systemet: handlaren ska ha betalat, penningtvättsgranskningen vara clear
// eller approved, och affären varken krediterad eller avbruten.
//
// Revisionsraden i payouts skrivs INNAN pengarna skickas. Kan den inte
// skrivas sker ingen utbetalning, samma princip som identity_disclosures.
//
// Banköverföring är enda metoden: admin intygar att överföringen är gjord i
// internetbanken, och raden bokförs direkt som betald. Swish är struket och
// koden borttagen 2026-09-15, se beslutsloggen.

function ref(orderNo?: number | null) {
  return 'GB-' + String(orderNo ?? 0).padStart(6, '0')
}

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

  const body = await req.json().catch(() => ({}))
  const orderId: string = body?.orderId
  const method: string = body?.method
  if (!orderId || method !== 'bank_transfer') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const orderRes = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,order_no,amount,status,dealer_paid_at,refunded_at,seller_id`,
    { headers, cache: 'no-store' }
  )
  const orders = await orderRes.json().catch(() => [])
  const order = Array.isArray(orders) ? orders[0] : null
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  // Grindarna, i klartext så felet går att agera på.
  if (!order.dealer_paid_at) {
    return NextResponse.json({ error: 'dealer_not_paid' }, { status: 409 })
  }
  if (order.refunded_at || order.status === 'cancelled') {
    return NextResponse.json({ error: 'order_closed' }, { status: 409 })
  }
  const amlRes = await fetch(
    `${supabaseUrl}/rest/v1/order_aml?order_id=eq.${encodeURIComponent(orderId)}&select=aml_status`,
    { headers, cache: 'no-store' }
  )
  const amlRows = await amlRes.json().catch(() => [])
  const amlStatus = Array.isArray(amlRows) ? amlRows[0]?.aml_status : null
  if (amlStatus && amlStatus !== 'clear' && amlStatus !== 'approved') {
    return NextResponse.json({ error: 'aml_not_cleared' }, { status: 409 })
  }

  // En affär, en utbetalning: en rad som är initiated eller paid blockerar nya.
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/payouts?order_id=eq.${encodeURIComponent(orderId)}&status=in.(initiated,paid)&select=id,status`,
    { headers, cache: 'no-store' }
  )
  const existing = await existingRes.json().catch(() => [])
  if (Array.isArray(existing) && existing.length > 0) {
    return NextResponse.json({ error: 'payout_exists', status: existing[0].status }, { status: 409 })
  }

  // Kontrollerar bara att säljaren finns. Kontouppgifterna läser admin i
  // affärsvyn innan överföringen görs, de skickas inte härifrån.
  const sellerRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(order.seller_id)}&select=id`,
    { headers, cache: 'no-store' }
  )
  const sellers = await sellerRes.json().catch(() => [])
  const seller = Array.isArray(sellers) ? sellers[0] : null
  if (!seller) return NextResponse.json({ error: 'seller_not_found' }, { status: 404 })

  const reference = ref(order.order_no)

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/payouts`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      method: 'bank_transfer',
      status: 'paid',
      reference,
      created_by: user.id,
      paid_at: new Date().toISOString(),
    }),
    cache: 'no-store',
  })
  if (!insertRes.ok) {
    const detail = await insertRes.text().catch(() => '')
    return NextResponse.json({ error: 'payout_log_failed', detail }, { status: 502 })
  }
  return NextResponse.json({ ok: true, status: 'paid' })
}
