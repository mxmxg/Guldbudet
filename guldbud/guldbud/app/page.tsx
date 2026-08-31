import { createClient } from '@supabase/supabase-js'
import { loadActiveItemsWithStats } from '@/lib/auctions'
import Navbar from '@/components/Navbar'
import HomeContent from '@/components/HomeContent'
import JsonLd from '@/components/JsonLd'
import { SoldRow } from '@/components/RecentlySold'

// Cacha startsidan i 30 s (ISR) i stället för att bygga om den från databasen
// vid varje besök. Serverns HTML är ändå samma publika sida för alla (inloggade
// delar läggs till på klienten), och live-uppdatering av bud sker på klienten.
// Ger snabb, jämn laddningstid och avlastar databasen.
export const revalidate = 30

const SITE = 'https://guldbud.com'
export const metadata = { alternates: { canonical: '/' } }

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GuldBud',
  url: SITE,
  logo: `${SITE}/icon`,
  description: 'Sveriges guldauktion, auktoriserade guldhandlare budar mot varandra om ditt guld.',
  areaServed: 'SE',
  email: 'info@guldbud.com',
  sameAs: ['https://se.trustpilot.com/review/guldbud.com'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@guldbud.com',
    contactType: 'customer support',
    areaServed: 'SE',
    availableLanguage: 'Swedish',
  },
}
const siteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GuldBud',
  url: SITE,
  inLanguage: 'sv-SE',
}

export type { EnrichedItem } from '@/lib/auctions'

export default async function HomePage() {
  // Cookie-lös anon-klient: startsidans data är publik (RLS tillåter anon att
  // läsa aktiva föremål och deras bud), och att inte läsa cookies är det som gör
  // ISR-cachningen möjlig.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // Aktiva auktioner + budstatistik i EN query (DB-funktionen active_items_with_stats,
  // ingen .in-id-lista som spricker på URL-längd vid många auktioner). Faller
  // tillbaka automatiskt till det gamla mönstret om funktionen inte finns än.
  const enriched = await loadActiveItemsWithStats(supabase)

  // Nyligen sålt för social proof på startsidan (gäst-vyn).
  let sold: SoldRow[] = []
  const { data: soldItems } = await supabase
    .from('items')
    .select('id, title, category, weight_grams, karat, image_urls, accepted_at, accepted_bid_id')
    .eq('status', 'closed')
    .not('accepted_bid_id', 'is', null)
    .order('accepted_at', { ascending: false })
    .limit(4)
  if (soldItems && soldItems.length > 0) {
    const bidIds = soldItems.map((i: any) => i.accepted_bid_id).filter(Boolean)
    const { data: soldBids } = await supabase.from('bids').select('id, amount').in('id', bidIds)
    const priceByBid: Record<string, number> = {}
    soldBids?.forEach((b: any) => (priceByBid[b.id] = b.amount))
    sold = soldItems
      .map((i: any) => ({ ...i, price: priceByBid[i.accepted_bid_id] || 0 }))
      .filter((r: any) => r.price > 0)
  }

  // Skala bort reservationsnivån (min_price) ur klient-payloaden. Köparen ska
  // bara se STATUS (uppnått/ej), aldrig själva talet. Beräknas server-side.
  const publicItems = enriched.map((i: any) => {
    const has_reserve = i.min_price != null
    const reserve_met = has_reserve && (i.top_bid || 0) >= i.min_price
    const { min_price, ...rest } = i
    return { ...rest, has_reserve, reserve_met }
  })

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <Navbar />
      <HomeContent items={publicItems} sold={sold} />
    </div>
  )
}
