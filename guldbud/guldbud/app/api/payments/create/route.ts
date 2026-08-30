import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { dealerTotal } from '@/lib/fees'
import { getPaymentProvider, paymentsConfigured, PAYMENT_PROVIDER_NAME } from '@/lib/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST { orderId }: the winning dealer starts the payment for their order.
// Authenticates the caller, verifies they are the order's dealer and that the
// order is still unpaid, opens a provider payment session, records it on the
// order (privileged write), and returns the hosted redirect URL.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

export async function POST(req: NextRequest) {
  // Until the live Stripe keys are set in Vercel this is the normal state.
  if (!paymentsConfigured()) {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 })
  }

  let orderId: string
  try {
    const body = await req.json()
    orderId = String(body?.orderId || '')
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 })
  }
  if (!orderId) {
    return NextResponse.json({ error: 'missing_order_id' }, { status: 400 })
  }

  // Authenticate the caller the same way as the rest of the app's routes:
  // a Bearer access token read straight from the request, not next/headers
  // cookies (which do not reliably mirror the session in a route handler and
  // gave a spurious 401 here).
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
  const serviceHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  // Read the order via the service role, then enforce ownership ourselves.
  const found = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,dealer_id,amount,status,dealer_paid_at,payment_status`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const rows = await found.json().catch(() => [])
  const order = Array.isArray(rows) ? rows[0] : null
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  // Only the winning dealer may pay, and only while still unpaid.
  if (order.dealer_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (order.dealer_paid_at) {
    return NextResponse.json({ error: 'already_paid' }, { status: 409 })
  }
  // Never take money on a dead deal: a cancelled/completed order is not payable.
  if (order.status === 'cancelled' || order.status === 'completed') {
    return NextResponse.json({ error: 'order_not_payable' }, { status: 409 })
  }
  // A flagged payment is waiting for a human. Opening a new session here would
  // overwrite payment_status with 'pending' and erase the only durable trace of
  // a payment that arrived with the wrong amount or currency, which is exactly
  // the case that must not disappear. Admin clears it by crediting or reopening
  // the order, both of which reset payment_status.
  if (order.payment_status === 'amount_mismatch') {
    return NextResponse.json({ error: 'payment_under_review' }, { status: 409 })
  }

  // A suspended dealer cannot pay (e.g. auto-suspended for a prior non-payment).
  const profRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=suspended`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const profRows = await profRes.json().catch(() => [])
  if (Array.isArray(profRows) && profRows[0]?.suspended) {
    return NextResponse.json({ error: 'dealer_suspended' }, { status: 403 })
  }

  const amount = dealerTotal(order.amount)
  const returnUrl = `${SITE}/orders/${order.id}`

  let redirectUrl: string
  let providerReference: string
  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      orderId: order.id,
      amount,
      reference: order.id,
      returnUrl,
    })
    redirectUrl = result.redirectUrl
    providerReference = result.providerReference
  } catch (err: any) {
    return NextResponse.json(
      { error: 'provider_error', detail: err?.message || 'unknown' },
      { status: 502 }
    )
  }

  // Persist the pending payment with the service role so it is not blocked by
  // RLS. This runs alongside the manual admin dealer_paid_at path, never
  // replacing it: only the callback sets dealer_paid_at.
  const patch = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        // The constant, not an env value: what gets recorded must be the rail
        // that actually ran, and env and adapter could drift apart.
        payment_provider: PAYMENT_PROVIDER_NAME,
        payment_reference: providerReference,
        payment_status: 'pending',
      }),
      cache: 'no-store',
    }
  )
  if (!patch.ok) {
    const detail = await patch.text().catch(() => '')
    return NextResponse.json({ error: 'persist_failed', detail }, { status: 500 })
  }

  return NextResponse.json({ redirectUrl })
}
