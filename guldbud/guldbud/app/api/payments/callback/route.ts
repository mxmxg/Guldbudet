import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inbound provider callback/webhook. The provider adapter authenticates and
// parses the request; we then look up the order by its stored payment_reference
// (= providerReference) and settle it. Idempotent: an order already marked paid
// is left untouched. Privileged writes go through the service role.

async function handle(req: NextRequest) {
  const provider = getPaymentProvider()

  let verified
  try {
    verified = await provider.verifyCallback(req)
  } catch {
    verified = null
  }
  if (!verified) {
    return NextResponse.json({ error: 'invalid_callback' }, { status: 400 })
  }

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

  // Locate the order by the reference the provider echoed back.
  const ref = encodeURIComponent(verified.providerReference)
  const found = await fetch(
    `${supabaseUrl}/rest/v1/orders?payment_reference=eq.${ref}&select=id,dealer_paid_at,payment_status`,
    { headers, cache: 'no-store' }
  )
  const rows = await found.json().catch(() => [])
  const order = Array.isArray(rows) ? rows[0] : null
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  // Idempotency: never re-settle an order that is already paid.
  if (order.dealer_paid_at) {
    return NextResponse.json({ ok: true, idempotent: true })
  }

  const patch =
    verified.status === 'paid'
      ? { payment_status: 'paid', dealer_paid_at: new Date().toISOString() }
      : { payment_status: 'failed' }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
      cache: 'no-store',
    }
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json({ error: 'update_failed', detail }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: verified.status })
}

export async function POST(req: NextRequest) {
  return handle(req)
}

// Some A2A providers return the dealer via a GET redirect that doubles as the
// status ping. Support both; the adapter decides what it can verify.
export async function GET(req: NextRequest) {
  return handle(req)
}
