import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { dealerTotal } from '@/lib/fees'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inbound provider callback/webhook. The provider adapter authenticates and
// parses the request; we then look up the order by its stored payment_reference
// (= providerReference) and settle it. Idempotent: an order already marked paid
// is left untouched. Privileged writes go through the service role.
//
// A verified signature proves the callback came from the provider, NOT that the
// right amount was collected, so before settling we also check the money against
// the order's own expected total (see verifyAmount below).

// GuldBud settles in SEK only. Deliberately a constant and NOT read from
// STRIPE_CURRENCY: the whole point of the currency check is to catch a
// misconfigured STRIPE_CURRENCY, and comparing that env var against itself
// would always pass.
const SETTLEMENT_CURRENCY = 'sek'

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

  // Locate the order. Prefer OUR order id (echoed back by the provider), so a
  // completed session settles the right order even if a newer session has since
  // overwritten payment_reference. Fall back to the provider session id.
  const select = 'select=id,item_id,amount,dealer_paid_at,payment_status'
  let order: any = null
  if (verified.reference) {
    const byId = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(verified.reference)}&${select}`,
      { headers, cache: 'no-store' }
    )
    const rows = await byId.json().catch(() => [])
    order = Array.isArray(rows) ? rows[0] : null
  }
  if (!order) {
    const byRef = await fetch(
      `${supabaseUrl}/rest/v1/orders?payment_reference=eq.${encodeURIComponent(verified.providerReference)}&${select}`,
      { headers, cache: 'no-store' }
    )
    const rows = await byRef.json().catch(() => [])
    order = Array.isArray(rows) ? rows[0] : null
  }
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  // Idempotency: never re-settle an order that is already paid.
  if (order.dealer_paid_at) {
    return NextResponse.json({ ok: true, idempotent: true })
  }

  // Money check. We created this session ourselves at dealerTotal(), so a
  // mismatch means the payment does not belong to this order at its current
  // price: a wrong-currency misconfiguration, a stale session created before the
  // fee model changed, or a session minted with a leaked API key. Settling on it
  // would release the seller's full payout against money we did not receive, so
  // we flag it for a human instead and leave dealer_paid_at unset.
  if (verified.status === 'paid' && typeof verified.amountMinor === 'number') {
    const expectedMinor = Math.round(dealerTotal(Number(order.amount) || 0) * 100)
    const currencyOk = !verified.currency || verified.currency === SETTLEMENT_CURRENCY
    if (verified.amountMinor !== expectedMinor || !currencyOk) {
      const detail =
        `Betalning på ${(verified.amountMinor / 100).toLocaleString('sv-SE')} ` +
        `${(verified.currency || SETTLEMENT_CURRENCY).toUpperCase()} matchar inte orderns ` +
        `${(expectedMinor / 100).toLocaleString('sv-SE')} ${SETTLEMENT_CURRENCY.toUpperCase()}.`

      const flagged = await fetch(
        `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({ payment_status: 'amount_mismatch' }),
          cache: 'no-store',
        }
      )
      // If we could not even record the flag, answer 500 so the provider retries
      // and we get another chance rather than silently dropping the event.
      if (!flagged.ok) {
        return NextResponse.json({ error: 'flag_failed' }, { status: 500 })
      }

      // Alert every admin. Same notifications table the rest of the flow uses,
      // so this also reaches them by e-mail via the notify-email webhook.
      const adminRes = await fetch(`${supabaseUrl}/rest/v1/profiles?role=eq.admin&select=id`, {
        headers,
        cache: 'no-store',
      })
      const admins = await adminRes.json().catch(() => [])
      if (Array.isArray(admins) && admins.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify(
            admins.map((a: any) => ({
              user_id: a.id,
              title: 'Betalning med fel belopp, kräver hantering',
              message: `${detail} Ordern är INTE markerad som betald och ingen utbetalning har släppts. Kontrollera betalningen hos betalleverantören innan något släpps.`,
              item_id: order.item_id,
              link: `/admin/orders/${order.id}`,
            }))
          ),
          cache: 'no-store',
        })
      }

      // 200 so the provider stops retrying: a retry redelivers the same amount
      // and cannot resolve this. It needs a human.
      return NextResponse.json({ ok: false, error: 'amount_mismatch' })
    }
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
