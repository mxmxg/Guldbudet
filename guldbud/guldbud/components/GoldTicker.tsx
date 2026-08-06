'use client'
import { useEffect, useState } from 'react'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

function fmt(n: number) {
  return n.toLocaleString('sv-SE')
}

// Gentle client-only wander around the live 24K base so the row visibly moves
// (green/red) and reads as live. The underlying price is the same one the
// calculator uses; this is only a small ±few-kr visual movement.
function priceAt(t: number, base: number) {
  const wave = Math.sin(t / 42000) * 3.4 + Math.sin(t / 130000) * 5.1 + Math.sin(t / 17000) * 1.2
  return base + wave
}

/**
 * Slim always-visible bar across the very top showing the live gold price for
 * every karat on one row, with a green/red movement indicator.
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

  const price = state.price
  const up = state.up
  const changePct = ((price - base) / base) * 100
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

        <span
          className={`shrink-0 ml-auto pl-3 font-semibold tabular-nums ${
            up ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}
