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
  // Betalningen spåras separat via orders.dealer_paid_at (handlaren betalar vid
  // vinst), inte som ett linjärt steg. 'dealer_paid' finns kvar som status-värde
  // för ev. gamla rader men ingår inte längre i stegen admin går igenom.
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
  'dealer_paid', // legacy-status, ingår för att gamla rader ska räknas som öppna
  'verified_paid',
  'shipped_to_dealer',
]

// Var i stegen en affär står. 'dealer_paid' är ett utfasat statusvärde som inte
// längre finns i ORDER_STEPS, eftersom betalningen spåras separat via
// orders.dealer_paid_at. Utan mappningen nedan gav findIndex minus ett för
// sådana rader, vilket gjorde nextStatus() till null: admin kunde inte flytta
// affären framåt alls, bara avbryta den, och stegvisaren markerade inget steg.
//
// Värdet placeras på 'received', steget det historiskt kom efter, så nästa steg
// blir 'verified_paid' precis som för en affär som aldrig fick den statusen.
export function stepIndex(status: OrderStatus): number {
  const key: OrderStatus = status === 'dealer_paid' ? 'received' : status
  return ORDER_STEPS.findIndex((s) => s.key === key)
}

// The status that comes after the given one in the ladder (null at the end).
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = stepIndex(status)
  if (i < 0 || i >= ORDER_STEPS.length - 1) return null
  return ORDER_STEPS[i + 1].key
}
