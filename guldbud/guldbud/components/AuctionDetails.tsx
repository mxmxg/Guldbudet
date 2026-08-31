'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'
import Confetti from '@/components/Confetti'
import BidSection from '@/components/BidSection'
import AcceptBid from '@/components/AcceptBid'
import DeclineBid from '@/components/DeclineBid'
import WatchButton from '@/components/WatchButton'
import CountdownTimer from '@/components/CountdownTimer'
import CategoryIcon from '@/components/CategoryIcon'
import Footer from '@/components/Footer'
import { GemIcon, HourglassIcon, CheckIcon } from '@/components/Icons'
import { estimateRange, formatSEK, isPlatinum } from '@/lib/gold'
import { useGoldPrice } from '@/lib/useGoldPrice'

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'nyss'
  if (m < 60) return `${m} min sedan`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h sedan`
  return `${Math.floor(h / 24)} d sedan`
}

export default function AuctionDetails({ item }: { item: any }) {
  // 24K-priset per gram, live. Faller tillbaka på riktvärdet i lib/gold
  // tills /api/gold-price svarat.
  const { price: spot, live: spotLive } = useGoldPrice()
  const [bids, setBids] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [checked, setChecked] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [flash, setFlash] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [extended, setExtended] = useState(false)
  const [newBidToast, setNewBidToast] = useState<number | null>(null)
  const [confetti, setConfetti] = useState(0)
  const [watchers, setWatchers] = useState(0)
  const [justAccepted, setJustAccepted] = useState(false)
  // Kept in state so anti-sniping extensions (server-side) reflect live.
  const [endsAt, setEndsAt] = useState<string | null>(item.auction_ends_at)
  const endsAtRef = useRef<string | null>(item.auction_ends_at)
  const bidsCountRef = useRef(0)
  const userRef = useRef<any>(null)
  const supabase = createClient()

  const loadBids = async () => {
    const { data: b } = await supabase
      .from('bids')
      // No profiles() embed: dealers are shown anonymously (Kund NNNNNN) and
      // their profiles are not publicly readable. Tie-break by earliest bid.
      .select('id, amount, created_at, dealer_id')
      .eq('item_id', item.id)
      .order('amount', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100)
    setBids(b || [])
    bidsCountRef.current = (b || []).length
    // Refresh the end time too, so a late-bid extension shows immediately.
    const { data: it } = await supabase.from('items').select('auction_ends_at').eq('id', item.id).single()
    if (it) {
      // Anti-sniping drama: if the end time jumped forward, celebrate it.
      if (
        endsAtRef.current &&
        it.auction_ends_at &&
        new Date(it.auction_ends_at).getTime() > new Date(endsAtRef.current).getTime() + 1000
      ) {
        setExtended(true)
        setTimeout(() => setExtended(false), 6000)
      }
      endsAtRef.current = it.auction_ends_at
      setEndsAt(it.auction_ends_at)
    }
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        setUser(user)
        userRef.current = user
        const { data: p } = await supabase
          .from('profiles')
          .select('role, approved')
          .eq('id', user.id)
          .single()
        setProfile(p)
      }
      await loadBids()
      setChecked(true)
    }
    load()

    // Realtime — refresh bids when a new one lands on this item.
    const channel = supabase
      .channel(`bids-${item.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${item.id}` },
        async (payload: any) => {
          const hadBids = bidsCountRef.current
          const nb = payload.new
          // Använd budet direkt ur eventet i stället för att läsa om ALLA bud.
          // Tidigare gjorde varje tittare två queries per bud, vilket i slutspurten
          // (många tittare × många bud) blev en query-storm mot en enda auktion.
          if (nb?.id) {
            setBids((prev) => {
              if (prev.some((x) => x.id === nb.id)) return prev
              const next = [...prev, nb].sort(
                (a, z) =>
                  z.amount - a.amount ||
                  new Date(a.created_at).getTime() - new Date(z.created_at).getTime()
              )
              bidsCountRef.current = next.length
              return next
            })
          }
          setFlash(true)
          setTimeout(() => setFlash(false), 1200)
          const amt = nb?.amount
          if (amt) {
            setNewBidToast(amt)
            setTimeout(() => setNewBidToast(null), 4500)
          }
          // Owner celebrates the very first bid on their item.
          if (hadBids === 0 && userRef.current?.id === item.owner_id) {
            setConfetti((c) => c + 1)
          }
          // Anti-sniping: bara nära slutet kan sluttiden hoppa framåt. Läs om den
          // då (billig enkolumnsfråga) så förlängningen syns live, i stället för att
          // läsa om sluttiden vid varje bud under hela auktionen.
          const ms = endsAtRef.current ? new Date(endsAtRef.current).getTime() - Date.now() : Infinity
          if (ms < 3 * 60 * 1000) {
            const { data: it } = await supabase
              .from('items')
              .select('auction_ends_at')
              .eq('id', item.id)
              .single()
            if (it?.auction_ends_at) {
              if (
                endsAtRef.current &&
                new Date(it.auction_ends_at).getTime() > new Date(endsAtRef.current).getTime() + 1000
              ) {
                setExtended(true)
                setTimeout(() => setExtended(false), 6000)
              }
              endsAtRef.current = it.auction_ends_at
              setEndsAt(it.auction_ends_at)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Realtidsnärvaro: räkna hur många som tittar på auktionen just nu.
  useEffect(() => {
    if (item.status !== 'active') return
    const key = Math.random().toString(36).slice(2)
    const presence = supabase.channel(`presence-item-${item.id}`, {
      config: { presence: { key } },
    })
    presence
      .on('presence', { event: 'sync' }, () => {
        setWatchers(Object.keys(presence.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await presence.track({ at: Date.now() })
      })
    return () => {
      supabase.removeChannel(presence)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.status])

  // Innehållet (titel, beskrivning, bilder, specar, pris) renderas DIREKT från
  // item-propen, även server-side (SSR), så auktionssidan är indexerbar och
  // besökaren ser innehållet med en gång. Tidigare låg allt bakom en skelett-
  // loader tills klientens auth/bud-koll resolvat, vilket gjorde SSR-HTML:en
  // innehållslös. De inloggnings- och tidsberoende delarna nedan aktiveras först
  // när klienten kollat (`checked`), så SSR och hydrering matchar.
  const topBid = bids[0]
  const topAmount = topBid?.amount || 0
  const myTopBid = user ? bids.filter((b: any) => b.dealer_id === user.id).reduce((m: number, b: any) => Math.max(m, b.amount), 0) : 0
  const hasBid = myTopBid > 0
  const isLeading = hasBid && !!topBid && topBid.dealer_id === user?.id
  const isOwner = user?.id === item.owner_id && profile?.role !== 'admin'
  const isAdmin = profile?.role === 'admin'
  const isClosed = item.status === 'closed'
  // Tidsberoende hålls false tills klienten kollat (checked). Annars skiljer sig
  // server- och första klientrenderingen åt (Date.now) och hydreringen krånglar.
  const ended = checked && !!endsAt && new Date(endsAt).getTime() < Date.now()
  const endingSoon = checked && !!endsAt && !ended && !isClosed && new Date(endsAt).getTime() - Date.now() < 60 * 60 * 1000
  // Status kommer som booleaner från servern; själva nivån (min_price) finns
  // bara med när ägaren tittar på sitt eget föremål.
  const hasReserve = !!item.has_reserve
  const reserveMet = item.reserve_met ?? true
  const images: string[] = item.image_urls?.length ? item.image_urls : []
  // Dagens kurs, inte konstanten i lib/gold. Rutan under heter
  // "Metallvärde vid dagens kurs", och då ska det vara dagens kurs.
  const est = estimateRange(item.weight_grams || 0, item.karat || '', spot)

  // Anonymise bidders publicly with a stable six-digit customer number derived
  // from their id (e.g. "Kund 015648"). Because it is hashed (not sequential)
  // and carries no "dealer" wording, it hides both the identity and how many
  // dealers are connected. The real name is shown to the owner only when
  // accepting a bid (in AcceptBid).
  const dealerCode = (id: string | null | undefined) => {
    if (!id) return '000000'
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
    return String(h % 1000000).padStart(6, '0')
  }
  const dealerLabel = (b: any) => `Kund ${dealerCode(b.dealer_id)}`

  return (
    <>
      <Confetti fire={confetti} />
      {/* Live drama: new-bid + anti-sniping toasts */}
      <div className="fixed top-20 inset-x-0 z-[95] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {newBidToast != null && (
          <div className="animate-scale-in rounded-full bg-espresso-900 text-gold-100 text-sm font-medium px-4 py-2 shadow-lift border border-gold-500/30">
            🔨 Nytt bud: {formatSEK(newBidToast)}
          </div>
        )}
        {extended && (
          <div className="animate-scale-in rounded-full bg-red-600 text-white text-sm font-semibold px-4 py-2 shadow-lift">
            ⏱ Auktionen förlängdes – någon bjöd i sista sekund!
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-espresso-400">
          <Link href="/auctions" className="hover:text-gold-600 transition">
            Auktioner
          </Link>
          <span className="mx-2">/</span>
          <span className="text-espresso-600">{item.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* ===== Gallery ===== */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shadow-soft">
              {images[activeImg] ? (
                <Image
                  src={images[activeImg]}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain cursor-zoom-in"
                  priority
                  onClick={() => setZoom(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <CategoryIcon category={item.category} size={90} className="text-gold-500/30 animate-float" strokeWidth={1} />
                </div>
              )}
              {!isClosed && (
                <span className="absolute top-4 left-4 chip bg-espresso-900/85 backdrop-blur text-gold-200 border border-gold-500/25">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-pulse-ring" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                  Live auktion
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.slice(0, 5).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-xl overflow-hidden relative border-2 bg-gradient-to-br from-espresso-900 to-espresso-800 transition ${
                      activeImg === i ? 'border-gold-400 shadow-gold' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={url} alt="" fill sizes="(max-width: 768px) 20vw, 110px" className="object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== Details ===== */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {item.category && (
                <span className="chip bg-espresso-900 text-gold-200">
                  <CategoryIcon category={item.category} size={13} strokeWidth={1.8} />
                  {item.category}
                </span>
              )}
              <span className="chip bg-gold-50 text-gold-700">{item.karat}</span>
              <span className="chip bg-espresso-100 text-espresso-600">{item.weight_grams} g</span>
              {item.gemstone && (
                <span className="chip bg-gold-50 text-gold-700">
                  <GemIcon size={12} />
                  {item.gemstone}
                  {item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}
                </span>
              )}
              {isClosed && <span className="chip bg-espresso-100 text-espresso-500">Avslutad</span>}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-espresso-900 leading-tight">
              {item.title}
            </h1>

            {item.description && (
              <p className="text-espresso-600 mt-5 leading-relaxed">{item.description}</p>
            )}

            {/* Sold banner (closed auctions) – social proof + SEO. Bara när ett
                bud faktiskt accepterats; ett avböjt föremål är stängt utan bud. */}
            {isClosed && item.accepted_bid_id && topAmount ? (
              <div className="mt-5 rounded-2xl bg-espresso-900 p-5 text-center shadow-soft">
                <p className="eyebrow text-gold-500/80 mb-1">Såld</p>
                <p className="font-display text-3xl text-gold-100 tabular-nums">{formatSEK(topAmount)}</p>
                <p className="text-gold-200/60 text-xs mt-1">
                  Slutpris efter budgivning
                  {item.accepted_at ? ` · ${new Date(item.accepted_at).toLocaleDateString('sv-SE')}` : ''}
                </p>
              </div>
            ) : null}

            {/* Bid panel */}
            <div
              className={`mt-6 rounded-2xl border p-5 transition-colors duration-500 ${
                flash ? 'border-gold-400 bg-gold-50/60' : 'border-espresso-100 bg-white'
              } shadow-soft`}
            >
              {!isClosed && !ended && watchers >= 2 && (
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-pulse-ring" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {watchers} tittar på auktionen just nu
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="eyebrow text-espresso-400 mb-1">{isClosed ? 'Slutpris' : 'Högsta bud'}</p>
                  <p className="font-display text-3xl text-gradient-gold tabular-nums">
                    {topAmount ? formatSEK(topAmount) : 'Öppet för bud'}
                  </p>
                  {topBid ? (
                    <p className="text-xs text-espresso-400 mt-1">
                      {dealerLabel(topBid)} · {bids.length} bud
                    </p>
                  ) : (
                    <p className="text-xs text-espresso-400 mt-1">Var först att buda</p>
                  )}
                </div>
                {endsAt && (
                  <div className="shrink-0 sm:text-right">
                    <p className={`eyebrow mb-2 ${endingSoon ? 'text-amber-600' : 'text-espresso-400'}`}>
                      {ended || isClosed ? 'Status' : endingSoon ? '⏳ Slutar snart' : 'Avslutas om'}
                    </p>
                    <CountdownTimer endsAt={endsAt} variant="blocks" />
                  </div>
                )}
              </div>

              {/* indicative value + reserve */}
              <div className="mt-4 pt-4 border-t border-espresso-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-espresso-500">
                {isPlatinum(item.karat) ? (
                  <span className="flex items-center gap-2">
                    <SparkIcon />
                    Platina, värderas på sin egen marknad vid mottagning.
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <SparkIcon />
                      {spotLive ? 'Metallvärde vid dagens kurs' : 'Metallvärde, riktvärde'}:{' '}
                      <span className="font-medium text-espresso-700">{formatSEK(est.melt)}</span>
                    </span>
                    <span className="text-espresso-400">
                      Uppskattad utbetalning {formatSEK(est.low)}–{formatSEK(est.high)}
                    </span>
                  </>
                )}
                {hasReserve ? (
                  <span
                    className={`chip ${reserveMet ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {reserveMet ? 'Reservationspris uppnått' : 'Reservationspris ej uppnått'}
                    {isOwner && item.min_price ? ` (${formatSEK(item.min_price)})` : ''}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Admin note */}
            {isAdmin && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-amber-700 text-sm font-medium">
                  Adminvy. Du kan inte buda eller acceptera.
                </p>
              </div>
            )}

            {/* Owner: auction ended */}
            {isOwner && ended && !isClosed && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-amber-800 text-sm font-medium">Auktionen är avslutad</p>
                <p className="text-amber-700 text-xs mt-1">
                  {topBid
                    ? 'Välj det bud du vill acceptera nedan.'
                    : 'Inga bud kom in den här gången.'}
                </p>
              </div>
            )}

            {/* Accept bid (owner) — works while active or after end, until accepted */}
            {isOwner && !isClosed && topBid && (
              <>
                <AcceptBid
                  itemId={item.id}
                  bidId={topBid.id}
                  amount={topAmount}
                  dealerName={dealerLabel(topBid)}
                  isOwner={isOwner}
                  onAccepted={() => setJustAccepted(true)}
                />
                {/* Tacka nej går bara att göra när auktionen är slut, och inte
                    efter att budet just godkänts (då är valet redan gjort). */}
                {ended && !justAccepted && <DeclineBid item={item} isOwner={isOwner} />}
              </>
            )}

            {/* Owner waiting for bids (live, not ended) */}
            {isOwner && !isClosed && !topBid && !ended && (
              <div className="mt-4 rounded-2xl bg-white border border-espresso-100 p-5 text-center shadow-soft">
                <div className="flex justify-center text-gold-500 mb-2"><HourglassIcon size={26} /></div>
                <p className="text-espresso-600 text-sm">
                  Auktionen är live. Så fort en handlare budar dyker det upp här, och du får en
                  notifiering direkt.
                </p>
              </div>
            )}

            {/* Closed — shipping instructions */}
            {isOwner && isClosed && item.accepted_bid_id && (
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                <p className="font-medium text-emerald-800 mb-1">Bud accepterat ✓</p>
                <p className="text-sm text-espresso-500 mb-4">
                  Skicka föremålet till oss så betalar vi ut via Swish eller bankkonto efter verifiering.
                </p>
                <ShippingCard />
              </div>
            )}

            {/* Closed utan accepterat bud = säljaren tackade nej */}
            {isOwner && isClosed && !item.accepted_bid_id && (
              <div className="mt-4 rounded-2xl bg-espresso-50 border border-espresso-200 p-5">
                <p className="font-medium text-espresso-800 mb-1">Du tackade nej till budet</p>
                <p className="text-sm text-espresso-500">
                  Föremålet såldes inte. Du kan lägga ut det igen från Mina föremål när du vill.
                </p>
              </div>
            )}

            {/* Dealer bid form (blocked after end) */}
            {!isOwner && !isAdmin && !isClosed && profile?.role === 'dealer' &&
              (ended ? (
                topBid && topBid.dealer_id === user?.id ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <p className="text-emerald-800 text-sm font-medium">Du hade det högsta budet</p>
                    <p className="text-emerald-700 text-xs mt-1">
                      Auktionen är avslutad. Inväntar säljarens bekräftelse – du får en notis så snart budet accepteras.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-espresso-50 border border-espresso-100 p-4 text-center">
                    <p className="text-espresso-600 text-sm font-medium">Auktionen är avslutad</p>
                    <p className="text-espresso-400 text-xs mt-1">Det går inte längre att lägga bud.</p>
                  </div>
                )
              ) : (
                <div className="mt-4 space-y-3">
                  {isLeading ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <CheckIcon size={13} strokeWidth={3} />
                      </span>
                      <p className="text-sm text-emerald-800">
                        <span className="font-semibold">Du leder just nu</span> med {formatSEK(myTopBid)}.
                      </p>
                    </div>
                  ) : hasBid ? (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">Du är överbjuden.</span> Ditt bud: {formatSEK(myTopBid)}. Höj för att ta ledningen igen.
                      </p>
                    </div>
                  ) : null}
                  <BidSection
                    itemId={item.id}
                    currentTop={topAmount}
                    endsAt={endsAt}
                    onPlaced={loadBids}
                  />
                  <WatchButton itemId={item.id} />
                </div>
              ))}

            {/* Not logged in — only invite bidding on auctions that are still open.
                Gated on `checked` so a logged-in dealer doesn't flash this CTA
                before auth resolves, and so it stays out of the SSR markup. */}
            {checked && !user && !isClosed && !ended && (
              <div className="mt-4 rounded-2xl bg-espresso-900 p-6 text-center relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
                <div className="relative">
                  <p className="text-gold-100 font-medium mb-1">Vill du buda på det här föremålet?</p>
                  <p className="text-espresso-100/60 text-sm mb-4">
                    Endast auktoriserade guldhandlare kan lägga bud.
                  </p>
                  <Link href="/auth/login" className="btn-gold">
                    Logga in som handlare
                  </Link>
                </div>
              </div>
            )}

            {/* Bid history */}
            {bids.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-espresso-700 mb-3 flex items-center gap-2">
                  Budhistorik
                  <span className="chip bg-espresso-100 text-espresso-500">{bids.length}</span>
                </h3>
                <div className="rounded-2xl border border-espresso-100 overflow-hidden bg-white">
                  {bids.map((bid: any, i: number) => (
                    <div
                      key={bid.id || i}
                      className={`flex items-center justify-between px-4 py-3 text-sm ${
                        i > 0 ? 'border-t border-espresso-50' : ''
                      } ${i === 0 ? 'bg-gold-50/50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            i === 0 ? 'bg-gold-sheen text-espresso-900' : 'bg-espresso-100 text-espresso-500'
                          }`}
                        >
                          {dealerCode(bid.dealer_id).slice(-2)}
                        </div>
                        <div>
                          <p className={`${i === 0 ? 'font-medium text-espresso-900' : 'text-espresso-600'}`}>
                            {dealerLabel(bid)}
                            {i === 0 && <span className="ml-2 chip bg-emerald-100 text-emerald-700">Ledande</span>}
                          </p>
                          <p className="text-[11px] text-espresso-300">{relTime(bid.created_at)}</p>
                        </div>
                      </div>
                      <span className={`tabular-nums ${i === 0 ? 'font-semibold text-gold-700' : 'text-espresso-600'}`}>
                        {bid.amount.toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {zoom && images[activeImg] && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <button
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Stäng"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[85vh]">
            <Image src={images[activeImg]} alt={item.title} fill className="object-contain" sizes="100vw" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2" onClick={(e) => e.stopPropagation()}>
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${activeImg === i ? 'bg-gold-400' : 'bg-white/40 hover:bg-white/70'}`}
                  aria-label={`Bild ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <Footer />
    </>
  )
}

function ShippingCard() {
  return (
    <div className="bg-espresso-900 rounded-xl p-5 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
      <div className="relative">
        <p className="eyebrow text-gold-500/70 mb-1">Frakt</p>
        <p className="text-gold-200 font-medium">Kostnadsfritt rekommenderat brev</p>
        <p className="text-gold-500/80 text-sm">Förbetalt porto och adress, försäkrat upp till 100 000 kr.</p>
        <p className="text-gold-500/80 text-sm">Skickas när du godkänt ditt slutpris.</p>
        <p className="text-gold-500/60 text-xs mt-2">Vid frågor: info@guldbud.com</p>
      </div>
    </div>
  )
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M12 3l1.6 5L18 9.5 13.6 11 12 16l-1.6-5L6 9.5 10.4 8 12 3z" fill="#d9ab3c" />
    </svg>
  )
}
