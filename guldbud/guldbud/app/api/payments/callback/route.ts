import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { feesAt } from '@/lib/fees'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inbound provider callback/webhook. The provider adapter authenticates and
// parses the request; we then look up the order by its stored payment_reference
// (= providerReference) and settle it. Privileged writes go through the service
// role.
//
// A verified signature proves the callback came from the provider, NOT that the
// callback should settle anything. Three things are checked before we do, and
// each of them answers 200 with ok:false rather than an error, because a retry
// redelivers the same event and can never resolve any of them:
//   1. Is the deal still alive? A credited or cancelled order is never settled.
//   2. Is it already paid? A redelivery of the same session passes silently, a
//      different session means the dealer paid twice.
//   3. Is it the right money? The amount and currency are checked against the
//      order's own expected total.
// Cases 1 and 2 alert admin instead of writing to the order, since there is no
// safe field to write: the state they would overwrite is one admin set on
// purpose.

// GuldBud settles in SEK only. Deliberately a constant and NOT read from
// STRIPE_CURRENCY: the whole point of the currency check is to catch a
// misconfigured STRIPE_CURRENCY, and comparing that env var against itself
// would always pass.
const SETTLEMENT_CURRENCY = 'sek'

// Alert every admin about a callback that needs a human. Uses the same
// notifications table as the rest of the flow, so it also reaches them by
// e-mail via the notify-email webhook. Returns false when nothing could be
// recorded, so the caller can answer 500 and let the provider retry rather
// than dropping the event in silence.
async function alertAdmins(
  supabaseUrl: string,
  headers: Record<string, string>,
  order: any,
  title: string,
  message: string
): Promise<boolean> {
  const adminRes = await fetch(`${supabaseUrl}/rest/v1/profiles?role=eq.admin&select=id`, {
    headers,
    cache: 'no-store',
  })
  const admins = await adminRes.json().catch(() => [])
  if (!Array.isArray(admins) || admins.length === 0) return false

  const res = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(
      admins.map((a: any) => ({
        user_id: a.id,
        title,
        message,
        item_id: order.item_id,
        link: `/admin/orders/${order.id}`,
      }))
    ),
    cache: 'no-store',
  })
  return res.ok
}

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
  const select =
    'select=id,item_id,amount,status,created_at,dealer_paid_at,payment_reference,payment_status,refunded_at'
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

  // Dead deals are never settled. This has to run BEFORE the idempotency check
  // below, because a credit note nulls dealer_paid_at (admin/orders/[id]:
  // refundOrder) and a cancellation for non-payment never set it. Without this
  // guard a late callback would re-arm the payout block on money that has
  // already gone back to the dealer, or on a deal that was closed and the item
  // relisted. The provider can redeliver for days, so this is not theoretical.
  const deadReason = order.refunded_at
    ? 'krediterad'
    : order.status === 'cancelled'
      ? 'avbruten'
      : null
  if (deadReason) {
    // A 'failed' callback on a dead deal changes nothing and needs no human.
    if (verified.status !== 'paid') {
      return NextResponse.json({ ok: true, ignored: deadReason })
    }
    // A 'paid' callback does: real money may have been collected on a deal we
    // have already closed. We touch nothing on the order, since the refund state
    // is what admin deliberately set, and hand it to a human instead.
    const told = await alertAdmins(
      supabaseUrl,
      headers,
      order,
      'Betalning inkom på en ' + deadReason + ' affär',
      `Betalleverantören rapporterar en genomförd betalning på en affär som är ${deadReason}. ` +
        'Ordern är INTE markerad som betald och ingen utbetalning har släppts. ' +
        'Kontrollera hos betalleverantören om pengar faktiskt dragits, och betala i så fall tillbaka dem.'
    )
    if (!told) {
      return NextResponse.json({ error: 'alert_failed' }, { status: 500 })
    }
    // 200: a retry redelivers the same event and cannot resolve this.
    return NextResponse.json({ ok: false, error: 'order_not_payable' })
  }

  // Idempotency: never re-settle an order that is already paid. A redelivery of
  // the same session is the normal case and passes silently. A DIFFERENT session
  // reporting paid is not: the dealer has then paid twice (two sessions can be
  // open at once, since an abandoned one is never closed), and answering
  // "already handled" would leave the second payment unrecorded anywhere.
  if (order.dealer_paid_at) {
    const otherSession =
      verified.status === 'paid' &&
      !!order.payment_reference &&
      order.payment_reference !== verified.providerReference
    if (otherSession) {
      const told = await alertAdmins(
        supabaseUrl,
        headers,
        order,
        'Dubbel betalning på samma affär',
        'Affären är redan betald, men betalleverantören rapporterar ytterligare en ' +
          'genomförd betalning från en annan betalsession. Ordern är oförändrad och ' +
          'inget dubbelt belopp har bokförts. Kontrollera hos betalleverantören och ' +
          'betala tillbaka det överskjutande beloppet till handlaren.'
      )
      if (!told) {
        return NextResponse.json({ error: 'alert_failed' }, { status: 500 })
      }
      return NextResponse.json({ ok: false, error: 'duplicate_payment' })
    }
    return NextResponse.json({ ok: true, idempotent: true })
  }

  // Money check. We created this session ourselves at dealerTotal(), so a
  // mismatch means the payment does not belong to this order at its current
  // price: a wrong-currency misconfiguration, a stale session created before the
  // fee model changed, or a session minted with a leaked API key. Settling on it
  // would release the seller's full payout against money we did not receive, so
  // we flag it for a human instead and leave dealer_paid_at unset.
  if (verified.status === 'paid' && typeof verified.amountMinor === 'number') {
    // Same schedule the session was created under: the fees that applied when
    // the deal was struck. Using today's would flag every deal struck before a
    // fee change as a mismatch.
    const expectedMinor = Math.round(
      feesAt(order.created_at).dealerTotal(Number(order.amount) || 0) * 100
    )
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

      // Alert every admin. The flag above is the durable record here, so a
      // failed notification is not worth a retry of the whole callback.
      await alertAdmins(
        supabaseUrl,
        headers,
        order,
        'Betalning med fel belopp, kräver hantering',
        `${detail} Ordern är INTE markerad som betald och ingen utbetalning har släppts. Kontrollera betalningen hos betalleverantören innan något släpps.`
      )

      // 200 so the provider stops retrying: a retry redelivers the same amount
      // and cannot resolve this. It needs a human.
      return NextResponse.json({ ok: false, error: 'amount_mismatch' })
    }
  }

  // On settling we also store the session that ACTUALLY paid. payment_reference
  // otherwise holds the most recently created session, which is not necessarily
  // the one that went through, and the duplicate-payment check above compares
  // against it. A 'failed' callback must not touch it: a failed session says
  // nothing about a parallel one that may still be open.
  const patch =
    verified.status === 'paid'
      ? {
          payment_status: 'paid',
          payment_reference: verified.providerReference,
          dealer_paid_at: new Date().toISOString(),
        }
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
