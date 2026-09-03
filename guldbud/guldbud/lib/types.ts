// Typer för tabellerna i Supabase.
//
// Speglar supabase-schema.sql, kontrollerat kolumn för kolumn 2026-08-31.
// Filen hade glidit isär från databasen: fjorton kolumner på profiles och sju
// på items saknades, `link` saknades på notifications, och statusvärdena på
// items var ofullständiga.
//
// Det är därför koden på många ställen använder `any` mot Supabase i stället
// för de här typerna. Att fylla luckorna gör det möjligt att gå över undan för
// undan, men gör det inte automatiskt: en typ som ljuger är sämre än ingen typ,
// så lägg till en kolumn här samma dag som den läggs till i schemat.
//
// Nullable i databasen skrivs som `| null`, inte som valfritt fält. Skillnaden
// spelar roll: Supabase returnerar null för en tom kolumn, inte undefined, och
// `field?: string` gör att `field === undefined`-kontroller ser rätt ut men
// aldrig slår till.

export type Role = 'customer' | 'dealer' | 'admin'

export type ItemStatus = 'pending' | 'approved' | 'active' | 'closed' | 'rejected'

// Ursprunget säljaren deklarerar vid publicering. Kontrolleras av
// enforce_listing_requirements, som avvisar allt utanför listan.
export type SourceType = 'eget_smycke' | 'arv' | 'eget_kop' | 'annat'

export type PayoutMethod = 'swish' | 'bank'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  approved: boolean
  suspended: boolean
  created_at: string

  // Kontaktuppgifter. Null tills profilen kompletterats.
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null

  // Företagsuppgifter, bara på handlare.
  company_name: string | null
  org_number: string | null
  verification_doc_path: string | null

  // Identitet. personal_number är självdeklarerat och lagras normaliserat till
  // tolv siffror. verified_* sätts enbart av BankID-callbacken och nollas
  // aldrig, se lib/identity och beslutsloggen.
  personal_number: string | null
  identity_verified: boolean
  verified_name: string | null
  verified_ssn: string | null
  identity_verified_at: string | null

  // Utbetalning till säljaren. Kontrolleras vid listning, inte i databasen.
  payout_method: PayoutMethod | null
  payout_swish: string | null
  payout_bank_clearing: string | null
  payout_bank_account: string | null

  email_notifications: boolean
  dealer_terms_accepted_at: string | null
  customer_terms_accepted_at: string | null
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: string | null
  weight_grams: number | null
  karat: string | null
  diamond_carat: number | null
  gemstone: string | null
  // Reservationspris. Skalas bort av servern för alla utom ägaren, så på en
  // publik auktionssida är det null även när det finns.
  min_price: number | null
  // 'approved' är ett dött värde: ingen kod skriver det. Admin går direkt från
  // 'pending' till 'active'. Det står kvar i check-constrainten, därför här.
  status: ItemStatus
  image_urls: string[]
  auction_ends_at: string | null
  accepted_bid_id: string | null
  accepted_at: string | null
  created_at: string

  // Ursprung och samtycken, krävda vid publicering av
  // enforce_listing_requirements. Null på föremål som lades ut innan kraven
  // fanns; de går fortfarande att sälja men inte att återlista med ett klick.
  source_type: SourceType | null
  source_note: string | null
  ownership_attested_at: string | null
  mandate_accepted_at: string | null
  terms_version: string | null

  // Den annons det här föremålet lades ut från, när det lagts ut igen. Alltid
  // en ny rad, aldrig en återanvänd: orders.item_id är unikt, så ett föremål
  // kan bara ha en affär. Null på allt som publicerats första gången.
  relisted_from: string | null

  // Cron-jobbens avbockning, så samma notis inte skickas två gånger.
  ended_notified: boolean
  ending_soon_notified: boolean
  bidders_ending_notified: boolean
}

export interface Bid {
  id: string
  item_id: string
  dealer_id: string
  amount: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  item_id: string | null
  link: string | null
  read: boolean
  created_at: string
}
