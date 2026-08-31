'use client'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { karatPrices } from '@/lib/gold'

// Visar 24K-priset per gram och dagens verkliga förändring från
// /api/gold-price, plus priset per karat.
//
// Tidigare la den här komponenten tre Math.sin()-vågor ovanpå baspriset och
// ritade en sparkline av dem, samt räknade fram "X% idag" ur avståndet mellan
// det vandrande värdet och basen. Det var alltså en påhittad kursrörelse
// presenterad som live, på en sida som heter guldpris-idag. GoldTicker tog bort
// exakt samma sak med motiveringen att den krockade med löftet om ärliga
// siffror, och det gäller här med.
//
// Sparklinen är borttagen och kommer inte tillbaka utan en källa: vi har ingen
// historik över dagen, bara ett pris nu och en dagsförändring. En kurva utan
// data är dekoration som utger sig för att vara mätning.

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
  // price uppdateras var 5:e minut av useGoldPrice. changePct är dagens
  // faktiska förändring mot gårdagens stängning och är null när källan inte
  // levererar den, live är false när vi visar riktvärdet i stället för kursen.
  const { price, changePct, up, live } = useGoldPrice()
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
          {changePct != null && (
            <span className={`text-[10px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-gold-400/70">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Hover dropdown: full karat breakdown */}
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition absolute right-0 top-7 z-50 w-56 rounded-xl bg-espresso-900 border border-gold-500/20 shadow-lift p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow text-gold-400/80 text-[10px]">
              {live ? 'Guldpris · live' : 'Guldpris · riktvärde'}
            </span>
            {changePct != null && (
              <span className={`text-[10px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
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
            <span className="eyebrow text-gold-400/80">
              {live ? 'Guldpris · live' : 'Guldpris · riktvärde'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold text-gold-100">{fmt(Math.round(price))}</span>
            <span className="text-gold-300/70 text-sm">kr / gram · 24K</span>
          </div>
          {/* Dagsförändringen visas bara när källan faktiskt levererar den.
              Att räkna fram en siffra vi inte har är samma fel som vågen. */}
          {changePct != null ? (
            <div className={`mt-1 text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}% idag
            </div>
          ) : (
            <div className="mt-1 text-xs text-espresso-200/50">
              {live ? 'Dagsförändring saknas just nu' : 'Kursen kunde inte hämtas, visar riktvärde'}
            </div>
          )}
        </div>
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
