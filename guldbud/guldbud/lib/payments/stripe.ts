// Stripe payment adapter (dealer pay-in via Stripe Checkout).
//
// Server-only. Never import this into a client component: it reads STRIPE_*
// secrets. Implements PaymentProvider so the API routes stay identical.
//
// Flow: createPayment opens a hosted Stripe Checkout Session and returns its
// URL + id. The id is stored on the order as payment_reference. Stripe then
// POSTs a signed webhook to /api/payments/callback; verifyCallback checks the
// signature and maps the event to our paid/failed states, echoing back the
// session id so the route can find the order by payment_reference.
//
// When STRIPE_SECRET_KEY is absent the adapter still constructs, but any call
// throws Error('Stripe not configured') so the app never half-works silently.
//
// Webhook setup: point a Stripe webhook at /api/payments/callback and subscribe
// ONLY these events, so unrelated events never reach us (the route answers 400
// on anything it cannot map, which Stripe would otherwise retry):
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.expired, checkout.session.async_payment_failed

import crypto from 'crypto'
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifiedCallback,
  PaymentStatus,
} from './types'

const API_KEY = process.env.STRIPE_SECRET_KEY || ''
const API_BASE = process.env.STRIPE_API_BASE || 'https://api.stripe.com'
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const CURRENCY = (process.env.STRIPE_CURRENCY || 'sek').toLowerCase()
// Stripe's signature-timestamp tolerance in seconds (replay protection).
const SIGNATURE_TOLERANCE = 60 * 5

function assertConfigured(): void {
  if (!API_KEY) throw new Error('Stripe not configured')
}

// Stripe works in minor units (öre for SEK). Our amounts are whole SEK.
function toMinorUnits(sek: number): number {
  return Math.round((sek || 0) * 100)
}

// Map a Stripe event to our terminal states, or null if it is not one we
// settle on. `session` is event.data.object (the Checkout Session). A plain
// checkout.session.completed only counts as paid when the session's own
// payment_status is 'paid'; for delayed methods it can be 'unpaid' at
// completion and only settles later via async_payment_succeeded, so we must
// wait rather than release the seller's payout on unfunded money.
function mapEvent(type: string, session: any): PaymentStatus | null {
  if (type === 'checkout.session.completed') {
    return session?.payment_status === 'paid' ? 'paid' : null
  }
  if (type === 'checkout.session.async_payment_succeeded') return 'paid'
  if (type === 'checkout.session.expired' || type === 'checkout.session.async_payment_failed') {
    return 'failed'
  }
  return null
}

export class StripeProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    assertConfigured()

    // Stripe's REST API takes form-encoded bodies with bracketed nested keys.
    const form = new URLSearchParams()
    form.set('mode', 'payment')
    form.set('success_url', input.returnUrl)
    form.set('cancel_url', input.returnUrl)
    // Our own references so we can tie the session back to the order.
    form.set('client_reference_id', input.reference)
    form.set('metadata[order_id]', input.orderId)
    form.set('line_items[0][quantity]', '1')
    form.set('line_items[0][price_data][currency]', CURRENCY)
    form.set('line_items[0][price_data][unit_amount]', String(toMinorUnits(input.amount)))
    form.set('line_items[0][price_data][product_data][name]', 'GuldBud, vinnande bud inkl. provision och frakt')

    const res = await fetch(`${API_BASE}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      cache: 'no-store',
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Stripe create failed (${res.status})${detail ? `: ${detail}` : ''}`)
    }

    const data: any = await res.json().catch(() => ({}))
    const redirectUrl: string | undefined = data.url
    const providerReference: string | undefined = data.id
    if (!redirectUrl || !providerReference) {
      throw new Error('Stripe create returned an unexpected shape')
    }

    return { redirectUrl, providerReference }
  }

  async verifyCallback(req: Request): Promise<VerifiedCallback | null> {
    assertConfigured()
    if (!WEBHOOK_SECRET) return null

    const raw = await req.text()
    const signature = req.headers.get('stripe-signature') || ''
    if (!verifySignature(raw, signature)) return null

    let event: any
    try {
      event = JSON.parse(raw)
    } catch {
      return null
    }

    const session = event?.data?.object
    const status = mapEvent(String(event?.type || ''), session)
    // The event object is the Checkout Session; its id is what we stored as
    // payment_reference; client_reference_id is our order id (set at creation).
    const providerReference: string | undefined = session?.id
    const reference: string | undefined = session?.client_reference_id || session?.metadata?.order_id
    if (!providerReference || !status) return null

    // What Stripe actually collected on this session. amount_total is in minor
    // units (öre for SEK). Passed up so the route can verify it against the
    // order rather than trusting that "paid" means "paid the right amount".
    const amountMinor: number | undefined =
      typeof session?.amount_total === 'number' ? session.amount_total : undefined
    const currency: string | undefined =
      typeof session?.currency === 'string' ? session.currency.toLowerCase() : undefined

    return { providerReference, reference, status, amountMinor, currency }
  }
}

// Verify Stripe's signature scheme: the Stripe-Signature header carries
// `t=<timestamp>,v1=<sig>[,v1=<sig>...]`. The signed payload is `${t}.${body}`,
// HMAC-SHA256 with the webhook signing secret, hex-encoded. Any matching v1
// within the timestamp tolerance passes. Compared in constant time.
function verifySignature(rawBody: string, header: string): boolean {
  if (!header) return false

  let timestamp = ''
  const signatures: string[] = []
  for (const part of header.split(',')) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    else if (key === 'v1' && value) signatures.push(value)
  }
  if (!timestamp || signatures.length === 0) return false

  // Replay protection: reject signatures outside the tolerance window.
  const ts = parseInt(timestamp, 10)
  if (!Number.isFinite(ts)) return false
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - ts) > SIGNATURE_TOLERANCE) return false

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')
  const expectedBuf = Buffer.from(expected)

  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig)
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)
  })
}
