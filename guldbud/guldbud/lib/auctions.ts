import { Item } from '@/lib/types'

export type EnrichedItem = Item & { top_bid: number; bid_count: number }

/**
 * Hämtar aktiva auktioner med budstatistik (top_bid + bid_count).
 *
 * Föredrar DB-funktionen `active_items_with_stats` som räknar allt i EN query,
 * i stället för att hämta alla items, hämta alla deras bud med `.in(id-lista)`
 * och aggregera i JS. Det gamla mönstret spricker på URL-längd (414) vid många
 * auktioner och skeppar hela bud-tabellen vid varje render.
 *
 * Faller automatiskt tillbaka till det gamla sättet om funktionen inte finns än
 * (t.ex. innan schemat körts), så en deploy aldrig kan tömma listorna oavsett
 * när SQL:en körs. Tar en valfri supabase-klient (server, anon eller browser).
 */
export async function loadActiveItemsWithStats(supabase: any): Promise<EnrichedItem[]> {
  const { data, error } = await supabase.rpc('active_items_with_stats')
  if (!error && Array.isArray(data)) {
    return data as EnrichedItem[]
  }

  // Fallback: det gamla mönstret (items + bids + aggregering i JS).
  const nowIso = new Date().toISOString()
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .or(`auction_ends_at.is.null,auction_ends_at.gt.${nowIso}`)
    .order('auction_ends_at', { ascending: true })

  const list = (items || []) as Item[]
  if (list.length === 0) return []

  const ids = list.map((i) => i.id)
  const { data: bids } = await supabase.from('bids').select('item_id, amount').in('item_id', ids)
  const top: Record<string, number> = {}
  const count: Record<string, number> = {}
  bids?.forEach((b: any) => {
    count[b.item_id] = (count[b.item_id] || 0) + 1
    if (!top[b.item_id] || b.amount > top[b.item_id]) top[b.item_id] = b.amount
  })
  return list.map((i) => ({ ...i, top_bid: top[i.id] || 0, bid_count: count[i.id] || 0 }))
}
