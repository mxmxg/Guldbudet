import { createClient } from '@/lib/supabase-server'
import { Item } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuctionsBrowser from '@/components/AuctionsBrowser'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Auktioner · GuldBud' }

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

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <AuctionsBrowser items={enriched} />
      <Footer />
    </div>
  )
}
