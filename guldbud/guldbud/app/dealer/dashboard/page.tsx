'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { loginUrl } from '@/lib/loginUrl'
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
import { useGoldPrice } from '@/lib/useGoldPrice'
import { BANKID_LIVE } from '@/lib/identity'
import { DEALER_COMMISSION_LABEL, DEALER_SHIPPING_FEE, dealerTotal, feesAt } from '@/lib/fees'
import { ORDER_STATUS_LABEL, OrderStatus } from '@/lib/orders'
import DownloadInvoiceButton from '@/components/DownloadInvoiceButton'

const INCREMENTS = [100, 250, 500, 1000]

type AwaitingItem = { id: string; title: string; image_urls: string[]; auction_ends_at: string | null; myBid: number }

export default function DealerDashboard() {
  // 24K-priset per gram, live. Faller tillbaka på riktvärdet i lib/gold
  // tills /api/gold-price svarat.
  const { price: spot } = useGoldPrice()
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
  // Avslutade auktioner där handlaren har högsta budet men säljaren ännu
  // inte accepterat eller avböjt. Föremålet står kvar som active med passerad
  // sluttid (settle_ended_auctions stänger inte), så active_items_with_stats
  // tar inte med det. Utan den här listan försvann de ur panelen helt:
  // kontrollerat 2026-09-17, ett konto hade 14 sådana och panelen visade
  // "Inga aktiva auktioner just nu".
  const [awaiting, setAwaiting] = useState<AwaitingItem[]>([])
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
      router.push(loginUrl('dealer'))
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

    const activeCount = await refreshBids(user.id)

    const { data: watch } = await supabase.from('watchlist').select('item_id').eq('dealer_id', user.id)
    setWatchedIds(new Set((watch || []).map((w: any) => w.item_id)))

    // Vunna auktioner = handlarens ordrar (senast först).
    const { data: myOrders } = await supabase
      .from('orders')
      .select('id, amount, status, dealer_paid_at, fee_paid_at, refunded_at, created_at, items(title, image_urls)')
      .eq('dealer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(myOrders || [])
    // Pågår ingen auktion men finns det vunna affärer ska de synas direkt,
    // inte ligga bakom en flik som säger "Inga aktiva auktioner just nu".
    if (activeCount === 0 && (myOrders || []).length > 0) setTab('won')

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

    // Avslutade auktioner som väntar på säljaren, se AwaitingItem.
    const bidItemIds = Object.keys(my)
    let waiting: AwaitingItem[] = []
    if (bidItemIds.length > 0) {
      const { data: ended } = await supabase
        .from('items')
        .select('id, title, image_urls, auction_ends_at')
        .in('id', bidItemIds)
        .eq('status', 'active')
        .lte('auction_ends_at', new Date().toISOString())
      const endedIds = (ended || []).map((i: any) => i.id)
      if (endedIds.length > 0) {
        const { data: endedBids } = await supabase.from('bids').select('item_id, amount').in('item_id', endedIds)
        const topEnded: Record<string, number> = {}
        endedBids?.forEach((b: any) => {
          if (!topEnded[b.item_id] || b.amount > topEnded[b.item_id]) topEnded[b.item_id] = b.amount
        })
        waiting = (ended || [])
          .filter((i: any) => my[i.id] && my[i.id] >= (topEnded[i.id] || 0))
          .map((i: any) => ({ id: i.id, title: i.title, image_urls: i.image_urls || [], auction_ends_at: i.auction_ends_at, myBid: my[i.id] }))
      }
    }
    setAwaiting(waiting)
    return list.length
  }

  const placeBid = async (itemId: string) => {
    const amount = parseInt(bidInputs[itemId] || '0')
    const currentTop = topBids[itemId] || 0
    const item = items.find((i) => i.id === itemId)
    const setErr = (m: string) => setBidError((p) => ({ ...p, [itemId]: m }))
    setBidError((p) => ({ ...p, [itemId]: '' }))
    if (item?.auction_ends_at && new Date(item.auction_ends_at).getTime() < Date.now()) {
      setErr('Auktionen är avslutad, det går inte längre att buda.')
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
      // Resolvern kan ha budat åt dig direkt, läs om.
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

  // Vad handlaren själv ska göra i sina affärer under väg C: betala GuldBuds
  // faktura (fee_paid_at) omgående, och köpeskillingen till säljaren
  // (dealer_paid_at) när föremålet är mottaget och kontrollerat.
  const todo: { o: any; label: string }[] = orders.flatMap((o) => {
    if (o.status === 'cancelled' || o.status === 'completed' || o.refunded_at) return []
    if (!o.fee_paid_at) return [{ o, label: 'Betala GuldBuds faktura' }]
    if (['received', 'dealer_paid'].includes(o.status) && !o.dealer_paid_at)
      return [{ o, label: 'Betala köpeskillingen till säljaren' }]
    return []
  })

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
            {/* Samma tal som fliken Mina bud: bud i auktioner som pågår. Tidigare
                räknades alla föremål handlaren någonsin budat på, så rutan sa
                28 bredvid "0 aktiva auktioner" och fliken sa 0. */}
            <HeaderStat value={items.filter((i) => myBids[i.id]).length} label="Mina bud i pågående" />
            <HeaderStat value={winningCount} label="Ledande bud" accent />
            {awaiting.length > 0 && <HeaderStat value={awaiting.length} label="Väntar på säljarens svar" />}
            <HeaderStat value={orders.length} label="Vunna auktioner" onClick={() => setTab('won')} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Handlaren måste vara legitimerad med BankID för att få buda.
            Databasen stoppar budet via dealer_may_bid; det här är beskedet om
            varför, och vägen dit. Panelen är fortfarande läsbar: att kunna se
            auktionerna är det som gör att en ny handlare orkar legitimera sig. */}
        {BANKID_LIVE && profile && !profile.identity_verified && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <p className="font-medium text-amber-800 mb-1">Legitimera dig med BankID för att kunna buda</p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Säljarna hos oss är privatpersoner, och vi lovar dem att varje handlare är legitimerad.
              Du kan titta på auktionerna redan nu, men bud går inte igenom förrän du är verifierad.
              Det tar en minut och behöver bara göras en gång.
            </p>
            <Link
              href="/verifiering"
              className="inline-block mt-3 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              Legitimera med BankID
            </Link>
          </div>
        )}

        {/* Det som kräver handling, överst så det syns direkt efter inloggning:
            fakturor och köpeskillingar att betala, och auktioner som väntar på
            säljarens svar. */}
        {!loading && (todo.length > 0 || awaiting.length > 0) && (
          <div className="grid gap-4 mb-6">
            {todo.length > 0 && (
              <section className="card p-5 ring-2 ring-gold-300">
                <h2 className="font-display text-lg text-espresso-900 mb-3">Att göra</h2>
                <div className="grid gap-2">
                  {todo.map(({ o, label }) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50/50 p-3 hover:border-gold-400 transition min-w-0"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-espresso-900 relative shrink-0">
                        {o.items?.image_urls?.[0] && (
                          <Image src={o.items.image_urls[0]} alt="" fill sizes="40px" className="object-contain" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-espresso-900 line-clamp-2">{o.items?.title || 'Föremål'}</p>
                        <p className="text-xs text-gold-800">{label}</p>
                      </div>
                      <span className="btn-gold !py-1.5 !px-3 text-xs shrink-0">Öppna</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {awaiting.length > 0 && (
              <section className="card p-5">
                <h2 className="font-display text-lg text-espresso-900 mb-1">Väntar på säljarens svar</h2>
                <p className="text-xs text-espresso-400 mb-3">
                  Auktioner som är avslutade med ditt bud högst. Säljaren väljer att acceptera eller avböja, och du får besked direkt.
                </p>
                <div className="grid gap-2">
                  {awaiting.map((a) => (
                    <Link
                      key={a.id}
                      href={`/auctions/${a.id}`}
                      className="flex items-center gap-3 rounded-xl border border-espresso-100 p-3 hover:border-gold-300 transition min-w-0"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-espresso-900 relative shrink-0">
                        {a.image_urls[0] && <Image src={a.image_urls[0]} alt="" fill sizes="40px" className="object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-espresso-900 line-clamp-2">{a.title}</p>
                        <p className="text-xs text-espresso-400">
                          Avslutad {a.auction_ends_at ? new Date(a.auction_ends_at).toLocaleDateString('sv-SE') : ''}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gold-700 tabular-nums shrink-0">{formatSEK(a.myBid)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Flikarna radbryter i stället för att rulla dolt i sidled: på en
            telefon låg "Bevakade" och "Vunna" utanför skärmen utan att något
            visade det. */}
        <div className="mb-6">
        <div className="flex flex-wrap gap-1 bg-white border border-espresso-100 p-1 rounded-xl w-fit max-w-full shadow-soft">
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
            /* minmax(0,1fr): grid-barnen vägrar annars krympa under sin
               min-content-bredd, se profilen. Raden staplas i telefonbredd:
               med allt på en rad fick titeln 92 px av 390 (uppmätt 2026-09-17)
               och klipptes till "Tungt he…". */
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              {orders.map((o) => {
                const paid = !!o.dealer_paid_at
                const refunded = !!o.refunded_at
                const unpaid = !paid && !refunded && o.status !== 'cancelled'
                return (
                  <div
                    key={o.id}
                    className={`card overflow-hidden flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 ${unpaid ? 'ring-2 ring-gold-300' : ''}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
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
                          className="font-display text-lg leading-snug text-espresso-900 hover:text-gold-700 transition line-clamp-2 block"
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
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-espresso-100 pt-3 sm:border-0 sm:pt-0 sm:block sm:text-right shrink-0">
                      <div>
                        <p className="text-[11px] text-espresso-400">Ditt totalpris</p>
                        <p className="font-semibold text-gold-700 tabular-nums">{formatSEK(feesAt(o.created_at).dealerTotal(o.amount))}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Link
                          href={`/orders/${o.id}`}
                          className={`inline-block text-sm ${
                            unpaid ? 'btn-gold !py-1.5 !px-4' : 'text-gold-600 hover:text-gold-700'
                          }`}
                        >
                          {unpaid ? 'Betala nu' : 'Visa affär'}
                        </Link>
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
              const est = estimateRange(item.weight_grams || 0, item.karat || '', spot)
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
                          Est. utbetalning {formatSEK(est.low)}-{formatSEK(est.high)}
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

function HeaderStat({
  value,
  label,
  accent,
  onClick,
}: {
  value: number
  label: string
  accent?: boolean
  onClick?: () => void
}) {
  const inner = (
    <>
      <div className={`font-display text-2xl ${accent ? 'text-emerald-400' : 'text-gold-100'}`}>{value}</div>
      <div className="text-xs text-gold-500/60">{label}{onClick ? ' →' : ''}</div>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left hover:opacity-80 transition !bg-none !shadow-none !p-0 !rounded-none !block">
        {inner}
      </button>
    )
  }
  return <div>{inner}</div>
}
