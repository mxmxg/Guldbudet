// Delade definitioner för tvistehantering ("ärenden"). En part i en affär
// (säljare eller handlare) kan anmäla ett problem. Admin avgör.

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected'

export type DisputeParty = 'seller' | 'dealer'

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  open: 'Öppet',
  under_review: 'Under utredning',
  resolved: 'Löst',
  rejected: 'Avslaget',
}

// Färg per status för admin-vyn (Tailwind-klasser).
export const DISPUTE_STATUS_STYLE: Record<DisputeStatus, string> = {
  open: 'bg-amber-100 text-amber-800 border border-amber-200',
  under_review: 'bg-blue-100 text-blue-800 border border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-espresso-100 text-espresso-600 border border-espresso-200',
}

export type DisputeReason = { key: string; label: string }

// Orsaker en säljare kan ange.
export const SELLER_REASONS: DisputeReason[] = [
  { key: 'not_paid', label: 'Jag har inte fått betalt' },
  { key: 'valuation', label: 'Jag är inte nöjd med värderingen eller kontrollen' },
  { key: 'item_not_returned', label: 'Jag har inte fått tillbaka mitt föremål' },
  { key: 'wrong_amount', label: 'Beloppet stämmer inte' },
  { key: 'other', label: 'Annat' },
]

// Orsaker en handlare kan ange.
export const DEALER_REASONS: DisputeReason[] = [
  { key: 'item_not_received', label: 'Föremålet har inte kommit fram' },
  { key: 'item_not_as_described', label: 'Föremålet stämde inte med beskrivningen' },
  { key: 'authenticity', label: 'Jag ifrågasätter äktheten eller guldhalten' },
  { key: 'wrong_amount', label: 'Beloppet eller fakturan stämmer inte' },
  { key: 'other', label: 'Annat' },
]

export function reasonsFor(party: DisputeParty): DisputeReason[] {
  return party === 'seller' ? SELLER_REASONS : DEALER_REASONS
}

const ALL_REASONS = [...SELLER_REASONS, ...DEALER_REASONS]

export function reasonLabel(key: string): string {
  return ALL_REASONS.find((r) => r.key === key)?.label || key
}
