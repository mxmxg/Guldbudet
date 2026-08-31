import { createClient } from '@supabase/supabase-js'
import { loadActiveItemsWithStats } from '@/lib/auctions'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuctionsBrowser from '@/components/AuctionsBrowser'
import RecentlySold, { SoldRow } from '@/components/RecentlySold'

// Cacha listan i 30 s (ISR) i stället för att köra queryn på varje besök. Datan
// är publik och samma för alla; live-buduppdatering sker ändå på klienten via
// realtime. En cookie-lös anon-klient krävs för att ISR-cachningen ska bita.
export const revalidate = 30
export const metadata = {
  title: 'Auktioner',
  description: 'Pågående guldauktioner just nu. Auktoriserade handlare budar mot varandra om guld och smycken.',
  alternates: { canonical: '/auctions' },
}

export type { EnrichedItem } from '@/lib/auctions'

export default async function AuctionsPage() {
  // Cookie-lös anon-klient: datan är publik (RLS tillåter anon att läsa aktiva
  // och avslutade föremål samt deras bud), och att inte läsa cookies är det som
  // gör ISR-cachningen ovan möjlig.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // Aktiva auktioner + budstatistik i en query (DB-funktion, ingen .in-id-lista).
  const enriched = await loadActiveItemsWithStats(supabase)

  // Nyligen sålt: avslutade auktioner med accepterat bud, för social proof.
  let sold: SoldRow[] = []
  const { data: soldItems } = await supabase
    .from('items')
    .select('id, title, category, weight_grams, karat, image_urls, accepted_at, accepted_bid_id')
    .eq('status', 'closed')
    .not('accepted_bid_id', 'is', null)
    .order('accepted_at', { ascending: false })
    .limit(8)
  if (soldItems && soldItems.length > 0) {
    const bidIds = soldItems.map((i: any) => i.accepted_bid_id).filter(Boolean)
    const { data: soldBids } = await supabase.from('bids').select('id, amount').in('id', bidIds)
    const priceByBid: Record<string, number> = {}
    soldBids?.forEach((b: any) => (priceByBid[b.id] = b.amount))
    sold = soldItems
      .map((i: any) => ({ ...i, price: priceByBid[i.accepted_bid_id] || 0 }))
      .filter((r: any) => r.price > 0)
  }

  // Skala bort reservationsnivån (min_price) ur klient-payloaden, bara status ut.
  const publicItems = enriched.map((i: any) => {
    const has_reserve = i.min_price != null
    const reserve_met = has_reserve && (i.top_bid || 0) >= i.min_price
    const { min_price, ...rest } = i
    return { ...rest, has_reserve, reserve_met }
  })

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <AuctionsBrowser items={publicItems} />
      <RecentlySold rows={sold} />
      <Footer />
    </div>
  )
}
