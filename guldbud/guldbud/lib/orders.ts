// Shared definitions for the post-auction settlement flow ("affär").
// GuldBud acts as the hub: seller -> GuldBud (check + pay) -> dealer.

export type OrderStatus =
  | 'accepted'
  | 'shipped_by_seller'
  | 'received'
  | 'dealer_paid'
  | 'verified_paid'
  | 'shipped_to_dealer'
  | 'completed'
  | 'cancelled'

export type OrderStep = {
  key: OrderStatus
  label: string
  // Short description shown to the parties.
  desc: string
}

// The linear ladder (cancelled is handled separately).
export const ORDER_STEPS: OrderStep[] = [
  { key: 'accepted', label: 'Accepterad', desc: 'Budet är accepterat och affären skapad.' },
  { key: 'shipped_by_seller', label: 'Inskickad', desc: 'Säljaren har skickat föremålet till GuldBud.' },
  { key: 'received', label: 'Mottagen & kontrollerad', desc: 'GuldBud har tagit emot och äkthetskontrollerat föremålet.' },
  { key: 'dealer_paid', label: 'Betald av handlare', desc: 'Handlarens betalning är registrerad.' },
  { key: 'verified_paid', label: 'Utbetald till säljare', desc: 'Säljaren har fått betalt.' },
  { key: 'shipped_to_dealer', label: 'Vidareskickad', desc: 'Föremålet har skickats till den vinnande handlaren.' },
  { key: 'completed', label: 'Slutförd', desc: 'Handlaren har mottagit föremålet. Affären är avslutad.' },
]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  accepted: 'Accepterad',
  shipped_by_seller: 'Inskickad',
  received: 'Mottagen & kontrollerad',
  dealer_paid: 'Betald av handlare',
  verified_paid: 'Utbetald till säljare',
  shipped_to_dealer: 'Vidareskickad',
  completed: 'Slutförd',
  cancelled: 'Avbruten',
}

// Orders that still need handling – everything except finished/cancelled.
// Single source of truth so the admin dashboard count and the Affärer list
// can never drift apart (previously the dashboard silently dropped
// 'dealer_paid', so those deals vanished from the "pågående" stat).
export const OPEN_ORDER_STATES: OrderStatus[] = [
  'accepted',
  'shipped_by_seller',
  'received',
  'dealer_paid',
  'verified_paid',
  'shipped_to_dealer',
]

export function stepIndex(status: OrderStatus): number {
  const i = ORDER_STEPS.findIndex((s) => s.key === status)
  return i
}

// The status that comes after the given one in the ladder (null at the end).
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = stepIndex(status)
  if (i < 0 || i >= ORDER_STEPS.length - 1) return null
  return ORDER_STEPS[i + 1].key
}
