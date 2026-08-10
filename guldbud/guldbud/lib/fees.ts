// Revenue model: a buyer's premium (köparprovision). The winning dealer pays
// their bid PLUS a commission on top; the seller receives the full bid amount.
// This keeps selling free for private sellers.

export const DEALER_COMMISSION_RATE = 0.08 // 8 %
export const DEALER_COMMISSION_LABEL = '8%'

// Flat shipping/handling fee the winning dealer pays for insured delivery of the
// won item. It is a pass-through to cover logistics — NOT commission revenue —
// so it must never be counted in the commission analytics. Market-anchored to
// Pantbanken's flat 149 kr on gold.
export const DEALER_SHIPPING_FEE = 149

// "Handlaren betalar vid vinst": the dealer pays immediately when they win.
// The order carries a short payment_due_at (set in the DB trigger) that drives
// reminders and auto-cancellation; the UI/emails just say "omgående".
export const PAYMENT_WINDOW_LABEL = 'omgående'

export function commission(bid: number): number {
  return Math.round((bid || 0) * DEALER_COMMISSION_RATE)
}

// Bid + commission (before shipping). Kept for the "säljaren får hela budet,
// provisionen läggs ovanpå" breakdown.
export function totalWithCommission(bid: number): number {
  return (bid || 0) + commission(bid)
}

// What the dealer actually pays end to end: bid + commission + shipping.
export function dealerTotal(bid: number): number {
  return totalWithCommission(bid) + DEALER_SHIPPING_FEE
}
