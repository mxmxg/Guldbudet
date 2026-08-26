// Selects the active payment provider from env. Server-only (pulls in adapters
// that read secret env). The API routes import getPaymentProvider() and never
// a concrete adapter, so swapping rails is a one-line change here.

import type { PaymentProvider, PaymentProviderName } from './types'
import { BriteProvider } from './brite'
import { StripeProvider } from './stripe'

function selectedProvider(): PaymentProviderName {
  const raw = (process.env.PAYMENT_PROVIDER || 'brite').toLowerCase()
  if (raw === 'stripe') return 'stripe'
  return 'brite'
}

export function getPaymentProvider(): PaymentProvider {
  switch (selectedProvider()) {
    case 'stripe':
      return new StripeProvider()
    case 'brite':
    default:
      return new BriteProvider()
  }
}

// True when the selected provider has the key env it needs to actually run.
// The API routes use this to answer 503 payments_not_configured cleanly while
// Brite's sandbox keys are still pending.
export function paymentsConfigured(): boolean {
  switch (selectedProvider()) {
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY
    case 'brite':
    default:
      return !!process.env.BRITE_API_KEY
  }
}

export type { PaymentProvider, PaymentProviderName } from './types'
