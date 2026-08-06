'use client'
import { useEffect, useState } from 'react'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

function fmt(n: number) {
  return n.toLocaleString('sv-SE')
}

function priceAt(t: number, base: number) {
  const wave = Math.sin(t / 42000) * 3.4 + Math.sin(t / 130000) * 5.1 + Math.sin(t / 17000) * 1.2
  return base + wave
}

/**
 * Live gold price for every karat on one row, with a green/red movement chip.
 * Desktop: static row (everything fits). Mobile: a continuously scrolling
 * marquee so all karats pass by instead of getting cut off.
 */
export default function GoldTicker() {
  const { price: base } = useGoldPrice()
  const [state, setState] = useState<{ price: number; up: boolean }>({ price: base, up: true })

  useEffect(() => {
    let prev = base
    const tick = () => {
      const p = priceAt(Date.now(), base)
      setState({ price: p, up: p >= prev })
      prev = p
    }
    tick()
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [base])

  const { price, up } = state
  const changePct = ((price - base) / base) * 100
  const karats = karatPrices(price)

  const Label = () => (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-gold-400/90">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-70 animate-pulse-ring" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-400" />
      </span>
      <span className="font-semibold tracking-wide uppercase text-[10px]">Guldpris live</span>
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

  const Change = () => (
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
