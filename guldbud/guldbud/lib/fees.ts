// Revenue model (förmedling). GuldBud is an intermediary, not a party to the
// gold sale itself: the private seller sells the item to the dealer and receives
// the full winning bid, with NO VAT (private used goods). On top of that the
// dealer pays GuldBud for a taxable intermediary service:
//   - köparprovision 8 % of the bid, + 25 % moms
//   - frakt (insured transport), a taxable transport service, incl 25 % moms
// So the dealer's single payment = item (0 % moms) + provision + provision moms
// + frakt (incl moms). The item amount is passed on to the seller; the rest is
// GuldBud's service revenue + VAT.

export const DEALER_COMMISSION_RATE = 0.08 // 8 %
export const DEALER_COMMISSION_LABEL = '8%'
export const VAT_RATE = 0.25 // 25 % moms

// Frakt the winning dealer pays for insured delivery of the won item. This is a
// taxable transport service GuldBud provides, so the amount is INCLUSIVE of 25 %
// moms (GuldBud deducts the input VAT on its own carrier invoice).
export const DEALER_SHIPPING_FEE = 199 // kr, inkl moms

// The two-decimal split of the shipping fee for the invoice.
export const SHIPPING_FEE_EX_VAT = Math.round((DEALER_SHIPPING_FEE / (1 + VAT_RATE)) * 100) / 100 // 159.20
export const SHIPPING_FEE_VAT = Math.round((DEALER_SHIPPING_FEE - SHIPPING_FEE_EX_VAT) * 100) / 100 // 39.80

// "Handlaren betalar vid vinst": the dealer pays immediately when they win.
export const PAYMENT_WINDOW_LABEL = 'omgående'

// Köparprovision, exkl moms (this is GuldBud's actual service revenue and the
// figure the commission analytics use, moms is passed to Skatteverket).
export function commission(bid: number): number {
  return Math.round((bid || 0) * DEALER_COMMISSION_RATE)
}

// Moms (25 %) on the provision.
export function commissionVat(bid: number): number {
  return Math.round(commission(bid) * VAT_RATE)
}

// Total moms on the dealer's payment: provision moms + frakt moms.
export function totalVat(bid: number): number {
  return commissionVat(bid) + SHIPPING_FEE_VAT
}

// GuldBud's part of the payment (the intermediary service, incl moms): provision
// + provision moms + frakt. Separate from the item price, which is the seller's.
export function guldbudServiceTotal(bid: number): number {
  return commission(bid) + commissionVat(bid) + DEALER_SHIPPING_FEE
}

// Bid + commission (ex moms). Kept for the "säljaren får hela budet, provisionen
// läggs ovanpå" breakdown.
export function totalWithCommission(bid: number): number {
  return (bid || 0) + commission(bid)
}

// What the dealer actually pays end to end, one lump sum:
// item (bid) + provision + provision moms + frakt (incl moms).
export function dealerTotal(bid: number): number {
  return (bid || 0) + commission(bid) + commissionVat(bid) + DEALER_SHIPPING_FEE
}
