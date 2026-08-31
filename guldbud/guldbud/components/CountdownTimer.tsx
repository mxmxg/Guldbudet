'use client'
import { useEffect, useState } from 'react'

function diffParts(target: number) {
  const diff = Math.max(0, target - Date.now())
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s, ended: diff <= 0, totalMs: diff }
}

/**
 * Live-ticking countdown. Two variants:
 *  - "chip": compact single-line for cards
 *  - "blocks": segmented HH:MM:SS blocks for the detail view
 * Turns urgent (red) under `urgentUnderMs` remaining.
 */
export default function CountdownTimer({
  endsAt,
  variant = 'chip',
  urgentUnderMs = 60 * 60 * 1000,
  className = '',
}: {
  endsAt: string | number | undefined | null
  variant?: 'chip' | 'blocks'
  urgentUnderMs?: number
  className?: string
}) {
  const target = endsAt ? new Date(endsAt).getTime() : 0
  // Compute the time only on the client (in useEffect) so the server-rendered
  // HTML and the first client render agree, otherwise Date.now() differs
  // between them and React throws a hydration mismatch on every card.
  const [parts, setParts] = useState<ReturnType<typeof diffParts> | null>(null)

  useEffect(() => {
    if (!target) return
    setParts(diffParts(target))
    const id = setInterval(() => setParts(diffParts(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (!endsAt) return null

  // First paint (server + pre-effect client): stable placeholder, no mismatch.
  if (!parts) {
    if (variant === 'chip') {
      return (
        <span className={`chip tabular-nums bg-gold-50 text-gold-700 ${className}`}>
          <ClockIcon className="text-gold-500" />
          <span className="opacity-60">-</span>
        </span>
      )
    }
    return <div className={`h-[52px] ${className}`} aria-hidden />
  }

  const urgent = !parts.ended && parts.totalMs < urgentUnderMs

  if (parts.ended) {
    return (
      <span className={`chip bg-espresso-100 text-espresso-500 ${className}`}>Avslutad</span>
    )
  }

  if (variant === 'chip') {
    const label =
      parts.d > 0
        ? `${parts.d}d ${parts.h}h ${parts.m}m`
        : parts.h > 0
        ? `${parts.h}h ${parts.m}m ${pad(parts.s)}s`
        : `${parts.m}m ${pad(parts.s)}s`
    return (
      <span
        className={`chip tabular-nums ${
          urgent ? 'bg-red-50 text-red-600' : 'bg-gold-50 text-gold-700'
        } ${className}`}
      >
        <ClockIcon className={urgent ? 'text-red-500' : 'text-gold-500'} />
        {label}
      </span>
    )
  }

  // blocks variant
  const blocks: [string, number][] = [
    ['Dgr', parts.d],
    ['Tim', parts.h],
    ['Min', parts.m],
    ['Sek', parts.s],
  ]
  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
      {blocks.map(([label, val], i) => (
        <div key={label} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`min-w-[44px] sm:min-w-[52px] rounded-xl px-2 sm:px-2.5 py-2 text-center tabular-nums ${
              urgent
                ? 'bg-red-50 border border-red-200'
                : 'bg-espresso-800 border border-espresso-700'
            }`}
          >
            <div
              className={`text-xl font-semibold leading-none ${
                urgent ? 'text-red-600' : 'text-gold-200'
              }`}
            >
              {pad(val)}
            </div>
            <div
              className={`text-[9px] uppercase tracking-widest mt-1 ${
                urgent ? 'text-red-400' : 'text-espresso-200/70'
              }`}
            >
              {label}
            </div>
          </div>
          {i < blocks.length - 1 && (
            <span className={urgent ? 'text-red-300' : 'text-espresso-300'}>:</span>
          )}
        </div>
      ))}
    </div>
  )
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
