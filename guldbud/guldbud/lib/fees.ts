// Revenue model: a buyer's premium (köparprovision). The winning dealer pays
// their bid PLUS a commission on top; the seller receives the full bid amount.
// This keeps selling free for private sellers.

export const DEALER_COMMISSION_RATE = 0.08 // 8 %
export const DEALER_COMMISSION_LABEL = '8%'

// The dealer is invoiced once GuldBud has received and checked the item, and
// has this long to pay. GuldBud holds the item until then, so no aggressive
// deadline is needed.
export const PAYMENT_WINDOW_LABEL = '3 arbetsdagar'

export function commission(bid: number): number {
  return Math.round((bid || 0) * DEALER_COMMISSION_RATE)
}

// What the dealer actually pays: bid + commission.
export function totalWithCommission(bid: number): number {
  return (bid || 0) + commission(bid)
}
