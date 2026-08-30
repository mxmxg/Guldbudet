'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Item } from '@/lib/types'
import { loadActiveItemsWithStats } from '@/lib/auctions'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CountdownTimer from '@/components/CountdownTimer'
import CategoryIcon from '@/components/CategoryIcon'
import { GemIcon } from '@/components/Icons'
import Image from 'next/image'
import Link from 'next/link'
import { estimateRange, formatSEK } from '@/lib/gold'
import { DEALER_COMMISSION_LABEL, DEALER_SHIPPING_FEE, dealerTotal } from '@/lib/fees'
import { ORDER_STATUS_LABEL, OrderStatus } from '@/lib/orders'
import DownloadInvoiceButton from '@/components/DownloadInvoiceButton'

const INCREMENTS = [100, 250, 500, 1000]

export default function DealerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [myBids, setMyBids] = useState<Record<string, number>>({})
  const [topBids, setTopBids] = useState<Record<string, number>>({})
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({})
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState<string | null>(null)
  const [bidError, setBidError] = useState<Record<string, string>>({})
  const [maxInputs, setMaxInputs] = useState<Record<string, string>>({})
  const [autoMax, setAutoMax] = useState<Record<string, number>>({})
  const [autoBusy, setAutoBusy] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState<'active' | 'mybids' | 'winning' | 'watched' | 'won'>('active')

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push('/auth/login?role=dealer')
      return
    }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'dealer') {
      router.push('/')
      return
    }
    if (!prof.approved) {
      router.push('/auth/pending')
      return
    }
    setProfile(prof)

    await refreshBids(user.id)

    const { data: watch } = await supabase.from('watchlist').select('item_id').eq('dealer_id', user.id)
    setWatchedIds(new Set((watch || []).map((w: any) => w.item_id)))

    // Vunna auktioner = handlarens ordrar (senast först).
    const { data: myOrders } = await supabase
      .from('orders')
      .select('id, amount, status, dealer_paid_at, refunded_at, items(title, image_urls)')
      .eq('dealer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(myOrders || [])

    setLoading(false)
  }

  // Läser om aktiva auktioner + högsta bud/antal via DB-funktionen
  // active_items_with_stats (en query, ingen .in-id-lista som spricker på
  // URL-längd), samt egna bud och egna autobud. Körs efter varje bud och maxbud,
  // eftersom proxy-resolvern kan ha lagt ett bud i databasen som klienten annars
  // inte känner till.
  const refreshBids = async (userId: string) => {
    const rows = await loadActiveItemsWithStats(supabase)
    // Behåll dashboardens ordning: senast inlagda först.
    const list = (rows as any[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setItems(list as Item[])
    const top: Record<string, number> = {}
    const counts: Record<string, number> = {}
    list.forEach((r: any) => {
      top[r.id] = r.top_bid || 0
      counts[r.id] = r.bid_count || 0
    })
    setTopBids(top)
    setBidCounts(counts)

    const { data: mine } = await supabase.from('bids').select('item_id, amount').eq('dealer_id', userId)
    const my: Record<string, number> = {}
    mine?.forEach((b: any) => {
      if (!my[b.item_id] || b.amount > my[b.item_id]) my[b.item_id] = b.amount
    })
    setMyBids(my)

    const { data: autos } = await supabase.from('auto_bids').select('item_id, max_amount').eq('dealer_id', userId)
    const am: Record<string, number> = {}
    autos?.forEach((a: any) => {
      am[a.item_id] = a.max_amount
    })
    setAutoMax(am)
  }

  const placeBid = async (itemId: string) => {
    const amount = parseInt(bidInputs[itemId] || '0')
    const currentTop = topBids[itemId] || 0
    const item = items.find((i) => i.id === itemId)
    const setErr = (m: string) => setBidError((p) => ({ ...p, [itemId]: m }))
    setBidError((p) => ({ ...p, [itemId]: '' }))
    if (item?.auction_ends_at && new Date(item.auction_ends_at).getTime() < Date.now()) {
      setErr('Auktionen är avslutad – det går inte längre att buda.')
      return
    }
    if (!amount || amount <= currentTop) {
      setErr(`Budet måste vara minst ${(currentTop + 1).toLocaleString('sv-SE')} kr.`)
      return
    }
    setBidding(itemId)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const { error } = await supabase.from('bids').insert({ item_id: itemId, dealer_id: user!.id, amount })
    if (error) {
      setErr(error.message)
    } else {
      setBidInputs((prev) => ({ ...prev, [itemId]: '' }))
      // Läs om från databasen: proxy-resolvern kan ha lagt ett motbud direkt.
      await refreshBids(user!.id)
    }
    setBidding(null)
  }

  // Additiv höjning: varje klick lägger till inc ovanpå det som redan står i
  // budrutan, så man kan stapla (+1000 sen +500 = +1500). Golv på top + 100.
  const bump = (itemId: string, inc: number, top: number) => {
    setBidInputs((prev) => {
      const base = parseInt(prev[itemId] || '') || top || 0
      return { ...prev, [itemId]: String(Math.max(top + 100, base + inc)) }
    })
  }

  const setAutoBid = async (itemId: string) => {
    const val = parseInt(maxInputs[itemId] || '0')
    const currentTop = topBids[itemId] || 0
    const setErr = (m: string) => setBidError((p) => ({ ...p, [itemId]: m }))
    setBidError((p) => ({ ...p, [itemId]: '' }))
    if (!val || val <= currentTop) {
      setErr(`Maxbudet måste vara högre än ${currentTop.toLocaleString('sv-SE')} kr.`)
      return
    }
    setAutoBusy(itemId)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const { error } = await supabase
      .from('auto_bids')
      .upsert({ item_id: itemId, dealer_id: user!.id, max_amount: val }, { onConflict: 'item_id,dealer_id' })
    if (error) {
      setErr(/row-level security|policy|violates/i.test(error.message) ? 'Går inte att sätta maxbud här just nu.' : error.message)
    } else {
      setAutoMax((prev) => ({ ...prev, [itemId]: val }))
      setMaxInputs((prev) => ({ ...prev, [itemId]: '' }))
      // Resolvern kan ha budat åt dig direkt – läs om.
      await refreshBids(user!.id)
    }
    setAutoBusy(null)
  }

  const removeAutoBid = async (itemId: string) => {
    setAutoBusy(itemId)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    // Kolla felet: annars kan raden ligga kvar medan UI:t visar borttaget, och
    // proxy-resolvern fortsätter buda upp till det gamla maxbudet.
    const { error } = await supabase.from('auto_bids').delete().eq('item_id', itemId).eq('dealer_id', user!.id)
    if (error) {
      setBidError((p) => ({ ...p, [itemId]: 'Kunde inte ta bort maxbudet. Försök igen.' }))
      setAutoBusy(null)
      return
    }
    setAutoMax((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setAutoBusy(null)
  }

  const winningCount = items.filter((i) => myBids[i.id] && myBids[i.id] === topBids[i.id]).length
  const displayItems =
    tab === 'mybids'
      ? items.filter((i) => myBids[i.id])
      : tab === 'winning'
      ? items.filter((i) => myBids[i.id] && myBids[i.id] === topBids[i.id])
      : tab === 'watched'
      ? items.filter((i) => watchedIds.has(i.id))
      : items

  const tabs: { key: typeof tab; label: string; count?: number }[] = [
    { key: 'active', label: 'Alla auktioner', count: items.length },
    { key: 'mybids', label: 'Mina bud', count: items.filter((i) => myBids[i.id]).length },
    { key: 'winning', label: 'Ledande', count: winningCount },
    { key: 'watched', label: 'Bevakade', count: watchedIds.size },
    { key: 'won', label: 'Vunna', count: orders.length },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 py-10">
          <p className="eyebrow text-gold-500/80 mb-1">Handlarpanel</p>
          <h1 className="font-display text-3xl text-gold-100">
            {profile?.company_name || profile?.full_name || 'Budpanel'}
          </h1>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <HeaderStat value={items.length} label="Aktiva auktioner" />
            <HeaderStat value={Object.keys(myBids).length} label="Dina bud" />
            <HeaderStat value={winningCount} label="Ledande bud" accent />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Tabs — scroll within their own row on small screens */}
        <div className="-mx-4 px-4 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 bg-white border border-espresso-100 p-1 rounded-xl w-max shadow-soft">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                tab === t.key ? 'bg-gold-sheen text-espresso-900 shadow-gold' : 'text-espresso-500 hover:text-espresso-800'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.key ? 'bg-espresso-900/15' : 'bg-espresso-100 text-espresso-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl skeleton" />
            ))}
          </div>
        ) : tab === 'won' ? (
          orders.length === 0 ? (
            <div className="card p-16 text-center text-espresso-400">
              <div className="flex justify-center mb-3 text-gold-500/50 animate-float"><GemIcon size={30} strokeWidth={1.2} /></div>
              <p>Du har inte vunnit någon auktion ännu.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {orders.map((o) => {
                const paid = !!o.dealer_paid_at
                const refunded = !!o.refunded_at
                const unpaid = !paid && !refunded && o.status !== 'cancelled'
                return (
                  <div
                    key={o.id}
                    className={`card overflow-hidden flex items-center gap-4 p-4 ${unpaid ? 'ring-2 ring-gold-300' : ''}`}
                  >
                    <Link
                      href={`/orders/${o.id}`}
                      className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shrink-0"
                    >
                      {o.items?.image_urls?.[0] && (
                        <Image src={o.items.image_urls[0]} alt="" fill sizes="64px" className="object-contain" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-display text-lg text-espresso-900 hover:text-gold-700 transition truncate block"
                      >
                        {o.items?.title || 'Föremål'}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="chip bg-espresso-100 text-espresso-600">
                          {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                        </span>
                        {refunded ? (
                          <span className="chip bg-amber-100 text-amber-700">Återgått</span>
                        ) : paid ? (
                          <span className="chip bg-emerald-100 text-emerald-700">Betald ✓</span>
                        ) : o.status !== 'cancelled' ? (
                          <span className="chip bg-gold-100 text-gold-800">Att betala</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-espresso-400">Ditt totalpris</p>
                      <p className="font-semibold text-gold-700 tabular-nums">{formatSEK(dealerTotal(o.amount))}</p>
                      <Link
                        href={`/orders/${o.id}`}
                        className={`inline-block mt-1.5 text-sm ${
                          unpaid ? 'btn-gold !py-1.5 !px-4' : 'text-gold-600 hover:text-gold-700'
                        }`}
                      >
                        {unpaid ? 'Betala nu' : 'Visa affär'}
                      </Link>
                      <div className="mt-1.5">
                        <DownloadInvoiceButton orderId={o.id} label="Ladda ner faktura (PDF)" className="text-xs text-espresso-500 hover:text-espresso-800 disabled:opacity-50" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : displayItems.length === 0 ? (
          <div className="card p-16 text-center text-espresso-400">
            <div className="flex justify-center mb-3 text-gold-500/50 animate-float"><GemIcon size={30} strokeWidth={1.2} /></div>
            <p>
              {tab === 'mybids'
                ? 'Du har inte lagt några bud ännu.'
                : tab === 'winning'
                ? 'Du leder inte i någon auktion just nu.'
                : tab === 'watched'
                ? 'Du bevakar inga auktioner. Öppna en auktion och tryck "Bevaka" så påminner vi dig innan den slutar.'
                : 'Inga aktiva auktioner just nu.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {displayItems.map((item) => {
              const top = topBids[item.id] || 0
              const mine = myBids[item.id]
              const isWinning = mine && mine === top
              const count = bidCounts[item.id] || 0
              const est = estimateRange(item.weight_grams || 0, item.karat || '')
              return (
                <div
                  key={item.id}
                  className={`card overflow-hidden flex flex-col sm:flex-row transition ${
                    isWinning ? 'ring-2 ring-emerald-300' : ''
                  }`}
                >
                  <Link
                    href={`/auctions/${item.id}`}
                    className="w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 bg-gradient-to-br from-espresso-800 to-espresso-600 relative group"
                  >
                    {item.image_urls?.[0] ? (
                      <Image src={item.image_urls[0]} alt={item.title} fill sizes="(max-width: 640px) 100vw, 160px" className="object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><CategoryIcon category={item.category} size={40} className="text-gold-500/40" strokeWidth={1.2} /></div>
                    )}
                    {item.auction_ends_at && (
                      <div className="absolute top-2 left-2">
                        <CountdownTimer endsAt={item.auction_ends_at} variant="chip" className="backdrop-blur" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/auctions/${item.id}`} className="font-display text-lg text-espresso-900 hover:text-gold-700 transition">
                          {item.title}
                        </Link>
                        {isWinning && <span className="chip bg-emerald-100 text-emerald-700">✓ Ledande</span>}
                        {mine && !isWinning && <span className="chip bg-amber-100 text-amber-700">Överbjuden</span>}
                      </div>
                      <p className="text-xs text-espresso-400 mb-3">
                        {item.category ? `${item.category} · ` : ''}{item.weight_grams} g · {item.karat}
                        {item.gemstone ? ` · ${item.gemstone}${item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}` : ''} · {count} bud
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span>
                          <span className="text-espresso-400">Högsta: </span>
                          <span className="font-semibold text-gold-700 tabular-nums">
                            {top ? formatSEK(top) : 'Inga bud'}
                          </span>
                        </span>
                        {mine && (
                          <span>
                            <span className="text-espresso-400">Ditt: </span>
                            <span className="font-medium tabular-nums">{formatSEK(mine)}</span>
                          </span>
                        )}
                        <span className="text-espresso-400 text-xs">
                          Est. utbetalning {formatSEK(est.low)}–{formatSEK(est.high)}
                        </span>
                      </div>
                    </div>

                    <div className="lg:w-auto lg:min-w-[19rem]">
                      {/* Additiva höj-knappar */}
                      <div className="flex flex-wrap gap-1.5 mb-2 lg:justify-end">
                        {INCREMENTS.map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => bump(item.id, inc, top)}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-espresso-200 text-espresso-600 hover:border-gold-400 hover:text-gold-700 hover:bg-gold-50 transition"
                          >
                            +{inc.toLocaleString('sv-SE')}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1 lg:flex-initial">
                          <input
                            type="number"
                            value={bidInputs[item.id] || ''}
                            onChange={(e) => setBidInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder={`Min ${(top + 100).toLocaleString('sv-SE')}`}
                            aria-label={`Ditt bud i kronor på ${item.title}`}
                            className="w-full lg:w-40 !pr-8 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-300 text-xs">kr</span>
                        </div>
                        <button
                          onClick={() => placeBid(item.id)}
                          disabled={bidding === item.id}
                          className="btn-gold whitespace-nowrap !px-5 !py-2.5"
                        >
                          {bidding === item.id ? '...' : 'Buda'}
                        </button>
                      </div>
                      <p className="text-[11px] text-espresso-400 mt-1.5 lg:text-right">
                        {parseInt(bidInputs[item.id] || '0') > 0
                          ? `Bud + ${DEALER_COMMISSION_LABEL} provision + frakt ${formatSEK(DEALER_SHIPPING_FEE)} inkl moms · totalt ${formatSEK(dealerTotal(parseInt(bidInputs[item.id])))}`
                          : `Provision ${DEALER_COMMISSION_LABEL} + frakt ${DEALER_SHIPPING_FEE} kr + moms tillkommer`}
                      </p>

                      {/* Maxbud (autobud) */}
                      <div className="mt-2">
                        {autoMax[item.id] ? (
                          <div className="flex items-center justify-between gap-2 rounded-lg bg-gold-50 border border-gold-200 px-2.5 py-1.5">
                            <span className="text-[11px] text-gold-800">
                              Autobud upp till{' '}
                              <span className="font-medium tabular-nums">{formatSEK(autoMax[item.id])}</span>
                            </span>
                            <button
                              onClick={() => removeAutoBid(item.id)}
                              disabled={autoBusy === item.id}
                              className="text-[11px] text-espresso-400 hover:text-red-500 shrink-0"
                            >
                              Ta bort
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1 lg:flex-initial">
                              <input
                                type="number"
                                value={maxInputs[item.id] || ''}
                                onChange={(e) => setMaxInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="Maxbud (dolt)"
                                aria-label={`Maxbud i kronor (autobud) på ${item.title}`}
                                className="w-full lg:w-40 !pr-8 text-sm"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-300 text-xs">kr</span>
                            </div>
                            <button
                              onClick={() => setAutoBid(item.id)}
                              disabled={autoBusy === item.id}
                              className="btn-ghost-gold whitespace-nowrap !px-4 !py-2 text-sm"
                            >
                              {autoBusy === item.id ? '...' : 'Maxbud'}
                            </button>
                          </div>
                        )}
                      </div>

                      {bidError[item.id] && (
                        <p className="text-[11px] text-red-500 mt-1 lg:text-right">{bidError[item.id]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function HeaderStat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-display text-2xl ${accent ? 'text-emerald-400' : 'text-gold-100'}`}>{value}</div>
      <div className="text-xs text-gold-500/60">{label}</div>
    </div>
  )
}
