'use client'
import { useMemo, useState } from 'react'
import { Item } from '@/lib/types'
import { CATEGORIES } from '@/lib/catalog'
import AuctionCard from '@/components/AuctionCard'
import CategoryIcon from '@/components/CategoryIcon'
import { GemIcon, SearchIcon } from '@/components/Icons'

type CardItem = Item & { top_bid: number; bid_count: number }

type Sort = 'ending' | 'newest' | 'price' | 'bids'

const SORTS: { key: Sort; label: string }[] = [
  { key: 'ending', label: 'Slutar snart' },
  { key: 'newest', label: 'Senast inlagda' },
  { key: 'price', label: 'Högsta bud' },
  { key: 'bids', label: 'Flest bud' },
]

export default function AuctionsBrowser({
  items,
  showHero = true,
  defaultSort = 'ending',
  myBidIds,
  leadingIds,
}: {
  items: CardItem[]
  showHero?: boolean
  defaultSort?: Sort
  myBidIds?: Set<string>
  leadingIds?: Set<string>
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [karat, setKarat] = useState<string>('')
  const [wMin, setWMin] = useState('')
  const [wMax, setWMax] = useState('')
  const [sort, setSort] = useState<Sort>(defaultSort)
  const [quick, setQuick] = useState<'all' | 'mybids' | 'leading'>('all')

  // Only show categories that actually have live auctions.
  const availableCategories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[])
    return CATEGORIES.filter((c) => set.has(c))
  }, [items])

  const availableKarats = useMemo(() => {
    const set = new Set(items.map((i) => i.karat).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [items])

  const hasFilter = !!(query || category || karat || wMin || wMax)
  const clearAll = () => {
    setQuery('')
    setCategory(null)
    setKarat('')
    setWMin('')
    setWMax('')
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    items.forEach((i) => {
      if (i.category) m[i.category] = (m[i.category] || 0) + 1
    })
    return m
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const min = parseFloat(wMin)
    const max = parseFloat(wMax)
    let list = items.filter((i) => {
      if (quick === 'mybids' && !myBidIds?.has(i.id)) return false
      if (quick === 'leading' && !leadingIds?.has(i.id)) return false
      if (category && i.category !== category) return false
      if (karat && i.karat !== karat) return false
      if (!isNaN(min) && (i.weight_grams || 0) < min) return false
      if (!isNaN(max) && (i.weight_grams || 0) > max) return false
      if (q) {
        const hay = `${i.title} ${i.description || ''} ${i.category || ''} ${i.karat || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const endMs = (i: CardItem) => (i.auction_ends_at ? new Date(i.auction_ends_at).getTime() : Infinity)
    const createdMs = (i: CardItem) => (i.created_at ? new Date(i.created_at).getTime() : 0)
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'ending':
          return endMs(a) - endMs(b)
        case 'newest':
          return createdMs(b) - createdMs(a)
        case 'price':
          return b.top_bid - a.top_bid
        case 'bids':
          return b.bid_count - a.bid_count
      }
    })
    return list
  }, [items, query, category, karat, wMin, wMax, sort, quick, myBidIds, leadingIds])

  return (
    <>
      {/* Hero */}
      {showHero && (
        <div className="relative overflow-hidden bg-espresso-900 px-4 py-14 text-center">
          <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
          <div className="pointer-events-none absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="relative">
            <p className="eyebrow text-gold-500/80 mb-3">Just nu på GuldBud</p>
            <h1 className="font-display text-4xl text-gold-100 mb-3">Pågående auktioner</h1>
            <p className="text-gold-200/70 max-w-lg mx-auto text-sm">
              Bläddra bland allt guld som just nu är ute på budgivning. Filtrera, sök och sortera för att
              hitta det du letar efter.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Controls */}
        <div className="sticky top-[104px] z-20 -mx-4 px-4 py-3 bg-cream/85 backdrop-blur border-b border-espresso-100 mb-6">
          {/* Snabbfilter för handlare: Alla / Mina bud / Ledande */}
          {myBidIds && (
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { key: 'all' as const, label: 'Alla auktioner', count: items.length },
                { key: 'mybids' as const, label: 'Mina bud', count: myBidIds.size },
                { key: 'leading' as const, label: 'Ledande', count: leadingIds?.size ?? 0 },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setQuick(t.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    quick === t.key
                      ? 'bg-gold-sheen text-espresso-900 shadow-gold'
                      : 'bg-espresso-50 text-espresso-500 hover:text-espresso-800'
                  }`}
                >
                  {t.label}
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 tabular-nums ${
                      quick === t.key ? 'bg-espresso-900/15' : 'bg-espresso-100 text-espresso-500'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300">
                <SearchIcon size={16} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök efter titel, karat, beskrivning..."
                className="w-full !pl-9"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="w-full sm:w-52 appearance-none !pr-9 cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    Sortera: {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400 text-xs">
                ▼
              </span>
            </div>
          </div>

          {/* Category chips */}
          {availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <CatChip active={category === null} onClick={() => setCategory(null)} label="Alla" count={items.length} />
              {availableCategories.map((c) => (
                <CatChip
                  key={c}
                  active={category === c}
                  onClick={() => setCategory(c)}
                  label={c}
                  count={counts[c]}
                  icon={<CategoryIcon category={c} size={13} strokeWidth={1.8} />}
                />
              ))}
            </div>
          )}

          {/* Karat + weight filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {availableKarats.length > 0 && (
              <div className="relative">
                <select
                  value={karat}
                  onChange={(e) => setKarat(e.target.value)}
                  className="appearance-none !py-1.5 !pr-8 text-sm cursor-pointer"
                >
                  <option value="">Alla karat</option>
                  {availableKarats.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-espresso-400 text-xs">▼</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={wMin}
                onChange={(e) => setWMin(e.target.value)}
                placeholder="Vikt min"
                className="w-24 !py-1.5 text-sm"
              />
              <span className="text-espresso-300 text-sm">–</span>
              <input
                type="number"
                value={wMax}
                onChange={(e) => setWMax(e.target.value)}
                placeholder="max (g)"
                className="w-24 !py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-espresso-500">
            <span className="font-semibold text-espresso-800">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'auktion' : 'auktioner'}
            {category ? ` i ${category}` : ''}
          </p>
          {hasFilter && (
            <button onClick={clearAll} className="text-sm text-gold-600 hover:text-gold-700 transition">
              Rensa filter
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {filtered.map((item) => (
              <AuctionCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center my-4">
            <div className="w-16 h-16 rounded-full bg-gold-50 text-gold-500 flex items-center justify-center mx-auto mb-4">
              <GemIcon size={30} strokeWidth={1.2} />
            </div>
            <p className="font-display text-xl text-espresso-800 mb-2">Inga auktioner matchar</p>
            <p className="text-espresso-500 text-sm">
              {items.length === 0
                ? 'Det finns inga aktiva auktioner just nu. Kom tillbaka snart.'
                : 'Prova att ändra sökningen eller välja en annan kategori.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function CatChip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
        active
          ? 'bg-gold-sheen text-espresso-900 border-transparent shadow-gold'
          : 'bg-white text-espresso-600 border-espresso-200 hover:border-gold-400 hover:text-gold-700'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-xs ${active ? 'text-espresso-900/60' : 'text-espresso-400'}`}>{count}</span>
      )}
    </button>
  )
}
