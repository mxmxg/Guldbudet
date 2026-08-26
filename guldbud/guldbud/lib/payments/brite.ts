// Brite account-to-account (A2A) adapter.
//
// Server-only. Never import this into a client component: it reads BRITE_*
// secrets. The exact Brite sandbox contract is not available yet, so the HTTP
// calls are structured for the standard A2A flow and the request/response shape
// is read from env-configurable constants. Everything that still needs to be
// confirmed against Brite's docs is marked with:
//   // TODO(brite): confirm endpoint/payload against Brite sandbox docs
//
// When BRITE_API_KEY is absent the adapter still constructs, but any call
// throws Error('Brite not configured') so the app never half-works silently.

import crypto from 'crypto'
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifiedCallback,
  PaymentStatus,
} from './types'

// Env-driven configuration. Defaults are placeholders until we have the real
// sandbox spec; override any of them via env without touching this file.
const API_KEY = process.env.BRITE_API_KEY || ''
const API_BASE = process.env.BRITE_API_BASE || 'https://sandbox.api.brite.eu'
const WEBHOOK_SECRET = process.env.BRITE_WEBHOOK_SECRET || ''
// Path of the "create payment session" endpoint, relative to API_BASE.
// TODO(brite): confirm endpoint/payload against Brite sandbox docs
const CREATE_PATH = process.env.BRITE_CREATE_PATH || '/v1/payments'
// Currency all GuldBud settlements run in.
const CURRENCY = process.env.BRITE_CURRENCY || 'SEK'
// Header Brite uses to deliver the callback signature.
// TODO(brite): confirm endpoint/payload against Brite sandbox docs
const SIGNATURE_HEADER = process.env.BRITE_SIGNATURE_HEADER || 'x-brite-signature'

function assertConfigured(): void {
  if (!API_KEY) throw new Error('Brite not configured')
}

// Brite works in minor units (öre) on most A2A rails.
// TODO(brite): confirm endpoint/payload against Brite sandbox docs
function toMinorUnits(sek: number): number {
  return Math.round((sek || 0) * 100)
}

// Map Brite's session status onto our two terminal states, or null if the
// status is non-terminal / unknown (nothing to persist yet).
// TODO(brite): confirm endpoint/payload against Brite sandbox docs
function mapStatus(raw: unknown): PaymentStatus | null {
  const s = String(raw || '').toLowerCase()
  if (['completed', 'complete', 'paid', 'success', 'settled'].includes(s)) return 'paid'
  if (['failed', 'cancelled', 'canceled', 'rejected', 'expired', 'error'].includes(s)) return 'failed'
  return null
}

export class BriteProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    assertConfigured()

    // TODO(brite): confirm endpoint/payload against Brite sandbox docs
    const payload = {
      amount: toMinorUnits(input.amount),
      currency: CURRENCY,
      // Our own reference Brite should echo back on the callback.
      merchant_reference: input.reference,
      // Where Brite returns the dealer once the bank flow finishes.
      return_url: input.returnUrl,
    }

    const res = await fetch(`${API_BASE}${CREATE_PATH}`, {
      method: 'POST',
      headers: {
        // TODO(brite): confirm endpoint/payload against Brite sandbox docs
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Brite create failed (${res.status})${detail ? `: ${detail}` : ''}`)
    }

    const data: any = await res.json().catch(() => ({}))

    // TODO(brite): confirm endpoint/payload against Brite sandbox docs
    const redirectUrl: string | undefined = data.redirect_url || data.url || data.hosted_url
    const providerReference: string | undefined = data.id || data.session_id || data.payment_id
    if (!redirectUrl || !providerReference) {
      throw new Error('Brite create returned an unexpected shape')
    }

    return { redirectUrl, providerReference }
  }

  async verifyCallback(req: Request): Promise<VerifiedCallback | null> {
    assertConfigured()
    if (!WEBHOOK_SECRET) return null

    const raw = await req.text()
    const signature = req.headers.get(SIGNATURE_HEADER) || ''
    if (!verifySignature(raw, signature)) return null

    let body: any
    try {
      body = JSON.parse(raw)
    } catch {
      return null
    }

    // TODO(brite): confirm endpoint/payload against Brite sandbox docs
    const providerReference: string | undefined =
      body.id || body.session_id || body.payment_id
    // Our order id, echoed back from the merchant_reference we sent at creation.
    const reference: string | undefined = body.merchant_reference || body.reference
    const status = mapStatus(body.status)
    if (!providerReference || !status) return null

    return { providerReference, reference, status }
  }
}

// HMAC-SHA256 over the raw body, compared in constant time. Adjust to Brite's
// actual signing scheme (algorithm, encoding, signed payload) once known.
// TODO(brite): confirm endpoint/payload against Brite sandbox docs
function verifySignature(rawBody: string, signature: string): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
