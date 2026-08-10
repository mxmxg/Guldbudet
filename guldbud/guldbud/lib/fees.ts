// Revenue model: a buyer's premium (köparprovision). The winning dealer pays
// their bid PLUS a commission on top; the seller receives the full bid amount.
// This keeps selling free for private sellers.

export const DEALER_COMMISSION_RATE = 0.08 // 8 %
export const DEALER_COMMISSION_LABEL = '8%'

// "Handlaren betalar vid vinst": the dealer pays immediately when they win.
// The order carries a short payment_due_at (set in the DB trigger) that drives
// reminders and auto-cancellation; the UI/emails just say "omgående".
export const PAYMENT_WINDOW_LABEL = 'omgående'

export function commission(bid: number): number {
  return Math.round((bid || 0) * DEALER_COMMISSION_RATE)
}

// What the dealer actually pays: bid + commission.
export function totalWithCommission(bid: number): number {
  return (bid || 0) + commission(bid)
}
