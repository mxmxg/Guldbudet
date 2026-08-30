// Revenue model (förmedling). GuldBud is an intermediary, not a party to the
// gold sale itself: the private seller sells the item to the dealer and receives
// the full winning bid, with NO VAT (private used goods). On top of that the
// dealer pays GuldBud for a taxable intermediary service:
//   - köparprovision 8 % of the bid, + 25 % moms
//   - frakt (insured transport), a taxable transport service, incl 25 % moms
// So the dealer's single payment = item (0 % moms) + provision + provision moms
// + frakt (incl moms). The item amount is passed on to the seller; the rest is
// GuldBud's service revenue + VAT.
//
// THE FEES ARE A DATED HISTORY, NOT A SET OF CONSTANTS.
// An invoice is a record of what was agreed, so it must show the same amounts
// forever. Before this was a history, every document recomputed its numbers from
// whatever the file happened to say at the moment it was opened, which meant a
// future fee change would silently rewrite every invoice ever issued.
//
// Two ways in, and picking the wrong one is the mistake to avoid:
//   - feesAt(order.created_at) for anything about an EXISTING deal: the three
//     documents, the payment routes, the order and admin views. The dealer must
//     be charged exactly what their invoice says.
//   - CURRENT_FEES (or the plain exports below, which are aliases for it) for
//     anything FORWARD-LOOKING: "this is what you will pay if you win".
//
// To change the fees, append a new schedule with the date it takes effect. Never
// edit an existing one: that is the same as rewriting old invoices.

export type FeeSchedule = {
  // Inclusive ISO date from which this schedule applies to new deals.
  effectiveFrom: string
  commissionRate: number
  commissionLabel: string
  vatRate: number
  vatLabel: string
  // Frakt the winning dealer pays for insured delivery of the won item. This is
  // a taxable transport service GuldBud provides, so the amount is INCLUSIVE of
  // moms (GuldBud deducts the input VAT on its own carrier invoice).
  shippingFee: number
}

// Oldest first. The first entry is also the fallback for any deal whose date we
// cannot read, since the oldest schedule is the only one that can have applied
// to a row older than every later change.
const FEE_SCHEDULES: readonly FeeSchedule[] = [
  {
    // Predates the service. The opening schedule applies to everything until the
    // first real change, so this date only has to be early enough.
    effectiveFrom: '2020-01-01',
    commissionRate: 0.08,
    commissionLabel: '8%',
    vatRate: 0.25,
    vatLabel: '25%',
    shippingFee: 199,
  },
]

// One schedule's amounts, with the rounding rules baked in: the provision is
// rounded to whole kronor and the moms is calculated on the ALREADY ROUNDED
// provision, while the shipping split keeps two decimals.
export type Fees = {
  effectiveFrom: string
  commissionRate: number
  commissionLabel: string
  vatRate: number
  vatLabel: string
  shippingFee: number
  shippingFeeExVat: number
  shippingFeeVat: number
  // Köparprovision, exkl moms (GuldBud's actual service revenue and the figure
  // the commission analytics use, moms is passed to Skatteverket).
  commission(bid: number): number
  commissionVat(bid: number): number
  // Total moms on the dealer's payment: provision moms + frakt moms.
  totalVat(bid: number): number
  // GuldBud's part of the payment (the intermediary service, incl moms).
  // Separate from the item price, which is the seller's.
  guldbudServiceTotal(bid: number): number
  // What the dealer actually pays end to end, one lump sum:
  // item (bid) + provision + provision moms + frakt (incl moms).
  dealerTotal(bid: number): number
}

function build(s: FeeSchedule): Fees {
  const shippingFeeExVat = Math.round((s.shippingFee / (1 + s.vatRate)) * 100) / 100
  const shippingFeeVat = Math.round((s.shippingFee - shippingFeeExVat) * 100) / 100
  const commission = (bid: number) => Math.round((bid || 0) * s.commissionRate)
  const commissionVat = (bid: number) => Math.round(commission(bid) * s.vatRate)
  return {
    effectiveFrom: s.effectiveFrom,
    commissionRate: s.commissionRate,
    commissionLabel: s.commissionLabel,
    vatRate: s.vatRate,
    vatLabel: s.vatLabel,
    shippingFee: s.shippingFee,
    shippingFeeExVat,
    shippingFeeVat,
    commission,
    commissionVat,
    totalVat: (bid: number) => commissionVat(bid) + shippingFeeVat,
    guldbudServiceTotal: (bid: number) => commission(bid) + commissionVat(bid) + s.shippingFee,
    dealerTotal: (bid: number) =>
      (bid || 0) + commission(bid) + commissionVat(bid) + s.shippingFee,
  }
}

const BUILT: readonly Fees[] = FEE_SCHEDULES.map(build)

// The schedule that applies to deals struck from today on.
export const CURRENT_FEES: Fees = BUILT[BUILT.length - 1]

// The schedule that was in force when a deal was struck. Anchored on the order's
// created_at, which is when the seller accepted the bid and the amounts became
// binding on both parties. A deal created before a fee change keeps the old fees
// even if it is paid afterwards, which is the whole point: the dealer bid under
// the terms that were published at the time.
//
// An unreadable date falls back to the OLDEST schedule, never the newest: a row
// we cannot date is by definition not a new one.
export function feesAt(when: string | Date | null | undefined): Fees {
  if (!when) return BUILT[0]
  const t = new Date(when).getTime()
  if (!Number.isFinite(t)) return BUILT[0]
  let chosen = BUILT[0]
  for (const f of BUILT) {
    if (new Date(f.effectiveFrom).getTime() <= t) chosen = f
    else break
  }
  return chosen
}

// Forward-looking aliases for the current schedule. Use these where the question
// is "what will this cost", never where it is "what did this cost".
export const DEALER_COMMISSION_RATE = CURRENT_FEES.commissionRate
export const DEALER_COMMISSION_LABEL = CURRENT_FEES.commissionLabel
export const VAT_RATE = CURRENT_FEES.vatRate
export const DEALER_SHIPPING_FEE = CURRENT_FEES.shippingFee
export const SHIPPING_FEE_EX_VAT = CURRENT_FEES.shippingFeeExVat
export const SHIPPING_FEE_VAT = CURRENT_FEES.shippingFeeVat

// "Handlaren betalar vid vinst": the dealer pays immediately when they win.
export const PAYMENT_WINDOW_LABEL = 'omgående'

export function commission(bid: number): number {
  return CURRENT_FEES.commission(bid)
}

export function commissionVat(bid: number): number {
  return CURRENT_FEES.commissionVat(bid)
}

export function totalVat(bid: number): number {
  return CURRENT_FEES.totalVat(bid)
}

export function guldbudServiceTotal(bid: number): number {
  return CURRENT_FEES.guldbudServiceTotal(bid)
}

// Bid + commission (ex moms). Kept for the "säljaren får hela budet, provisionen
// läggs ovanpå" breakdown.
export function totalWithCommission(bid: number): number {
  return (bid || 0) + CURRENT_FEES.commission(bid)
}

export function dealerTotal(bid: number): number {
  return CURRENT_FEES.dealerTotal(bid)
}
