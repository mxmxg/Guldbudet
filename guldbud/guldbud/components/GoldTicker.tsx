'use client'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

function fmt(n: number) {
  return n.toLocaleString('sv-SE')
}

/**
 * Dagens guldpris per karat på en rad, med en grön/röd rörelse-chip som visar
 * VERKLIG dagsförändring (mot gårdagens stängning) från /api/gold-price. Priset
 * uppdateras var 5:e minut, så chippen följer marknaden upp och ner på riktigt.
 * (Ingen simulerad rörelse längre, en tidigare version lade på en Math.sin()-våg
 * märkt "live", vilket krockade med löftet om ärliga siffror.)
 * Desktop: statisk rad. Mobil: scrollande marquee (pausas vid prefers-reduced-motion).
 */
export default function GoldTicker() {
  const { price, changePct, up, live } = useGoldPrice()
  const karats = karatPrices(price)

  const Label = () => (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-gold-400/90">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-70 animate-pulse-ring" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-400" />
      </span>
      <span className="font-semibold tracking-wide uppercase text-[10px]">
        {live ? 'Guldpris live' : 'Guldpris riktvärde'}
      </span>
    </span>
  )

  const Prices = () =>
    karats.map((k) => (
      <span key={k.label} className="shrink-0 whitespace-nowrap">
        <span className="text-gold-300 font-semibold">{k.label}</span>{' '}
        <span className="text-gold-100">{fmt(k.perGram)}</span>
        <span className="text-gold-300/70"> kr/g</span>
      </span>
    ))

  // Visas bara när vi har en faktisk förändringssiffra (inte på reservkällan).
  const Change = () =>
    changePct == null ? null : (
      <span className={`shrink-0 font-semibold tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
      </span>
    )

  // One full sequence of the ticker content (used twice in the marquee).
  const Segment = () => (
    <span className="flex items-center gap-4 pr-4 text-xs tabular-nums">
      <Label />
      <Prices />
      <Change />
    </span>
  )

  return (
    <div className="bg-espresso-900 border-b border-gold-500/10">
      {/* Desktop: static (everything fits) */}
      <div className="hidden sm:flex max-w-6xl mx-auto h-9 px-4 items-center gap-4 text-xs tabular-nums">
        <Label />
        <div className="flex items-center gap-4">
          <Prices />
        </div>
        <Change />
      </div>

      {/* Mobile: continuously scrolling marquee */}
      <div className="sm:hidden relative h-9 overflow-hidden">
        <div className="absolute inset-y-0 left-0 flex items-center w-max animate-marquee">
          <Segment />
          <Segment />
        </div>
      </div>
    </div>
  )
}
