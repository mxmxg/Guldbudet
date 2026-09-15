// När säljarens identitet får lämnas ut till handlaren, och spåret av att det
// skedde.
//
// Säljaren är anonym överallt annars på plattformen. Handlaren behöver namn,
// personnummer och adress för sitt inköpsunderlag, alltså för att kunna
// bokföra ett köp av begagnade varor från en privatperson. Det behovet
// uppstår när köpet faktiskt är gjort, inte tidigare.
//
// Tidigare räckte det att ordern existerade. En handlare som vunnit en auktion
// och sedan aldrig betalat fick alltså ut en privatpersons fullständiga
// identitet, och detsamma gällde efter att affären krediterats eller avbrutits.
// Ligger i en egen fil eftersom två rutter lämnar ut samma uppgifter, och en
// grind som finns på två ställen glider isär.

export type DisclosureChannel = 'seller_api' | 'invoice_pdf' | 'payout_account'

export type ReleaseDecision =
  | { allowed: true; role: 'admin' | 'dealer' }
  | { allowed: false; reason: 'not_a_party' | 'not_paid' | 'not_received' | 'deal_reverted' }

type OrderForRelease = {
  dealer_id?: string | null
  status?: string | null
  dealer_paid_at?: string | null
  refunded_at?: string | null
}

// Under väg C betalar handlaren köpeskillingen direkt till säljarens
// bankkonto, så handlaren behöver kontonumret och kontohavarens namn INNAN
// betalningen, inte efter. Det är en andra, smalare utlämning: bara det som
// krävs för att göra överföringen, aldrig personnummer eller adress. De
// följer fortfarande mayReleaseSellerIdentity ovan, alltså efter betalning.
//
// Tidpunkten är när GuldBud tagit emot och kontrollerat föremålet
// (status received eller senare). Före det finns ingen anledning att betala,
// och en handlare som betalat för tidigt mot ett föremål som sedan
// underkänns hade stått utan återbetalningsväg, eftersom pengarna gått
// direkt till säljaren.
const PAYABLE_STATES = ['received', 'dealer_paid', 'verified_paid', 'shipped_to_dealer', 'completed']

export function mayReleaseSellerPayoutAccount(
  order: OrderForRelease,
  viewerId: string,
  isAdmin: boolean
): ReleaseDecision {
  if (isAdmin) return { allowed: true, role: 'admin' }
  if (!order.dealer_id || order.dealer_id !== viewerId) {
    return { allowed: false, reason: 'not_a_party' }
  }
  if (order.refunded_at || order.status === 'cancelled') {
    return { allowed: false, reason: 'deal_reverted' }
  }
  if (!PAYABLE_STATES.includes(order.status || '')) {
    return { allowed: false, reason: 'not_received' }
  }
  return { allowed: true, role: 'dealer' }
}

// Admin ser alltid: adminvyn är arbetsverktyget för penningtvättsgranskning och
// tvister, och behöver identiteten även på en affär som gått tillbaka.
export function mayReleaseSellerIdentity(
  order: OrderForRelease,
  viewerId: string,
  isAdmin: boolean
): ReleaseDecision {
  if (isAdmin) return { allowed: true, role: 'admin' }
  if (!order.dealer_id || order.dealer_id !== viewerId) {
    return { allowed: false, reason: 'not_a_party' }
  }
  if (order.refunded_at || order.status === 'cancelled') {
    return { allowed: false, reason: 'deal_reverted' }
  }
  if (!order.dealer_paid_at) {
    return { allowed: false, reason: 'not_paid' }
  }
  return { allowed: true, role: 'dealer' }
}

// Skriver spåret. Utlämnande av personuppgifter ska gå att följa i efterhand,
// både för vår egen skull och för att kunna svara en säljare som frågar vem som
// tagit del av uppgifterna.
//
// Misslyckas loggningen ska utlämnandet inte gå igenom: ett utlämnande utan
// spår är precis det vi bygger bort. Anropande rutt tolkar false som fel.
export async function logIdentityDisclosure(
  supabaseUrl: string,
  serviceHeaders: Record<string, string>,
  entry: {
    orderId: string
    sellerId: string
    requestedBy: string
    requesterRole: 'admin' | 'dealer'
    channel: DisclosureChannel
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/identity_disclosures`, {
      method: 'POST',
      headers: { ...serviceHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        order_id: entry.orderId,
        seller_id: entry.sellerId,
        requested_by: entry.requestedBy,
        requester_role: entry.requesterRole,
        channel: entry.channel,
      }),
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
