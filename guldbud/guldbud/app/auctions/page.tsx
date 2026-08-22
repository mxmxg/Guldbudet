import { createClient } from '@/lib/supabase-server'
import { Item } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuctionsBrowser from '@/components/AuctionsBrowser'
import RecentlySold, { SoldRow } from '@/components/RecentlySold'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Auktioner · GuldBud',
  description: 'Pågående guldauktioner just nu. Auktoriserade handlare budar mot varandra om guld och smycken.',
  alternates: { canonical: '/auctions' },
}

export type EnrichedItem = Item & { top_bid: number; bid_count: number }

export default async function AuctionsPage() {
  const supabase = createClient()
  const nowIso = new Date().toISOString()
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .or(`auction_ends_at.is.null,auction_ends_at.gt.${nowIso}`)
    .order('auction_ends_at', { ascending: true })

  const list = (items || []) as Item[]
  let enriched: EnrichedItem[] = list.map((i) => ({ ...i, top_bid: 0, bid_count: 0 }))
  if (list.length > 0) {
    const ids = list.map((i) => i.id)
    const { data: bids } = await supabase.from('bids').select('item_id, amount').in('item_id', ids)
    const top: Record<string, number> = {}
    const count: Record<string, number> = {}
    bids?.forEach((b: any) => {
      count[b.item_id] = (count[b.item_id] || 0) + 1
      if (!top[b.item_id] || b.amount > top[b.item_id]) top[b.item_id] = b.amount
    })
    enriched = list.map((i) => ({ ...i, top_bid: top[i.id] || 0, bid_count: count[i.id] || 0 }))
  }

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

  // Skala bort reservationsnivån (min_price) ur klient-payloaden – bara status ut.
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
