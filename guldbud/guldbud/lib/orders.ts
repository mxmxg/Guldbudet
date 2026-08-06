// Shared definitions for the post-auction settlement flow ("affär").
// GuldBud acts as the hub: seller -> GuldBud (check + pay) -> dealer.

export type OrderStatus =
  | 'accepted'
  | 'shipped_by_seller'
  | 'received'
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
  { key: 'received', label: 'Mottagen', desc: 'GuldBud har tagit emot föremålet och kontrollerar äktheten.' },
  { key: 'verified_paid', label: 'Godkänd & utbetald', desc: 'Äktheten är godkänd och säljaren är utbetald via Swish.' },
  { key: 'shipped_to_dealer', label: 'Vidareskickad', desc: 'Föremålet har skickats till den vinnande handlaren.' },
  { key: 'completed', label: 'Slutförd', desc: 'Handlaren har mottagit föremålet. Affären är avslutad.' },
]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  accepted: 'Accepterad',
  shipped_by_seller: 'Inskickad',
  received: 'Mottagen',
  verified_paid: 'Godkänd & utbetald',
  shipped_to_dealer: 'Vidareskickad',
  completed: 'Slutförd',
  cancelled: 'Avbruten',
}

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
