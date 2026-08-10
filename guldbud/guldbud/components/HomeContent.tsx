'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import Image from 'next/image'
import AuctionCard from '@/components/AuctionCard'
import ValueEstimator from '@/components/ValueEstimator'
import Reveal from '@/components/Reveal'
import CountUp from '@/components/CountUp'
import Footer from '@/components/Footer'
import RecentlySold, { SoldRow } from '@/components/RecentlySold'
import CountdownTimer from '@/components/CountdownTimer'
import CategoryIcon from '@/components/CategoryIcon'
import { formatSEK } from '@/lib/gold'
import {
  CameraIcon,
  ScaleIcon,
  CoinsIcon,
  ShieldIcon,
  BoltIcon,
  HeartIcon,
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  SparkleIcon,
  LockIcon,
  TruckIcon,
  WalletIcon,
  GemIcon,
  FlameIcon,
} from '@/components/Icons'
import type { EnrichedItem } from '@/app/page'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Väntar på granskning', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Godkänd', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Auktion pågår', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Avslutad', color: 'bg-espresso-100 text-espresso-500' },
  rejected: { label: 'Avvisad', color: 'bg-red-100 text-red-600' },
}

function capitalize(name: string) {
  if (!name) return ''
  return name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export default function HomeContent({ items, sold = [] }: { items: EnrichedItem[]; sold?: SoldRow[] }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myItems, setMyItems] = useState<any[]>([])
  const [checked, setChecked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()
        setProfile(p)
        if (p?.role === 'customer') {
          const { data: mi } = await supabase
            .from('items')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)
          setMyItems(mi || [])
        }
      }
      setChecked(true)
    }
    load()
  }, [])

  if (!checked)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span
          className="shimmer-text"
          style={{ fontFamily: "'Great Vibes', cursive", fontSize: '46px' }}
        >
          GuldBud
        </span>
      </div>
    )

  // ============ GUEST — full marketing landing ============
  if (!user) {
    return <GuestLanding items={items} loggedIn={false} sold={sold} />
  }

  // ============ CUSTOMER ============
  if (profile?.role === 'customer') {
    return (
      <>
        <DashHeader eyebrow="Välkommen tillbaka" title={capitalize(profile.full_name)}>
          <Link href="/customer/submit" className="btn-gold">
            + Lägg ut föremål
          </Link>
        </DashHeader>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-espresso-900">Mina föremål</h2>
              <Link href="/customer/my-items" className="text-sm text-gold-600 hover:text-gold-700 transition">
                Se alla →
              </Link>
            </div>
            {myItems.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gold-50 text-gold-500 flex items-center justify-center mx-auto mb-4">
                  <GemIcon size={26} strokeWidth={1.3} />
                </div>
                <p className="text-espresso-500 mb-4">Du har inte lagt ut några föremål ännu.</p>
                <Link href="/customer/submit" className="btn-gold">
                  Lägg ut ditt första föremål
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {myItems.map((item) => {
                  const s = STATUS_LABEL[item.status] || {
                    label: item.status,
                    color: 'bg-espresso-100 text-espresso-500',
                  }
                  return (
                    <div key={item.id} className="card p-4 flex gap-4 items-center card-hover">
                      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden relative bg-espresso-100">
                        {item.image_urls?.[0] && (
                          <Image src={item.image_urls[0]} alt={item.title} fill className="object-contain" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-espresso-900">{capitalize(item.title)}</h3>
                          <span className={`chip ${s.color}`}>{s.label}</span>
                        </div>
                        <p className="text-xs text-espresso-400">
                          {item.weight_grams} g · {item.karat}
                        </p>
                      </div>
                      {item.status === 'active' && (
                        <Link href={`/auctions/${item.id}`} className="text-sm text-gold-600 hover:text-gold-700 shrink-0">
                          Följ →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <AuctionsSection items={items} title="Pågående auktioner" />
        </div>
        <Footer />
      </>
    )
  }

  // ============ DEALER ============
  if (profile?.role === 'dealer') {
    return (
      <>
        <DashHeader
          eyebrow="Handlarkonto"
          title={capitalize(profile.full_name)}
          subtitle={`${items.length} aktiva auktioner att buda på`}
        >
          <Link href="/dealer/dashboard" className="btn-gold">
            Öppna budpanel
          </Link>
        </DashHeader>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <AuctionsSection items={items} title="Aktiva auktioner" />
        </div>
        <Footer />
      </>
    )
  }

  // ============ ADMIN ============
  return (
    <>
      <DashHeader eyebrow="Administratör" title={capitalize(profile?.full_name || '')}>
        <Link href="/admin" className="btn-gold">
          Öppna adminpanel
        </Link>
      </DashHeader>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <AuctionsSection items={items} title="Pågående auktioner" />
      </div>
      <Footer />
    </>
  )
}

/* ============================================================
   GUEST LANDING
   ============================================================ */
function GuestLanding({ items, loggedIn, sold = [] }: { items: EnrichedItem[]; loggedIn: boolean; sold?: SoldRow[] }) {
  const totalBids = items.reduce((s, i) => s + (i.bid_count || 0), 0)
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-espresso-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -right-24 w-[420px] h-[420px] rounded-full bg-gold-400/8 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 noise opacity-[0.04]" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-espresso-800/60 px-3 py-1.5 text-xs text-gold-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-70 animate-pulse-ring" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-400" />
                </span>
                {items.length > 0
                  ? `${items.length} auktioner pågår just nu`
                  : 'Auktoriserade handlare redo att buda'}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight">
                Sälj ditt guld till
                <br />
                <span className="text-gradient-gold">marknadens bästa pris</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 text-lg text-espresso-100/75 max-w-lg leading-relaxed">
                Lägg ut ditt guldföremål och låt Sveriges auktoriserade guldhandlare buda mot
                varandra, i realtid. Ingen prutning, inga mellanhänder. Bara det bästa budet.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/auth/login?mode=register" className="btn-gold text-base !px-7 !py-3.5">
                  Lägg ut ett föremål
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <a href="#estimator" className="btn-ghost-gold text-gold-200 text-base !px-7 !py-3.5">
                  Vad är mitt guld värt?
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Stat value="0 kr" label="Avgift att lägga ut" />
                <div className="w-px h-10 bg-espresso-700" />
                <Stat value={<><CountUp end={100} />%</>} label="Verifierade handlare" />
                <div className="w-px h-10 bg-espresso-700" />
                <Stat value={<><CountUp end={24} />h</>} label="Utbetalning" />
              </div>
            </Reveal>
          </div>

          {/* Right — live featured auction (real data, with fallback) */}
          <Reveal delay={200} className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-[2rem] bg-gold-500/10 blur-2xl" />
              <div className="relative">
                <FeaturedAuction items={items} />
              </div>
            </div>
          </Reveal>
        </div>

        {/* trust strip */}
        <div className="relative border-t border-espresso-800">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-espresso-100/50">
            <Trust><LockIcon size={14} className="text-gold-400/80" /> BankID-verifierade handlare</Trust>
            <Trust><TruckIcon size={14} className="text-gold-400/80" /> Försäkrad frakt</Trust>
            <Trust><WalletIcon size={14} className="text-gold-400/80" /> Utbetalning via Swish eller bank</Trust>
            <Trust><CheckIcon size={14} className="text-gold-400/80" /> Kostnadsfritt att lägga ut</Trust>
          </div>
        </div>
      </section>

      {/* ESTIMATOR + LIVE PRICE */}
      <section id="estimator" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-28">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <span className="eyebrow text-gold-600">Gratis värdering</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900 leading-tight">
              Se värdet på sekunder, <span className="text-gradient-gold">innan</span> du säljer
            </h2>
            <p className="mt-4 text-espresso-500 leading-relaxed max-w-md">
              Ange vikt och karat så räknar vi ut ett indikativt auktionsvärde utifrån dagens
              guldpris. Sedan låter du handlarna tävla om att ge dig mer.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Inga dolda avgifter, det är gratis att lägga ut',
                'Du bestämmer själv om du accepterar ett bud',
                'Sätt ett reservationspris om du vill',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-espresso-600">
                  <CheckMark />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <ValueEstimator loggedIn={loggedIn} />
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-espresso-900 border-y border-espresso-800">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <Reveal className="text-center max-w-xl mx-auto">
            <span className="eyebrow text-gold-500/80">Så enkelt är det</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-gold-100">
              Från byrålåda till betalning
            </h2>
            <p className="mt-3 text-gold-200/60">Tre steg. Under fem minuter av ditt arbete.</p>
          </Reveal>

          <div className="mt-16 relative grid md:grid-cols-3 gap-10 md:gap-8">
            {/* Kopplande linje som binder ihop stegen till en resa (desktop) */}
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-gold-500/35 to-transparent" />
            {[
              {
                Icon: CameraIcon,
                title: 'Fotografera och lägg ut',
                desc: 'Ladda upp bilder, fyll i vikt och karat. Vi granskar och öppnar auktionen, oftast inom ett par timmar.',
              },
              {
                Icon: ScaleIcon,
                title: 'Handlare budar mot varandra',
                desc: 'Auktoriserade guldhandlare ser ditt föremål och tävlar om att ge dig det högsta budet. Du följer allt i realtid.',
              },
              {
                Icon: CoinsIcon,
                title: 'Acceptera och få betalt',
                desc: 'Välj det bud du är nöjd med, skicka föremålet försäkrat till oss och få pengarna via Swish eller bankkonto samma dag som vi verifierat.',
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <div className="relative text-center group">
                  <div className="relative z-10 mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-gold transition-transform duration-300 group-hover:-translate-y-1">
                    <s.Icon size={26} className="text-espresso-900" strokeWidth={1.8} />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-espresso-900 border border-gold-500/40 text-gold-300 text-xs font-semibold flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-gold-100 mb-2">{s.title}</h3>
                  <p className="text-sm text-gold-200/60 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center mt-14">
            <Link href="/how-it-works" className="btn-ghost-gold text-gold-200">
              Läs mer om processen →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* LIVE AUCTIONS */}
      <section id="auctions" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-28">
        <Reveal className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <span className="eyebrow text-gold-600">Just nu på GuldBud</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900">Pågående auktioner</h2>
          </div>
          {items.length > 0 && (
            <p className="text-sm text-espresso-500">
              <span className="font-semibold text-espresso-800">{totalBids}</span> bud lagda ·{' '}
              <span className="font-semibold text-espresso-800">{items.length}</span> live
            </p>
          )}
        </Reveal>

        {items.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.slice(0, 9).map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 90}>
                  <AuctionCard item={item} />
                </Reveal>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/auctions" className="btn-ghost-gold !px-8 !py-3.5">
                Visa alla auktioner
              </Link>
            </div>
          </>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-50 text-gold-500 flex items-center justify-center mx-auto mb-4 animate-float">
              <GemIcon size={30} strokeWidth={1.2} />
            </div>
            <p className="font-display text-xl text-espresso-800 mb-2">Inga aktiva auktioner just nu</p>
            <p className="text-espresso-500 text-sm mb-6">Bli den första att lägga ut ett föremål idag.</p>
            <Link href="/auth/login?mode=register" className="btn-gold">
              Lägg ut ett föremål
            </Link>
          </div>
        )}
      </section>

      {/* HONEST / NO BAIT PRICING */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow text-gold-600">Schysst mot dig</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900">
            Inga lockpriser. Bara riktiga bud.
          </h2>
          <p className="mt-4 text-espresso-500 leading-relaxed">
            Många guldköpare lockar med ett högt gram-pris på förstasidan – men betalar bara ut det om du
            skickar in stora mängder. Hos GuldBud finns ingen dold värdetrappa. Priset sätts av att flera
            verifierade handlare budar mot varandra, i realtid, framför dina ögon.
          </p>
          <Link href="/resultat" className="inline-block mt-4 text-sm text-gold-700 hover:text-gold-800 font-medium">
            Se vad andra fått betalt →
          </Link>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          <Reveal>
            <div className="card p-7 h-full border-espresso-100">
              <p className="text-sm font-semibold text-espresso-500 mb-5 uppercase tracking-wide">
                Vanlig guldköpare
              </p>
              <ul className="flex flex-col gap-4">
                {[
                  'Lockpris på förstasidan som bara gäller vid stora mängder',
                  'En enda värdering du inte kan påverka',
                  'Du skickar in innan du vet vad du får',
                  'Villkoren göms i det finstilta',
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-espresso-500">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-espresso-100 text-espresso-400 flex items-center justify-center">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="card p-7 h-full ring-2 ring-gold-300 bg-gradient-to-br from-white to-gold-50/40">
              <p className="text-sm font-semibold text-gold-700 mb-5 uppercase tracking-wide">GuldBud</p>
              <ul className="flex flex-col gap-4">
                {[
                  'Flera verifierade handlare budar mot varandra',
                  'Du ser alla bud i realtid, innan du bestämmer dig',
                  'Konkurrensen pressar priset uppåt, inte nedåt',
                  'Metallvärdet visas ärligt, oavsett vikt',
                  'Kostnadsfritt att lägga ut, och du säger ja först när du är nöjd',
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-espresso-800">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <CheckIcon size={12} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-white/60 border-y border-espresso-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <Reveal className="text-center max-w-xl mx-auto mb-14">
            <span className="eyebrow text-gold-600">Därför GuldBud</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900">
              Tryggare än guldbutiken på hörnet
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ScaleIcon />,
                title: 'Handlare budar mot varandra',
                desc: 'I stället för ett lågt engångsbud får du flera auktoriserade guldköpare att tävla om ditt föremål. Konkurrensen driver priset uppåt — ofta långt över vad butiken på hörnet erbjuder.',
              },
              {
                icon: <ShieldIcon />,
                title: 'Endast godkända handlare',
                desc: 'Ingen kommer in i budgivningen oanmäld. Varje handlare är manuellt granskad av oss med organisationsnummer och legitimation, så du vet att seriösa köpare står bakom varje bud.',
              },
              {
                icon: <BoltIcon />,
                title: 'Utbetalning inom 24 timmar',
                desc: 'Handlaren betalar direkt när auktionen vinns. Så snart vi tagit emot och verifierat ditt föremål har du pengarna på kontot — oftast inom 24 timmar.',
              },
              {
                icon: <HeartIcon />,
                title: 'Full kontroll, noll press',
                desc: 'Du bestämmer allt. Sätt ett reservationspris så ditt guld aldrig säljs för billigt, följ buden i realtid och tacka nej ända fram till att du accepterar — helt utan förpliktelser.',
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="card card-hover p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gold-50 border border-gold-200/60 flex items-center justify-center text-gold-600 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-espresso-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-espresso-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <span className="eyebrow text-gold-600">Röster från säljare</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900">
            Tusentals svenskar har redan sålt smart
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'Jag fick 2 400 kr mer än vad guldbutiken erbjöd, för exakt samma ärvda ring. Riktigt smidigt.',
              name: 'Karin L.',
              city: 'Göteborg',
            },
            {
              quote:
                'Lade ut på kvällen, hade tolv bud nästa morgon. Betalningen kom via Swish samma dag jag skickade.',
              name: 'Mattias R.',
              city: 'Malmö',
            },
            {
              quote:
                'Trygg känsla hela vägen. Handlarna är verifierade och man ser alla bud i realtid. Rekommenderas!',
              name: 'Elisabeth N.',
              city: 'Uppsala',
            },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="card p-7 h-full flex flex-col">
                <div className="flex gap-0.5 mb-4 text-gold-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} />
                  ))}
                </div>
                <blockquote className="text-espresso-700 leading-relaxed flex-1">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-sheen flex items-center justify-center text-espresso-900 font-semibold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-espresso-900">{t.name}</p>
                    <p className="text-xs text-espresso-400">{t.city}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRYGGHET */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <span className="eyebrow text-gold-600">Trygghet hela vägen</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900">
            Så håller vi din affär säker
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              title: 'Manuellt verifierade handlare',
              desc: 'Varje guldhandlare granskas med organisationsnummer och legitimation innan de får buda. Inga anonyma köpare.',
            },
            {
              title: 'Försäkrad transport',
              desc: 'Föremålet skickas rekommenderat och försäkrat. Vi hjälper dig välja rätt fraktalternativ efter värdet.',
            },
            {
              title: 'Betalt efter äkthetskontroll',
              desc: 'När vi mottagit och verifierat föremålet betalas pengarna ut via Swish eller bankkonto, ofta samma dag.',
            },
            {
              title: 'Du bestämmer',
              desc: 'Sätt ett reservationspris, följ buden i realtid och tacka nej när du vill. Ingen press, inga dolda avgifter.',
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 90}>
              <div className="card p-6 h-full flex gap-4">
                <span className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center">
                  <CheckIcon size={18} strokeWidth={2.4} />
                </span>
                <div>
                  <h3 className="font-semibold text-espresso-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-espresso-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-espresso-900 px-8 py-16 sm:px-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
            <div className="pointer-events-none absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-gold-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex text-gold-300 mb-1"><SparkleIcon size={44} /></span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl text-gold-100">
                Ditt guld är värt mer än du tror
              </h2>
              <p className="mt-4 text-espresso-100/70 max-w-lg mx-auto">
                Det tar under fem minuter att lägga ut ditt första föremål, och det kostar ingenting.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link href="/auth/login?mode=register" className="btn-gold text-base !px-8 !py-3.5">
                  Kom igång gratis
                </Link>
                <a href="#estimator" className="btn-ghost-gold text-gold-200 text-base !px-8 !py-3.5">
                  Värdera först
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <RecentlySold rows={sold} />

      <Footer />
    </>
  )
}

/* ---------- small shared bits ---------- */
function DashHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-espresso-900">
      <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
      <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-4 py-10 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-gold-500/80 mb-1">{eyebrow}</p>
          <h1 className="font-display text-3xl text-gold-100">{title}</h1>
          {subtitle && <p className="text-gold-500/70 text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function AuctionsSection({ items, title }: { items: EnrichedItem[]; title: string }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-espresso-900 mb-5">{title}</h2>
      {items.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(0, 9).map((item) => (
            <AuctionCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="card p-14 text-center text-espresso-400">
          <div className="flex justify-center mb-3 text-gold-500/50 animate-float"><GemIcon size={30} strokeWidth={1.2} /></div>
          <p>Inga aktiva auktioner just nu.</p>
        </div>
      )}
    </section>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl sm:text-3xl text-gold-100">{value}</div>
      <div className="text-xs text-espresso-100/50 mt-0.5">{label}</div>
    </div>
  )
}

function Trust({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{children}</span>
}

function CheckMark() {
  return (
    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-gold-100 flex items-center justify-center">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="#a8791a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function FeaturedAuction({ items }: { items: EnrichedItem[] }) {
  const list = items.slice(0, 6)
  const [idx, setIdx] = useState(0)

  // Auto-rotate through the featured auctions.
  useEffect(() => {
    if (list.length <= 1) return
    const id = setInterval(() => setIdx((i) => (i + 1) % list.length), 5000)
    return () => clearInterval(id)
  }, [list.length])

  if (list.length === 0) {
    return (
      <div className="relative rounded-[2rem] border border-gold-500/20 bg-espresso-800/50 backdrop-blur-sm p-8 shadow-gold-lg text-center animate-float">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-300 mb-4">
          <GemIcon size={30} strokeWidth={1.3} />
        </div>
        <p className="font-display text-2xl text-gold-100 mb-2">Din auktion kan vara här</p>
        <p className="text-espresso-100/60 text-sm mb-6">
          Bli först att lägga ut ett föremål idag så syns det direkt på förstasidan.
        </p>
        <Link href="/auth/login?mode=register" className="btn-gold">
          Lägg ut ett föremål
        </Link>
      </div>
    )
  }

  const item = list[idx % list.length]
  const img = item.image_urls?.[0]
  const top = item.top_bid || 0
  const count = item.bid_count || 0

  return (
    <div className="relative rounded-[2rem] border border-gold-500/20 bg-espresso-800/50 backdrop-blur-sm p-6 shadow-gold-lg animate-float">
      <Link key={item.id} href={`/auctions/${item.id}`} className="block group animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <span className="eyebrow text-gold-400/80 inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70 animate-pulse-ring" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Auktion · live
          </span>
          {count >= 3 ? (
            <span className="chip bg-red-500/90 text-white">
              <FlameIcon size={12} /> {count} bud
            </span>
          ) : (
            <span className="chip bg-gold-500/15 text-gold-100">{count} bud</span>
          )}
        </div>
        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 relative bg-espresso-900 flex items-center justify-center">
          {img ? (
            <Image src={img} alt={item.title} fill className="object-contain transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <CategoryIcon category={item.category} size={70} className="text-gold-500/40" strokeWidth={1} />
          )}
        </div>
        <p className="font-display text-lg text-gold-100 leading-tight mb-3 truncate">{item.title}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-espresso-200/60 uppercase tracking-wide">Högsta bud</p>
            <p className="font-display text-3xl text-gradient-gold tabular-nums">
              {top ? formatSEK(top) : 'Öppet för bud'}
            </p>
          </div>
          {item.auction_ends_at && (
            <div className="text-right">
              <p className="text-xs text-espresso-200/60 uppercase tracking-wide mb-1">Avslutas om</p>
              <CountdownTimer endsAt={item.auction_ends_at} variant="chip" />
            </div>
          )}
        </div>
      </Link>

      {list.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-5">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Visa auktion ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-5 bg-gold-400' : 'w-1.5 bg-gold-500/30 hover:bg-gold-500/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
