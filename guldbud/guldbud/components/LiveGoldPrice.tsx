'use client'
import { useEffect, useState } from 'react'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

// Produces a gently drifting spot price + sparkline around the live 24K base so
// the market feels alive. The base comes from /api/gold-price; the small wander
// is a client-only visual (no hydration mismatch).
function priceAt(t: number, base: number) {
  const wave = Math.sin(t / 42000) * 3.4 + Math.sin(t / 130000) * 5.1 + Math.sin(t / 17000) * 1.2
  return base + wave
}

function buildHistory(now: number, n: number, base: number) {
  const arr: number[] = []
  for (let i = n - 1; i >= 0; i--) arr.push(priceAt(now - i * 60000, base))
  return arr
}

function fmt(n: number) {
  return n.toLocaleString('sv-SE')
}

export default function LiveGoldPrice({
  variant = 'card',
  className = '',
}: {
  variant?: 'card' | 'mini'
  className?: string
}) {
  const { price: base } = useGoldPrice()
  const [now, setNow] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {
    const tick = () => {
      const t = Date.now()
      setNow(t)
      setHistory(buildHistory(t, 32, base))
    }
    tick()
    const id = setInterval(tick, 3000)
    return () => clearInterval(id)
  }, [base])

  if (now === null) {
    return variant === 'mini' ? (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <GoldDot />
        <span className="text-gold-200/60 text-xs">Guldpris …</span>
      </span>
    ) : (
      <div className={`h-[168px] rounded-2xl skeleton ${className}`} />
    )
  }

  const price = history[history.length - 1] ?? priceAt(now, base)
  const prev = history[history.length - 2] ?? price
  const up = price >= prev
  const changePct = ((price - base) / base) * 100
  const karats = karatPrices(price)

  if (variant === 'mini') {
    return (
      <span className={`group relative inline-flex ${className}`}>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 tabular-nums cursor-default"
          title="Guldpris per gram (live)"
        >
          <GoldDot />
          <span className="text-gold-100 text-xs font-medium">Guld {fmt(Math.round(price))} kr/g</span>
          <span className={`text-[10px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-gold-400/70">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Hover dropdown: full karat breakdown */}
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition absolute right-0 top-7 z-50 w-56 rounded-xl bg-espresso-900 border border-gold-500/20 shadow-lift p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow text-gold-400/80 text-[10px]">Guldpris · live</span>
            <span className={`text-[10px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
          </div>
          <ul className="space-y-1">
            {karats.map((k) => (
              <li key={k.label} className="flex items-center justify-between text-xs tabular-nums">
                <span className="text-espresso-100/70">{k.label}</span>
                <span className="text-gold-100 font-medium">{fmt(k.perGram)} kr/g</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-espresso-200/40 mt-2">Marknadsvärde per gram, uppdateras löpande.</p>
        </div>
      </span>
    )
  }

  // ---- card ----
  return (
    <div className={`relative overflow-hidden rounded-2xl glass-dark p-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GoldDot />
            <span className="eyebrow text-gold-400/80">Guldpris · live</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold text-gold-100">{fmt(Math.round(price))}</span>
            <span className="text-gold-300/70 text-sm">kr / gram · 24K</span>
          </div>
          <div className={`mt-1 text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}% idag
          </div>
        </div>
        <Sparkline data={history} up={up} />
      </div>

      {/* Karat breakdown */}
      <div className="mt-3 pt-3 border-t border-gold-500/15">
        <p className="text-[10px] uppercase tracking-widest text-espresso-200/50 mb-2">Pris per gram och karat</p>
        <div className="grid grid-cols-5 gap-1.5">
          {karats.map((k) => (
            <div
              key={k.label}
              className="rounded-lg bg-espresso-800/60 border border-gold-500/10 px-1.5 py-2 text-center"
            >
              <div className="text-[11px] font-semibold text-gold-300">{k.label}</div>
              <div className="text-[11px] text-gold-100 tabular-nums mt-0.5">{fmt(k.perGram)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GoldDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-70 animate-pulse-ring" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-400" />
    </span>
  )
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null
  const w = 108
  const h = 44
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const stroke = up ? '#34d399' : '#f87171'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
