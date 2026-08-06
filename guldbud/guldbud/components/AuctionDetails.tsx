'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'
import BidSection from '@/components/BidSection'
import AcceptBid from '@/components/AcceptBid'
import CountdownTimer from '@/components/CountdownTimer'
import CategoryIcon from '@/components/CategoryIcon'
import Footer from '@/components/Footer'
import { GemIcon } from '@/components/Icons'
import { estimateRange, formatSEK } from '@/lib/gold'

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
  const [bids, setBids] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [checked, setChecked] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [flash, setFlash] = useState(false)
  const supabase = createClient()

  const loadBids = async () => {
    const { data: b } = await supabase
      .from('bids')
      .select('id, amount, created_at, profiles(company_name, full_name)')
      .eq('item_id', item.id)
      .order('amount', { ascending: false })
      .limit(20)
    setBids(b || [])
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
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
        async () => {
          await loadBids()
          setFlash(true)
          setTimeout(() => setFlash(false), 1200)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (!checked)
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-2xl skeleton" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded skeleton" />
            <div className="h-4 w-1/3 rounded skeleton" />
            <div className="h-28 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    )

  const topBid = bids[0]
  const topAmount = topBid?.amount || 0
  const isOwner = user?.id === item.owner_id && profile?.role !== 'admin'
  const isAdmin = profile?.role === 'admin'
  const isClosed = item.status === 'closed'
  const images: string[] = item.image_urls?.length ? item.image_urls : []
  const est = estimateRange(item.weight_grams || 0, item.karat || '')

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-espresso-400">
          <Link href="/" className="hover:text-gold-600 transition">
            Auktioner
          </Link>
          <span className="mx-2">/</span>
          <span className="text-espresso-600">{item.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* ===== Gallery ===== */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="aspect-square rounded-2xl overflow-hidden bg-espresso-100 relative shadow-soft">
              {images[activeImg] ? (
                <Image
                  src={images[activeImg]}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
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
                    className={`aspect-square rounded-xl overflow-hidden relative border-2 transition ${
                      activeImg === i ? 'border-gold-400 shadow-gold' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" />
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
            {item.profiles?.full_name && (
              <p className="text-espresso-400 text-sm mt-2">
                Utlagt av {item.profiles.full_name.split(' ')[0]}
              </p>
            )}

            {item.description && (
              <p className="text-espresso-600 mt-5 leading-relaxed">{item.description}</p>
            )}

            {/* Bid panel */}
            <div
              className={`mt-6 rounded-2xl border p-5 transition-colors duration-500 ${
                flash ? 'border-gold-400 bg-gold-50/60' : 'border-espresso-100 bg-white'
              } shadow-soft`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-espresso-400 mb-1">Högsta bud</p>
                  <p className="font-display text-4xl text-gradient-gold tabular-nums">
                    {topAmount ? formatSEK(topAmount) : 'Öppet för bud'}
                  </p>
                  {topBid ? (
                    <p className="text-xs text-espresso-400 mt-1">
                      {topBid.profiles?.company_name || topBid.profiles?.full_name || 'Handlare'} ·{' '}
                      {bids.length} {bids.length === 1 ? 'bud' : 'bud'}
                    </p>
                  ) : (
                    <p className="text-xs text-espresso-400 mt-1">Var först att buda</p>
                  )}
                </div>
                {!isClosed && item.auction_ends_at && (
                  <div className="text-right">
                    <p className="eyebrow text-espresso-400 mb-2">Avslutas om</p>
                    <CountdownTimer endsAt={item.auction_ends_at} variant="blocks" />
                  </div>
                )}
              </div>

              {/* indicative value */}
              <div className="mt-4 pt-4 border-t border-espresso-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-espresso-500">
                <span className="flex items-center gap-2">
                  <SparkIcon />
                  Metallvärde vid dagens kurs:{' '}
                  <span className="font-medium text-espresso-700">{formatSEK(est.melt)}</span>
                </span>
                <span className="text-espresso-400">
                  Uppskattad utbetalning {formatSEK(est.low)}–{formatSEK(est.high)}
                </span>
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

            {/* Accept bid (owner) */}
            {isOwner && !isClosed && topBid && (
              <AcceptBid
                itemId={item.id}
                bidId={topBid.id}
                amount={topAmount}
                dealerName={topBid.profiles?.company_name || topBid.profiles?.full_name || 'Handlare'}
                isOwner={isOwner}
              />
            )}

            {/* Owner waiting for bids */}
            {isOwner && !isClosed && !topBid && (
              <div className="mt-4 rounded-2xl bg-white border border-espresso-100 p-5 text-center shadow-soft">
                <div className="text-2xl mb-2">⏳</div>
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
                  Skicka föremålet till oss så betalar vi ut via Swish efter verifiering.
                </p>
                <ShippingCard />
              </div>
            )}

            {/* Dealer bid form */}
            {!isOwner && !isAdmin && !isClosed && profile?.role === 'dealer' && (
              <div className="mt-4">
                <BidSection itemId={item.id} currentTop={topAmount} onPlaced={loadBids} />
              </div>
            )}

            {/* Not logged in */}
            {!user && (
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
                          {(bid.profiles?.company_name || bid.profiles?.full_name || 'H').charAt(0)}
                        </div>
                        <div>
                          <p className={`${i === 0 ? 'font-medium text-espresso-900' : 'text-espresso-600'}`}>
                            {(bid.profiles?.company_name || bid.profiles?.full_name || 'Handlare').slice(0, 24)}
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
      <Footer />
    </>
  )
}

function ShippingCard() {
  return (
    <div className="bg-espresso-900 rounded-xl p-5 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
      <div className="relative">
        <p className="eyebrow text-gold-500/70 mb-1">Skicka till</p>
        <p className="text-gold-200 font-medium">GuldBud AB</p>
        <p className="text-gold-500/80 text-sm">Storgatan 1</p>
        <p className="text-gold-500/80 text-sm">111 22 Stockholm</p>
        <p className="text-gold-500/60 text-xs mt-2">Vid frågor: info@guldbud.se</p>
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
