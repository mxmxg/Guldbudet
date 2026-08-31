'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { KARAT_PURITY, estimateRange, formatSEK } from '@/lib/gold'
import { useGoldPrice } from '@/lib/useGoldPrice'

const KARATS = [
  { key: '24K / 999', short: '24K' },
  { key: '22K / 916', short: '22K' },
  { key: '18K / 750', short: '18K' },
  { key: '14K / 585', short: '14K' },
  { key: '9K / 375', short: '9K' },
]

/**
 * Interactive "what is my gold worth?" calculator. Weight slider + karat picker
 * produce an instant indicative auction range. The single most persuasive reason
 * to list an item, so it lives up front on the landing page.
 */
export default function ValueEstimator({ loggedIn }: { loggedIn: boolean }) {
  const [weight, setWeight] = useState(12)
  const [karat, setKarat] = useState('18K / 750')
  const { price: spot } = useGoldPrice()

  const { low, high } = useMemo(() => estimateRange(weight, karat, spot), [weight, karat, spot])
  const purity = KARAT_PURITY[karat] ?? 0.585
  const purityPct = Math.round(purity * 100)
  const karatShort = karat.split(' ')[0]
  const karatPerGram = Math.round(spot * purity)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-espresso-900 border border-gold-500/20 shadow-gold-lg">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="relative p-7 sm:p-9">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <SparkleIcon />
            <span className="eyebrow text-gold-400/90">Värderingskalkylator</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gold-200/80 tabular-nums">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-70 animate-pulse-ring" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-400" />
            </span>
            Guld {karatShort} · {karatPerGram.toLocaleString('sv-SE')} kr/g
          </span>
        </div>
        <h3 className="font-display text-2xl text-gold-100 mb-1">Vad är ditt guld värt?</h3>
        <p className="text-espresso-100/70 text-sm mb-7">
          Dra i reglaget och välj karat, se ett direktvärde baserat på dagens guldpris.
        </p>

        {/* Weight */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <label className="text-sm text-espresso-100/80">Vikt</label>
            <div className="tabular-nums">
              <input
                type="number"
                aria-label="Vikt i gram"
                value={weight}
                min={0.5}
                max={500}
                step={0.5}
                onChange={(e) => setWeight(Math.min(500, Math.max(0.5, Number(e.target.value) || 0)))}
                className="w-20 text-right !bg-espresso-800 !border-espresso-700 !text-gold-100 !py-1.5"
              />
              <span className="text-espresso-100/70 text-sm ml-2">gram</span>
            </div>
          </div>
          <input
            type="range"
            aria-label="Vikt i gram, reglage"
            min={0.5}
            max={200}
            step={0.5}
            value={Math.min(200, weight)}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="gold-range w-full"
          />
          <div className="flex justify-between text-[10px] text-espresso-100/75 mt-1">
            <span>0,5 g</span>
            <span>200 g</span>
          </div>
        </div>

        {/* Karat */}
        <div className="mb-7">
          <label className="text-sm text-espresso-100/80 block mb-2">Karat / finhet</label>
          <div className="grid grid-cols-5 gap-2">
            {KARATS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKarat(k.key)}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  karat === k.key
                    ? 'bg-gold-sheen text-espresso-900 shadow-gold'
                    : 'bg-espresso-800 text-espresso-100/70 border border-espresso-700 hover:border-gold-500/40 hover:text-gold-200'
                }`}
              >
                {k.short}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-2xl bg-espresso-800/60 border border-gold-500/15 p-5">
          <p className="eyebrow text-gold-400/70 mb-2">Uppskattat auktionsvärde</p>
          <div className="flex items-baseline gap-2 tabular-nums flex-wrap">
            <span className="font-display text-3xl sm:text-4xl text-gradient-gold">
              {formatSEK(low)}
            </span>
            <span className="text-espresso-100/60">-</span>
            <span className="font-display text-3xl sm:text-4xl text-gradient-gold">
              {formatSEK(high)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-espresso-100/60">
            <span>Renhet: <span className="text-gold-200">{purityPct}%</span></span>
          </div>
        </div>

        <Link
          href={loggedIn ? '/customer/submit' : '/auth/login?mode=register'}
          className="btn-gold w-full mt-5"
        >
          Lägg ut och få riktiga bud
          <ArrowIcon />
        </Link>
        <p className="text-center text-[11px] text-espresso-100/70 mt-3">
          Riktvärde utifrån dagens guldpris. Handlarna budar i konkurrens, så slutpriset kan bli högre.
        </p>
      </div>

      <style jsx>{`
        .gold-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, #d9ab3c, #a8791a);
          outline: none;
        }
        .gold-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #faf0d4;
          border: 3px solid #c2901f;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .gold-range::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
        .gold-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #faf0d4;
          border: 3px solid #c2901f;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l1.8 5.6L19.5 9.5 13.8 11.3 12 17l-1.8-5.7L4.5 9.5l5.7-1.9L12 2z"
        fill="#d9ab3c"
      />
      <path d="M19 14l.8 2.4L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.6L19 14z" fill="#e8c766" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
