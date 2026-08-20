import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { dealerTotal } from '@/lib/fees'
import { getPaymentProvider, paymentsConfigured } from '@/lib/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST { orderId } — the winning dealer starts an A2A payment for their order.
// Authenticates the caller, verifies they are the order's dealer and that the
// order is still unpaid, opens a provider payment session, records it on the
// order (privileged write), and returns the hosted redirect URL.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

export async function POST(req: NextRequest) {
  // While Brite's sandbox keys are pending this is the normal state.
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

  // Authenticate the caller against Supabase (cookie session).
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Load the order (RLS lets the dealer read their own order).
  const { data: order } = await supabase
    .from('orders')
    .select('id, dealer_id, amount, dealer_paid_at, payment_status')
    .eq('id', orderId)
    .single()
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
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
        payment_provider: process.env.PAYMENT_PROVIDER || 'brite',
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
