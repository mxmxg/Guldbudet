// The dealer-payment layer. API routes import getPaymentProvider() and never a
// concrete adapter, so onboarding a new rail (direct bank transfer once the
// contract is in place) is a change here and nowhere else.
//
// There is exactly one provider today: Stripe.
//
// Until 2026-08-30 the provider was picked from PAYMENT_PROVIDER with Brite as
// the silent default. That construction is gone. The Brite adapter was never
// finished (eleven open TODOs about an unconfirmed API contract) and it never
// reported back an amount, so the amount check in the callback route silently
// switched itself off whenever the env var was not the exact string 'stripe'.
// A typo was enough to disarm it. With a single provider there is nothing to
// select and nothing to get wrong.

import type { PaymentProvider } from './types'
import { StripeProvider } from './stripe'

// Recorded on the order as orders.payment_provider so the bookkeeping trail
// names the rail that actually took the money.
export const PAYMENT_PROVIDER_NAME = 'stripe' as const

export function getPaymentProvider(): PaymentProvider {
  return new StripeProvider()
}

// True when the provider can both take a payment AND settle it. The API routes
// use this to answer 503 payments_not_configured cleanly while the live keys
// are still missing from Vercel.
//
// Both halves are required, and the webhook secret is not optional. Without it
// verifyCallback() bails out before it looks at anything (see stripe.ts), so
// every callback is answered 400 and dealer_paid_at is never set. The dealer
// would have paid for real into a session nothing can confirm: the payout guard
// keeps blocking release, and process_unpaid_orders eventually suspends a dealer
// who did nothing wrong. Refusing to open the payment at all is the safe end of
// that trade.
//
// This does not touch the admin's manual dealer_paid_at path, which writes
// straight to the orders table and never goes through this route.
export function paymentsConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET
}

export type { PaymentProvider, PaymentProviderName } from './types'
