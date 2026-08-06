'use client'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

function fmt(n: number) {
  return n.toLocaleString('sv-SE')
}

/**
 * Slim always-visible bar across the very top showing the live gold price for
 * every karat on one row, so a visitor immediately sees what their karat is worth.
 */
export default function GoldTicker() {
  const { price } = useGoldPrice()
  const karats = karatPrices(price)

  return (
    <div className="bg-espresso-900 border-b border-gold-500/10">
      <div className="max-w-6xl mx-auto h-9 px-4 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs">
        <span className="inline-flex items-center gap-1.5 shrink-0 text-gold-400/90">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-70 animate-pulse-ring" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-400" />
          </span>
          <span className="font-semibold tracking-wide uppercase text-[10px]">Guldpris live</span>
        </span>

        <div className="flex items-center gap-4 shrink-0 tabular-nums">
          {karats.map((k) => (
            <span key={k.label} className="shrink-0 whitespace-nowrap">
              <span className="text-gold-300 font-semibold">{k.label}</span>{' '}
              <span className="text-gold-100">{fmt(k.perGram)}</span>
              <span className="text-espresso-200/40"> kr/g</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
