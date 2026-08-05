'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import Image from 'next/image'
import AuctionCard from '@/components/AuctionCard'
import ValueEstimator from '@/components/ValueEstimator'
import LiveGoldPrice from '@/components/LiveGoldPrice'
import Reveal from '@/components/Reveal'
import CountUp from '@/components/CountUp'
import Footer from '@/components/Footer'
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

export default function HomeContent({ items }: { items: EnrichedItem[] }) {
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
    return <GuestLanding items={items} loggedIn={false} />
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
                <div className="w-14 h-14 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✨
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
                          <Image src={item.image_urls[0]} alt={item.title} fill className="object-cover" />
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
function GuestLanding({ items, loggedIn }: { items: EnrichedItem[]; loggedIn: boolean }) {
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
                varandra — i realtid. Ingen prutning, inga mellanhänder. Bara det bästa budet.
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
                <a href="#estimator" className="btn-ghost-gold text-base !px-7 !py-3.5">
                  Vad är mitt guld värt?
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Stat value={<CountUp end={2400} suffix="+" />} label="Nöjda säljare" />
                <div className="w-px h-10 bg-espresso-700" />
                <Stat value={<CountUp end={98} suffix="%" />} label="Rekommenderar oss" />
                <div className="w-px h-10 bg-espresso-700" />
                <Stat value={<><CountUp end={24} />h</>} label="Utbetalning" />
              </div>
            </Reveal>
          </div>

          {/* Right — floating showcase */}
          <Reveal delay={200} className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-[2rem] bg-gold-500/10 blur-2xl" />
              <div className="relative rounded-[2rem] border border-gold-500/20 bg-espresso-800/50 backdrop-blur-sm p-6 shadow-gold-lg animate-float">
                <div className="flex items-center justify-between mb-5">
                  <span className="eyebrow text-gold-400/80">Auktion · live</span>
                  <span className="chip bg-red-500/90 text-white">🔥 12 bud</span>
                </div>
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center mb-5 relative overflow-hidden">
                  <span className="text-7xl opacity-30">◆</span>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_50%)]" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-espresso-200/60 uppercase tracking-wide">Högsta bud</p>
                    <p className="font-display text-3xl text-gradient-gold tabular-nums">18&nbsp;450 kr</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-espresso-200/60 uppercase tracking-wide">Avslutas om</p>
                    <p className="text-gold-200 font-semibold tabular-nums">02:14:37</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    ['Guldsmedjan AB', '18 450 kr'],
                    ['Nordic Gold', '18 200 kr'],
                    ['Ädelmetall Sthlm', '17 900 kr'],
                  ].map(([name, amt], i) => (
                    <div
                      key={name}
                      className={`flex justify-between text-sm rounded-lg px-3 py-1.5 ${
                        i === 0 ? 'bg-gold-500/15 text-gold-100' : 'text-espresso-100/60'
                      }`}
                    >
                      <span>{name}</span>
                      <span className="tabular-nums">{amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* trust strip */}
        <div className="relative border-t border-espresso-800">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-espresso-100/50">
            <Trust>🔒 BankID-verifierade handlare</Trust>
            <Trust>📦 Försäkrad frakt</Trust>
            <Trust>💸 Utbetalning via Swish</Trust>
            <Trust>✅ Kostnadsfritt att lägga ut</Trust>
          </div>
        </div>
      </section>

      {/* ESTIMATOR + LIVE PRICE */}
      <section id="estimator" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <span className="eyebrow text-gold-600">Gratis värdering</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900 leading-tight">
              Se värdet på sekunder — <span className="text-gradient-gold">innan</span> du säljer
            </h2>
            <p className="mt-4 text-espresso-500 leading-relaxed max-w-md">
              Ange vikt och karat så räknar vi ut ett indikativt auktionsvärde utifrån dagens
              guldpris. Sedan låter du handlarna tävla om att ge dig mer.
            </p>
            <div className="mt-6">
              <LiveGoldPrice variant="card" className="max-w-sm" />
            </div>
            <ul className="mt-6 space-y-3">
              {[
                'Inga dolda avgifter — det är gratis att lägga ut',
                'Du bestämmer själv om du accepterar ett bud',
                'Sätt ett minimipris om du vill',
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
      <section className="bg-white/60 border-y border-espresso-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <Reveal className="text-center max-w-xl mx-auto">
            <span className="eyebrow text-gold-600">Så enkelt är det</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-espresso-900">
              Från byrålåda till betalning
            </h2>
            <p className="mt-3 text-espresso-500">Tre steg. Under fem minuter av ditt arbete.</p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '📸',
                title: 'Fotografera & lägg ut',
                desc: 'Ladda upp bilder, fyll i vikt och karat. Vi granskar och öppnar auktionen — oftast inom ett par timmar.',
              },
              {
                step: '02',
                icon: '⚖️',
                title: 'Handlare budar mot varandra',
                desc: 'Auktoriserade guldhandlare ser ditt föremål och tävlar om att ge dig det högsta budet. Du följer allt i realtid.',
              },
              {
                step: '03',
                icon: '💰',
                title: 'Acceptera & få betalt',
                desc: 'Välj det bud du är nöjd med, skicka föremålet försäkrat till oss och få pengarna via Swish samma dag som vi verifierat.',
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 100}>
                <div className="card card-hover p-7 h-full relative overflow-hidden group">
                  <span className="absolute -top-4 -right-2 font-display text-7xl text-gold-100 select-none group-hover:text-gold-200 transition-colors">
                    {s.step}
                  </span>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gold-50 border border-gold-200/60 flex items-center justify-center text-2xl mb-5">
                      {s.icon}
                    </div>
                    <h3 className="font-display text-xl text-espresso-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-espresso-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center mt-10">
            <Link href="/how-it-works" className="btn-outline">
              Läs mer om processen →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* LIVE AUCTIONS */}
      <section id="auctions" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 90}>
                <AuctionCard item={item} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-4 text-3xl animate-float">
              ◆
            </div>
            <p className="font-display text-xl text-espresso-800 mb-2">Inga aktiva auktioner just nu</p>
            <p className="text-espresso-500 text-sm mb-6">Bli den första att lägga ut ett föremål idag.</p>
            <Link href="/auth/login?mode=register" className="btn-gold">
              Lägg ut ett föremål
            </Link>
          </div>
        )}
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
              { icon: <ScaleIcon />, title: 'Bud i konkurrens', desc: 'Handlarna tävlar om ditt guld. Konkurrens pressar priset uppåt — till din fördel.' },
              { icon: <ShieldIcon />, title: 'Endast godkända handlare', desc: 'Varje handlare är manuellt verifierad med org.nummer och legitimation.' },
              { icon: <BoltIcon />, title: 'Snabbt & smidigt', desc: 'Från uppladdning till pengar på kontot tar det oftast bara några dagar.' },
              { icon: <HeartIcon />, title: 'Full kontroll', desc: 'Du väljer om och när du säljer. Sätt minimipris och tacka nej när du vill.' },
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
                'Jag fick 2 400 kr mer än vad guldbutiken erbjöd — för exakt samma ärvda ring. Sjukt enkelt.',
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

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-espresso-900 px-8 py-16 sm:px-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
            <div className="pointer-events-none absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-gold-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="relative">
              <span className="text-5xl">✨</span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl text-gold-100">
                Ditt guld är värt mer än du tror
              </h2>
              <p className="mt-4 text-espresso-100/70 max-w-lg mx-auto">
                Det tar under fem minuter att lägga ut ditt första föremål — och det kostar ingenting.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link href="/auth/login?mode=register" className="btn-gold text-base !px-8 !py-3.5">
                  Kom igång gratis
                </Link>
                <a href="#estimator" className="btn-ghost-gold text-base !px-8 !py-3.5">
                  Värdera först
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

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
          {items.map((item) => (
            <AuctionCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="card p-14 text-center text-espresso-400">
          <div className="text-3xl mb-3 opacity-40 animate-float">◆</div>
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

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
    </svg>
  )
}
function ScaleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M7 21h10M6 6l-3 6a3 3 0 0 0 6 0L6 6zM18 6l-3 6a3 3 0 0 0 6 0l-3-6zM4 6h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s-7-4.4-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3.2 1.2 4 2.3C10.8 7.2 12 6 14 6c3.5 0 5 3.5 3.5 6.5C19 16.6 12 21 12 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
