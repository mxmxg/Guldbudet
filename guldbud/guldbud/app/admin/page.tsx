'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TrashIcon } from '@/components/Icons'
import CountdownTimer from '@/components/CountdownTimer'
import { estimateRange, formatSEK } from '@/lib/gold'
import { commission } from '@/lib/fees'
import { OPEN_ORDER_STATES } from '@/lib/orders'

function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPage() {
  const [pendingDealers, setPendingDealers] = useState<any[]>([])
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [liveItems, setLiveItems] = useState<any[]>([])
  const [topBids, setTopBids] = useState<Record<string, number>>({})
  const [topBidIds, setTopBidIds] = useState<Record<string, string>>({})
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({})
  const [sellers, setSellers] = useState<Record<string, any>>({})
  const [openOrders, setOpenOrders] = useState(0)
  const [analytics, setAnalytics] = useState({ gmv: 0, commission: 0, pendingCommission: 0, completed: 0 })
  const [adminError, setAdminError] = useState('')
  const [adminNotice, setAdminNotice] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string[] | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [endingId, setEndingId] = useState<string | null>(null)
  const [endConfirmId, setEndConfirmId] = useState<string | null>(null)
  const [acceptId, setAcceptId] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }

      const { data: dealers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'dealer')
        .eq('approved', false)
        .order('created_at', { ascending: false })
      // Ingen profil-join här: en RLS-hicka på kopplingen tömmer annars hela
      // listan. Säljar-info hämtas separat nedan (samma mönster som aktiva).
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      // Bara aktiva auktioner. Så fort ett bud godkänts blir föremålet en
      // affär (status 'closed' + order) och hanteras under Affärer i stället –
      // det ska inte skräpa i auktionslistan.
      const { data: active } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', OPEN_ORDER_STATES)

      const { data: allOrders } = await supabase.from('orders').select('amount, status, dealer_paid_at')
      // Affärsvolym = värdet på alla affärer som inte avbrutits.
      const settled = (allOrders || []).filter((o: any) => o.status !== 'cancelled')
      // Provisionsintäkt = realiserad. Handlarens betalning är registrerad
      // (dealer_paid_at) ELLER affären är slutförd – en affär kan inte nå
      // 'completed' utan att betalningen passerat spärren, så slutförd innebär
      // alltid att provisionen är intjänad (även om paid-flaggan råkat nollas).
      const isRealized = (o: any) => o.status === 'completed' || !!o.dealer_paid_at
      const paid = settled.filter(isRealized)
      // Väntande provision = affärer som ännu inte realiserats.
      const unpaid = settled.filter((o: any) => !isRealized(o))
      setAnalytics({
        gmv: settled.reduce((s: number, o: any) => s + (o.amount || 0), 0),
        commission: paid.reduce((s: number, o: any) => s + commission(o.amount || 0), 0),
        pendingCommission: unpaid.reduce((s: number, o: any) => s + commission(o.amount || 0), 0),
        completed: (allOrders || []).filter((o: any) => o.status === 'completed').length,
      })

      setPendingDealers(dealers || [])
      setPendingItems(items || [])
      setLiveItems(active || [])

      // Säljar-info för både pending och aktiva föremål, hämtad separat (inte
      // som join) så en RLS-hicka på kopplingen aldrig kan tömma listorna.
      const ownerIds = Array.from(
        new Set([...(items || []), ...(active || [])].map((i: any) => i.owner_id).filter(Boolean))
      )
      if (ownerIds.length) {
        const { data: sellers } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, city')
          .in('id', ownerIds)
        const smap: Record<string, any> = {}
        sellers?.forEach((s: any) => (smap[s.id] = s))
        setSellers(smap)
      }

      if (active && active.length > 0) {
        const ids = active.map((i: any) => i.id)
        const { data: bids } = await supabase
          .from('bids')
          .select('id, item_id, amount, created_at')
          .in('item_id', ids)
          .order('amount', { ascending: false })
          .order('created_at', { ascending: true })
        const top: Record<string, number> = {}
        const topId: Record<string, string> = {}
        const counts: Record<string, number> = {}
        bids?.forEach((b: any) => {
          counts[b.item_id] = (counts[b.item_id] || 0) + 1
          // Bids kommer sorterade (belopp fallande, tid stigande) → första per
          // föremål är vinnaren, precis som settle_ended_auctions räknar.
          if (top[b.item_id] === undefined) {
            top[b.item_id] = b.amount
            topId[b.item_id] = b.id
          }
        })
        setTopBids(top)
        setTopBidIds(topId)
        setBidCounts(counts)
      }
      setOpenOrders(ordersCount || 0)
      setLoading(false)
    }
    load()
  }, [])

  const deleteItem = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) {
      setAdminError('Kunde inte radera: ' + error.message)
      setDeletingId(null)
      return
    }
    setLiveItems((prev) => prev.filter((i) => i.id !== id))
    setPendingItems((prev) => prev.filter((i) => i.id !== id))
    setDeletingId(null)
    setConfirmId(null)
  }

  const applyEnd = async (item: any, iso: string, notice: string) => {
    setAdminError('')
    setAdminNotice('')
    const { error } = await supabase
      .from('items')
      .update({ auction_ends_at: iso, ended_notified: false })
      .eq('id', item.id)
    if (error) {
      setAdminError('Kunde inte ändra sluttiden: ' + error.message)
      return
    }
    setLiveItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, auction_ends_at: iso } : i)))
    setAdminNotice(notice)
  }

  const extendAuction = (item: any) => {
    const base = item.auction_ends_at ? new Date(item.auction_ends_at).getTime() : Date.now()
    const newEnd = new Date(Math.max(base, Date.now()) + 24 * 60 * 60 * 1000).toISOString()
    applyEnd(item, newEnd, `"${item.title}" förlängdes 24 timmar.`)
  }

  const endAuctionNow = async (item: any) => {
    setEndingId(item.id)
    await applyEnd(item, new Date().toISOString(), `"${item.title}" avslutades. Säljaren får nu bekräfta högsta budet.`)
    // Kör avräkningen direkt så säljaren notifieras nu i stället för att vänta på cron-jobbet.
    try {
      await supabase.rpc('settle_ended_auctions')
    } catch {
      /* cron-jobbet kör ändå varje minut */
    }
    setEndingId(null)
  }

  // Godkänn det vinnande budet åt säljaren. Sätter items → 'closed' + accepted_bid_id;
  // DB-triggern skapar då affären, som dyker upp under Affärer.
  const acceptTopBid = async (item: any) => {
    const bidId = topBidIds[item.id]
    if (!bidId) return
    setAcceptingId(item.id)
    setAdminError('')
    setAdminNotice('')
    const { data, error } = await supabase
      .from('items')
      .update({ accepted_bid_id: bidId, accepted_at: new Date().toISOString(), status: 'closed' })
      .eq('id', item.id)
      .select('id')
    if (error) {
      setAdminError('Kunde inte godkänna budet: ' + error.message)
      setAcceptingId(null)
      return
    }
    if (!data || data.length === 0) {
      setAdminError(
        'Godkännandet gick inte igenom, ingen rad uppdaterades. Det beror oftast på att databasen inte är helt uppdaterad. Kör senaste SQL-blocket och försök igen.'
      )
      setAcceptingId(null)
      return
    }
    // Föremålet blir nu en affär (hanteras under Affärer) → ta bort det från
    // auktionslistan så det inte ligger kvar och skräpar.
    setLiveItems((prev) => prev.filter((i) => i.id !== item.id))
    // En ny affär skapas av DB-triggern → håll "pågående affärer"-räknaren i synk
    // utan att behöva ladda om sidan.
    setOpenOrders((n) => n + 1)
    setAdminNotice(
      `Budet på ${formatSEK(topBids[item.id])} godkändes åt säljaren. Affären finns nu under Affärer.`
    )
    setAcceptId(null)
    setAcceptingId(null)
  }

  const setSpecificEnd = (item: any, localValue: string) => {
    if (!localValue) return
    const iso = new Date(localValue).toISOString()
    applyEnd(item, iso, `Ny sluttid satt för "${item.title}".`)
  }

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from('dealer-docs').createSignedUrl(path, 120)
    if (error || !data?.signedUrl) {
      setAdminError('Kunde inte öppna dokumentet: ' + (error?.message || 'okänt fel'))
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const approveDealer = async (id: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('id', id)
    setPendingDealers((prev) => prev.filter((d) => d.id !== id))
  }

  const rejectDealer = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    setPendingDealers((prev) => prev.filter((d) => d.id !== id))
  }

  const approveItem = async (id: string) => {
    await supabase
      .from('items')
      .update({
        status: 'active',
        auction_ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', id)
    setPendingItems((prev) => prev.filter((i) => i.id !== id))
  }

  const rejectItem = async (id: string) => {
    await supabase.from('items').update({ status: 'rejected' }).eq('id', id)
    setPendingItems((prev) => prev.filter((i) => i.id !== id))
  }

  const openLightbox = (urls?: string[], i = 0) => {
    if (!urls || urls.length === 0) return
    setLightbox(urls)
    setLightboxIdx(i)
  }

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i + 1) % lightbox.length)
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i - 1 + lightbox.length) % lightbox.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const isEnded = (item: any) =>
    item.status === 'active' && !!item.auction_ends_at && new Date(item.auction_ends_at) <= new Date()

  const renderAuctionRow = (item: any) => {
    const ended = isEnded(item)
    return (
      <div key={item.id} className="card p-4 flex gap-4 items-center flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={() => openLightbox(item.image_urls, 0)}
          className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-800 to-espresso-600 relative shrink-0 cursor-zoom-in group"
          title="Visa bilden stort"
        >
          {item.image_urls?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-contain transition group-hover:opacity-80" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-espresso-900">{item.title}</p>
            {item.status === 'closed' ? (
              <span className="chip bg-espresso-100 text-espresso-500">Avslutad</span>
            ) : ended ? (
              <span className="chip bg-amber-100 text-amber-700">Slut – inväntar säljare</span>
            ) : (
              <span className="chip bg-emerald-100 text-emerald-700">Aktiv</span>
            )}
          </div>
          <p className="text-xs text-espresso-400 mt-0.5">
            {item.category ? `${item.category} · ` : ''}{item.weight_grams} g · {item.karat}
            {item.gemstone ? ` · ${item.gemstone}${item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}` : ''}
          </p>
          {sellers[item.owner_id] && (
            <p className="text-xs text-espresso-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                Säljare:{' '}
                <span className="font-medium text-espresso-800">{sellers[item.owner_id].full_name || '—'}</span>
                {sellers[item.owner_id].city ? ` · ${sellers[item.owner_id].city}` : ''}
              </span>
              {sellers[item.owner_id].email && (
                <a href={`mailto:${sellers[item.owner_id].email}`} className="text-gold-700 hover:underline">
                  {sellers[item.owner_id].email}
                </a>
              )}
              {sellers[item.owner_id].phone && (
                <a href={`tel:${sellers[item.owner_id].phone}`} className="text-gold-700 hover:underline">
                  {sellers[item.owner_id].phone}
                </a>
              )}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gold-700 tabular-nums">
              {topBids[item.id] ? formatSEK(topBids[item.id]) : 'Inga bud'}
            </span>
            <span className="text-xs text-espresso-400">{bidCounts[item.id] || 0} bud</span>
            {item.status === 'active' && item.auction_ends_at && !ended && (
              <CountdownTimer endsAt={item.auction_ends_at} variant="chip" />
            )}
            {ended && (
              <span className="text-xs font-medium text-amber-700">Auktionen har avslutats</span>
            )}
          </div>
        </div>
        <div className="w-full min-w-0 sm:w-auto sm:shrink-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-wrap sm:justify-end">
          {/* Godkänn vinnande bud åt säljaren när auktionen är slut */}
          {item.status === 'active' && ended && topBidIds[item.id] && confirmId !== item.id && (
            acceptId === item.id ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => acceptTopBid(item)}
                  disabled={acceptingId === item.id}
                  className="flex-1 sm:flex-none text-sm font-medium px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {acceptingId === item.id ? 'Godkänner…' : `Ja, godkänn ${formatSEK(topBids[item.id])}`}
                </button>
                <button
                  onClick={() => setAcceptId(null)}
                  className="flex-1 sm:flex-none text-sm font-medium px-3 py-2 rounded-xl bg-espresso-100 hover:bg-espresso-200 text-espresso-600 transition"
                >
                  Avbryt
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAcceptId(item.id)}
                className="w-full sm:w-auto text-sm font-medium px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                Godkänn budet åt säljaren →
              </button>
            )
          )}
          {item.status === 'active' && confirmId !== item.id && acceptId !== item.id && (
            <>
              <button
                onClick={() => extendAuction(item)}
                className="w-full sm:w-auto text-sm text-espresso-600 hover:text-gold-700 border border-espresso-200 hover:border-gold-300 px-3 py-2 rounded-xl transition"
              >
                Förläng 24h
              </button>
              {!ended &&
                (endConfirmId === item.id ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={async () => {
                        await endAuctionNow(item)
                        setEndConfirmId(null)
                      }}
                      disabled={endingId === item.id}
                      className="flex-1 sm:flex-none text-sm font-medium px-3 py-2 rounded-xl bg-espresso-800 hover:bg-espresso-900 text-white transition disabled:opacity-50"
                    >
                      {endingId === item.id ? 'Avslutar…' : 'Ja, avsluta nu'}
                    </button>
                    <button
                      onClick={() => setEndConfirmId(null)}
                      className="flex-1 sm:flex-none text-sm font-medium px-3 py-2 rounded-xl bg-espresso-100 hover:bg-espresso-200 text-espresso-600 transition"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEndConfirmId(item.id)}
                    className="w-full sm:w-auto text-sm text-espresso-600 hover:text-espresso-900 border border-espresso-200 px-3 py-2 rounded-xl transition"
                  >
                    Avsluta nu
                  </button>
                ))}
              <input
                type="datetime-local"
                defaultValue={toLocalInput(item.auction_ends_at)}
                onChange={(e) => setSpecificEnd(item, e.target.value)}
                className="w-full sm:w-auto min-w-0 box-border text-sm !py-2 !px-2"
                title="Sätt specifik sluttid"
              />
            </>
          )}
          {confirmId === item.id ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => deleteItem(item.id)}
                disabled={deletingId === item.id}
                className="flex-1 sm:flex-none text-sm font-medium px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition"
              >
                {deletingId === item.id ? 'Raderar...' : 'Ja, radera'}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 sm:flex-none text-sm font-medium px-3 py-2 rounded-xl bg-espresso-100 hover:bg-espresso-200 text-espresso-600 transition"
              >
                Avbryt
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(item.id)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-sm text-espresso-500 hover:text-red-600 border border-espresso-200 hover:border-red-200 px-3 py-2 rounded-xl transition"
            >
              <TrashIcon size={15} />
              Radera
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading)
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
          <div className="h-8 w-48 rounded skeleton" />
          <div className="h-24 rounded-2xl skeleton" />
          <div className="h-24 rounded-2xl skeleton" />
        </div>
      </div>
    )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Header */}
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <p className="eyebrow text-gold-500/80 mb-1">Kontrollrum</p>
          <h1 className="font-display text-3xl text-gold-100">Adminpanel</h1>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <a href="#granska-handlare" className="group rounded-lg -m-1 p-1 transition hover:bg-white/5">
              <div className="font-display text-2xl text-gold-100 group-hover:text-gold-300 transition">{pendingDealers.length}</div>
              <div className="text-xs text-gold-500/60 group-hover:text-gold-400">Väntande handlare</div>
            </a>
            <a href="#granska-foremal" className="group rounded-lg -m-1 p-1 transition hover:bg-white/5">
              <div className="font-display text-2xl text-gold-100 group-hover:text-gold-300 transition">{pendingItems.length}</div>
              <div className="text-xs text-gold-500/60 group-hover:text-gold-400">Väntande föremål</div>
            </a>
            <a href="#auktioner" className="group rounded-lg -m-1 p-1 transition hover:bg-white/5">
              <div className="font-display text-2xl text-gold-100 group-hover:text-gold-300 transition">
                {liveItems.filter((i) => i.status === 'active' && !isEnded(i)).length}
              </div>
              <div className="text-xs text-gold-500/60 group-hover:text-gold-400">Aktiva auktioner</div>
            </a>
            <Link href="/admin/orders" className="group rounded-lg -m-1 p-1 transition hover:bg-white/5">
              <div className="font-display text-2xl text-emerald-400 group-hover:text-emerald-300 transition">{openOrders}</div>
              <div className="text-xs text-gold-500/60 group-hover:text-gold-400">Pågående affärer</div>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {adminError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3">
            <p className="text-sm text-red-600">{adminError}</p>
            <button onClick={() => setAdminError('')} className="text-red-400 hover:text-red-600 text-sm shrink-0">
              Stäng
            </button>
          </div>
        )}
        {adminNotice && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start justify-between gap-3">
            <p className="text-sm text-emerald-700">{adminNotice}</p>
            <button onClick={() => setAdminNotice('')} className="text-emerald-400 hover:text-emerald-600 text-sm shrink-0">
              Stäng
            </button>
          </div>
        )}

        {/* Att göra – allt som kräver åtgärd, med hopplänkar så inget glöms */}
        {(() => {
          const awaitingCount = liveItems.filter((i) => isEnded(i)).length
          const todos = [
            { n: pendingDealers.length, label: 'handlare att godkänna', href: '#granska-handlare' },
            { n: pendingItems.length, label: 'föremål att granska', href: '#granska-foremal' },
            { n: awaitingCount, label: 'auktioner kräver åtgärd', href: '#auktioner' },
            { n: openOrders, label: 'affärer att hantera', href: '/admin/orders', emerald: true, link: true },
          ].filter((t) => t.n > 0)
          const total = todos.reduce((s, t) => s + t.n, 0)
          return (
            <div className="card p-5 mb-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="font-display text-lg text-espresso-900">Att göra</h2>
                <span className={`chip ${total === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {total === 0 ? 'Allt hanterat ✓' : `${total} väntar`}
                </span>
              </div>
              {todos.length === 0 ? (
                <p className="text-sm text-espresso-400">Inga åtgärder väntar just nu. Bra jobbat! 🎉</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {todos.map((t) => {
                    const cls = `inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      t.emerald
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                    }`
                    const inner = (
                      <>
                        <span className="font-display text-base leading-none">{t.n}</span>
                        <span>{t.label}</span>
                        <span aria-hidden>→</span>
                      </>
                    )
                    return t.link ? (
                      <Link key={t.label} href={t.href} className={cls}>{inner}</Link>
                    ) : (
                      <a key={t.label} href={t.href} className={cls}>{inner}</a>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Analytics overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="font-display text-2xl text-espresso-900 tabular-nums">{formatSEK(analytics.gmv)}</p>
            <p className="text-xs text-espresso-400 mt-0.5">Affärsvolym</p>
          </div>
          <div className="card p-4">
            <p className="font-display text-2xl text-emerald-600 tabular-nums">{formatSEK(analytics.commission)}</p>
            <p className="text-xs text-espresso-400 mt-0.5">Provisionsintäkt <span className="text-espresso-300">(betald)</span></p>
            {analytics.pendingCommission > 0 && (
              <p className="text-xs text-gold-700 mt-1 tabular-nums">+{formatSEK(analytics.pendingCommission)} väntar</p>
            )}
          </div>
          <Link href="/admin/orders?tab=done" className="card card-hover p-4 group">
            <p className="font-display text-2xl text-espresso-900 tabular-nums">{analytics.completed}</p>
            <p className="text-xs text-espresso-400 mt-0.5 group-hover:text-gold-700 transition">
              Slutförda affärer <span aria-hidden>→</span>
            </p>
          </Link>
        </div>

        {/* Orders */}
        <Link
          href="/admin/orders"
          className="card card-hover p-5 mb-10 flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-display text-lg text-espresso-900">Affärer</p>
            <p className="text-sm text-espresso-400">Hantera vunna auktioner: status, spårning och meddelanden.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {openOrders > 0 && <span className="chip bg-amber-100 text-amber-700">{openOrders} pågående</span>}
            <span className="text-gold-600 text-sm">Öppna →</span>
          </div>
        </Link>

        {/* Dealers */}
        <section id="granska-handlare" className="mb-12 scroll-mt-24">
          <h2 className="font-display text-xl text-espresso-900 mb-4 flex items-center gap-2">
            Handlare att godkänna
            <span className="chip bg-amber-100 text-amber-700">{pendingDealers.length}</span>
          </h2>
          {pendingDealers.length === 0 ? (
            <div className="card p-8 text-center text-espresso-400 text-sm">Inga väntande handlare.</div>
          ) : (
            <div className="space-y-3">
              {pendingDealers.map((dealer) => (
                <div key={dealer.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gold-sheen flex items-center justify-center text-espresso-900 font-semibold shrink-0">
                      {(dealer.company_name || dealer.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-espresso-900 truncate">
                        {dealer.company_name || dealer.full_name || 'Handlare'}
                      </p>
                      <p className="text-xs text-espresso-400">
                        Guldhandlare · registrerad {new Date(dealer.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <Info label="Företag" value={dealer.company_name} />
                    <Info label="Org.nummer" value={dealer.org_number} />
                    <Info label="Kontaktperson" value={dealer.full_name} />
                    <Info label="Personnummer" value={dealer.personal_number} />
                    <Info label="E-post" value={dealer.email} />
                    <Info label="Telefon" value={dealer.phone} />
                    <Info
                      label="Adress"
                      value={[dealer.address, [dealer.postal_code, dealer.city].filter(Boolean).join(' ')]
                        .filter(Boolean)
                        .join(', ')}
                    />
                  </dl>

                  <div className="flex gap-2 mt-5 flex-wrap">
                    <button
                      onClick={() => approveDealer(dealer.id)}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                    >
                      Godkänn
                    </button>
                    <button
                      onClick={() => rejectDealer(dealer.id)}
                      className="flex-1 sm:flex-initial bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-5 py-2.5 rounded-xl transition"
                    >
                      Neka
                    </button>
                    {dealer.verification_doc_path && (
                      <button
                        onClick={() => viewDoc(dealer.verification_doc_path)}
                        className="flex-1 sm:flex-initial bg-espresso-100 hover:bg-espresso-200 text-espresso-700 text-sm font-medium px-5 py-2.5 rounded-xl transition"
                      >
                        Visa dokument
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Items */}
        <section id="granska-foremal" className="scroll-mt-24">
          <h2 className="font-display text-xl text-espresso-900 mb-4 flex items-center gap-2">
            Föremål att granska
            <span className="chip bg-amber-100 text-amber-700">{pendingItems.length}</span>
          </h2>
          {pendingItems.length === 0 ? (
            <div className="card p-8 text-center text-espresso-400 text-sm">Inga väntande föremål.</div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item) => {
                const est = estimateRange(item.weight_grams || 0, item.karat || '')
                return (
                  <div key={item.id} className="card p-5 flex gap-4 flex-wrap sm:flex-nowrap">
                    {item.image_urls?.[0] && (
                      <button
                        type="button"
                        onClick={() => openLightbox(item.image_urls, 0)}
                        className="shrink-0 rounded-xl overflow-hidden cursor-zoom-in group"
                        title="Visa bilderna stort"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_urls[0]} alt={item.title} className="w-24 h-24 object-contain transition group-hover:opacity-80" />
                        {item.image_urls.length > 1 && (
                          <span className="block text-[10px] text-espresso-400 mt-0.5">{item.image_urls.length} bilder</span>
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-espresso-900">{item.title}</p>
                      <p className="text-sm text-espresso-500">
                        {item.category ? `${item.category} · ` : ''}{item.weight_grams} g · {item.karat}
                        {item.gemstone ? ` · ${item.gemstone}${item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}` : ''}
                      </p>
                      <p className="text-xs text-gold-600 mt-0.5">
                        Metallvärde {formatSEK(est.melt)}
                      </p>
                      {item.min_price && (
                        <p className="text-sm text-espresso-500">
                          Reservationspris: {item.min_price.toLocaleString('sv-SE')} kr
                        </p>
                      )}
                      <p className="text-xs text-espresso-400 mt-1">
                        {sellers[item.owner_id]?.full_name || '—'}
                        {sellers[item.owner_id]?.email ? ` · ${sellers[item.owner_id].email}` : ''}
                      </p>
                      {item.description && (
                        <p className="text-xs text-espresso-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => approveItem(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                      >
                        Godkänn
                      </button>
                      <button
                        onClick={() => rejectItem(item.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition"
                      >
                        Neka
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Active / closed auctions — manage & delete */}
        {(() => {
          const q = search.trim().toLowerCase()
          const match = (i: any) =>
            !q ||
            (i.title || '').toLowerCase().includes(q) ||
            (sellers[i.owner_id]?.full_name || '').toLowerCase().includes(q)
          const filtered = liveItems.filter(match)
          const awaiting = filtered.filter((i) => isEnded(i))
          const liveNow = filtered.filter((i) => i.status === 'active' && !isEnded(i))
          const Group = ({
            title,
            items,
            accent,
            hint,
          }: {
            title: string
            items: any[]
            accent: string
            hint?: string
          }) =>
            items.length === 0 ? null : (
              <div>
                <h3 className="font-display text-lg text-espresso-900 mb-1 flex items-center gap-2">
                  {title}
                  <span className={`chip ${accent}`}>{items.length}</span>
                </h3>
                {hint && <p className="text-xs text-espresso-400 mb-3">{hint}</p>}
                <div className={`space-y-3 ${hint ? '' : 'mt-3'}`}>{items.map(renderAuctionRow)}</div>
              </div>
            )
          return (
            <section id="auktioner" className="mt-12 space-y-8 scroll-mt-24">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-display text-xl text-espresso-900 flex items-center gap-2">
                  Auktioner
                  <span className="chip bg-espresso-100 text-espresso-500">{liveItems.length}</span>
                </h2>
                {liveItems.length > 0 && (
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Sök titel eller säljare…"
                    className="text-sm px-3 py-2 rounded-xl border border-espresso-200 w-full sm:w-64"
                  />
                )}
              </div>
              {liveItems.length === 0 ? (
                <div className="card p-8 text-center text-espresso-400 text-sm">Inga auktioner ännu.</div>
              ) : filtered.length === 0 ? (
                <div className="card p-8 text-center text-espresso-400 text-sm">
                  Inga träffar för “{search}”.
                </div>
              ) : (
                <>
                  <Group
                    title="Kräver åtgärd"
                    items={awaiting}
                    accent="bg-amber-100 text-amber-700"
                    hint="Auktionen är slut. Godkänn det vinnande budet åt säljaren för att skapa affären."
                  />
                  <Group
                    title="Pågår just nu"
                    items={liveNow}
                    accent="bg-emerald-100 text-emerald-700"
                  />
                </>
              )}
            </section>
          )
        })()}
      </div>
      <Footer />

      {/* Bildförstoring (lightbox) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition"
            aria-label="Stäng"
          >
            ×
          </button>
          {lightbox.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + lightbox.length) % lightbox.length) }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition"
                aria-label="Föregående bild"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % lightbox.length) }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition"
                aria-label="Nästa bild"
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox[lightboxIdx]}
            alt=""
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.length > 1 && (
            <div className="mt-4 flex gap-2 flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
              {lightbox.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                    i === lightboxIdx ? 'border-gold-400' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-espresso-400">{label}</dt>
      <dd className="text-espresso-800 break-words">{value || '—'}</dd>
    </div>
  )
}
