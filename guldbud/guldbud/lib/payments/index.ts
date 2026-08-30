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

// True when the provider has the key env it needs to actually run. The API
// routes use this to answer 503 payments_not_configured cleanly while the live
// keys are still missing from Vercel.
//
// NOTE: this deliberately does not check STRIPE_WEBHOOK_SECRET. That gap is a
// known finding: with an API key but no signing secret, dealers can pay while
// every callback is rejected, so the order never settles. Left as-is here to
// keep this change to removing Brite; see the findings list in CLAUDE.md.
export function paymentsConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export type { PaymentProvider, PaymentProviderName } from './types'
