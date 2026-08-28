// Provider-agnostic dealer-payment layer.
// The winning dealer pays their bid + commission + shipping (see lib/fees).
// Each concrete provider (Brite first) implements PaymentProvider so the API
// routes stay identical regardless of which A2A rail is live.

// Registered provider identifiers. Add new rails here as they are onboarded.
export type PaymentProviderName = 'brite' | 'stripe'

// The two terminal states a provider can report back to us. (Orders start at
// 'pending' the moment a payment session is created.) orders.payment_status can
// additionally hold 'amount_mismatch', which the callback route sets on its own
// when a verified 'paid' callback carries the wrong amount or currency.
export type PaymentStatus = 'paid' | 'failed'

// What the API route hands the provider to open a hosted A2A payment session.
export interface CreatePaymentInput {
  // GuldBud order id. Also used as our reference back to the order.
  orderId: string
  // Amount to charge the dealer, in whole SEK (dealerTotal(order.amount)).
  amount: number
  // Our own reference we ask the provider to echo back (currently the order id).
  reference: string
  // Where the provider should send the dealer after they finish/cancel.
  returnUrl: string
}

// What the provider returns once the session exists: where to send the dealer,
// and the provider's own id for the session (stored as payment_reference).
export interface CreatePaymentResult {
  redirectUrl: string
  providerReference: string
}

// The normalised result of verifying an inbound provider callback/webhook.
// null means the request could not be authenticated or understood.
export interface VerifiedCallback {
  // The provider's own session id (stored as payment_reference for the record).
  providerReference: string
  // OUR reference echoed back by the provider (the order id). The callback
  // route matches on this first, so a completed session settles the right order
  // even if a newer session has since overwritten payment_reference.
  reference?: string
  status: PaymentStatus
  // What the provider says was ACTUALLY collected: the amount in the currency's
  // minor unit (öre for SEK) and the currency it was charged in. Optional
  // because not every rail reports it. When present, the callback route checks
  // both against the order's own expected total before settling, so a session
  // that was not created for this order's current price (or in the wrong
  // currency) can never release the seller's payout.
  amountMinor?: number
  currency?: string
}

export interface PaymentProvider {
  // Open a hosted payment session and return the redirect target + reference.
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  // Authenticate + parse an inbound callback. Returns null when it cannot be
  // verified (bad signature, unknown shape) so the route can answer 400.
  verifyCallback(req: Request): Promise<VerifiedCallback | null>
}
