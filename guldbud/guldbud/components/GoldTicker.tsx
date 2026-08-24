'use client'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

function fmt(n: number) {
  return n.toLocaleString('sv-SE')
}

/**
 * Dagens guldpris per karat på en rad. Priset är det RIKTIGA spotpriset som
 * hämtas live via /api/gold-price (uppdateras var 5:e minut), med en ärlig
 * fallback om hämtningen fallerar. Ingen simulerad rörelse: en tidigare version
 * lade på en Math.sin()-våg och en påhittad procentförändring märkt "live",
 * vilket krockade med löftet om ärliga priser. Nu visas bara det faktiska priset.
 * Desktop: statisk rad (allt får plats). Mobil: en scrollande marquee (pausas
 * automatiskt vid prefers-reduced-motion) så alla karat hinner passera.
 */
export default function GoldTicker() {
  const { price } = useGoldPrice()
  const karats = karatPrices(price)

  const Label = () => (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-gold-400/90">
      <span className="inline-flex rounded-full h-1.5 w-1.5 bg-gold-400" />
      <span className="font-semibold tracking-wide uppercase text-[10px]">Dagens guldpris</span>
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

  // One full sequence of the ticker content (used twice in the marquee).
  const Segment = () => (
    <span className="flex items-center gap-4 pr-4 text-xs tabular-nums">
      <Label />
      <Prices />
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
