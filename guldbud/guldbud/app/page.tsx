import { createClient } from '@/lib/supabase-server'
import { Item } from '@/lib/types'
import Navbar from '@/components/Navbar'
import HomeContent from '@/components/HomeContent'
import JsonLd from '@/components/JsonLd'
import { SoldRow } from '@/components/RecentlySold'

export const dynamic = 'force-dynamic'

const SITE = 'https://guldbud.com'
const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GuldBud',
  url: SITE,
  logo: `${SITE}/icon`,
  description: 'Sveriges guldauktion – auktoriserade guldhandlare budar mot varandra om ditt guld.',
  areaServed: 'SE',
  email: 'info@guldbud.com',
}
const siteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GuldBud',
  url: SITE,
  inLanguage: 'sv-SE',
}

export type EnrichedItem = Item & { top_bid: number; bid_count: number }

export default async function HomePage() {
  const supabase = createClient()
  // Select items without embedding profiles — the homepage cards don't use the
  // owner name, and dropping the join removes a profiles-RLS failure mode that
  // could otherwise empty the whole list.
  const nowIso = new Date().toISOString()
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .or(`auction_ends_at.is.null,auction_ends_at.gt.${nowIso}`)
    .order('auction_ends_at', { ascending: true })

  const list = (items || []) as Item[]

  // Enrich with live bid stats (RLS allows reading bids on active items).
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
    enriched = list.map((i) => ({
      ...i,
      top_bid: top[i.id] || 0,
      bid_count: count[i.id] || 0,
    }))
  }

  // Nyligen sålt för social proof på startsidan (gäst-vyn).
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

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <Navbar />
      <HomeContent items={enriched} sold={sold} />
    </div>
  )
}
