// Provider-agnostic dealer-payment layer.
// The winning dealer pays their bid + commission + shipping (see lib/fees).
// Each concrete provider (Brite first) implements PaymentProvider so the API
// routes stay identical regardless of which A2A rail is live.

// Registered provider identifiers. Add new rails here as they are onboarded.
export type PaymentProviderName = 'brite'

// The two terminal states we persist on orders.payment_status after a callback.
// (Orders start at 'pending' the moment a payment session is created.)
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
  providerReference: string
  status: PaymentStatus
}

export interface PaymentProvider {
  // Open a hosted payment session and return the redirect target + reference.
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  // Authenticate + parse an inbound callback. Returns null when it cannot be
  // verified (bad signature, unknown shape) so the route can answer 400.
  verifyCallback(req: Request): Promise<VerifiedCallback | null>
}
