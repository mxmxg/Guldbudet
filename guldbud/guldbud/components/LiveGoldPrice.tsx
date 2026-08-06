'use client'
import { useEffect, useState } from 'react'
import { useGoldPrice } from '@/lib/useGoldPrice'

// Produces a gently drifting spot price + sparkline around the live 24K base so
// the market feels alive. The base comes from /api/gold-price; the small wander
// is a client-only visual (no hydration mismatch).
function priceAt(t: number, base: number) {
  const wave =
    Math.sin(t / 42000) * 3.4 +
    Math.sin(t / 130000) * 5.1 +
    Math.sin(t / 17000) * 1.2
  return base + wave
}

function buildHistory(now: number, n: number, base: number) {
  const arr: number[] = []
  for (let i = n - 1; i >= 0; i--) arr.push(priceAt(now - i * 60000, base))
  return arr
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
    // Placeholder to avoid layout shift / hydration mismatch
    return variant === 'mini' ? (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <GoldDot />
        <span className="text-gold-200/60 text-xs">Guldpris …</span>
      </span>
    ) : (
      <div className={`h-[104px] rounded-2xl skeleton ${className}`} />
    )
  }

  const price = history[history.length - 1] ?? priceAt(now, base)
  const prev = history[history.length - 2] ?? price
  const up = price >= prev
  const changePct = ((price - base) / base) * 100

  if (variant === 'mini') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}
        title="Indikativt guldpris (24K), SEK/gram"
      >
        <GoldDot />
        <span className="text-gold-100 text-xs font-medium">
          {price.toFixed(0)}&nbsp;kr/g
        </span>
        <span className={`text-[10px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
        </span>
      </span>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-dark p-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GoldDot />
            <span className="eyebrow text-gold-400/80">Guldpris · live</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold text-gold-100">{price.toFixed(0)}</span>
            <span className="text-gold-300/70 text-sm">kr / gram · 24K</span>
          </div>
          <div className={`mt-1 text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}% idag
          </div>
        </div>
        <Sparkline data={history} up={up} />
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
