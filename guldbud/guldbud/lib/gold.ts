// Gold value helpers — shared by the estimator, auction cards and detail view.
// The spot price is a sensible baseline used for indicative estimates; the live
// price is fetched from /api/gold-price and falls back to this constant.
// Prices in SEK per gram of pure (24K) gold.

// Fallback / baseline 24K spot, SEK/g. Calibrated so 18K ≈ 971 kr/g.
export const GOLD_SPOT_SEK_PER_GRAM = 1295

// Reasonable bounds for a sanity check on any live value (SEK/g, 24K).
export const GOLD_MIN_SEK_PER_GRAM = 500
export const GOLD_MAX_SEK_PER_GRAM = 3000

// Map of the karat option strings used across the app -> gold purity (fraction).
export const KARAT_PURITY: Record<string, number> = {
  '24K / 999': 0.999,
  '22K / 916': 0.916,
  '18K / 750': 0.75,
  '14K / 585': 0.585,
  '9K / 375': 0.375,
  Övrigt: 0.585, // conservative fallback
}

export const KARAT_OPTIONS = Object.keys(KARAT_PURITY)

/** Pure metal value of an item at spot, before any dealer margin. */
export function meltValue(weightGrams: number, karat: string, spot = GOLD_SPOT_SEK_PER_GRAM): number {
  const purity = KARAT_PURITY[karat] ?? 0.585
  return Math.round(weightGrams * purity * spot)
}

/**
 * Indicative payout range for a seller. Dealers buy below spot to leave margin,
 * but competition on GuldBud pushes the realised price up toward the metal
 * value. The estimate therefore sits clearly *below* the melt value: a
 * conservative floor and a competitive ceiling. `melt` is returned separately
 * as the reference metal value. Numbers are rounded to nice steps.
 */
export function estimateRange(
  weightGrams: number,
  karat: string,
  spot = GOLD_SPOT_SEK_PER_GRAM
): { low: number; high: number; melt: number } {
  const melt = meltValue(weightGrams, karat, spot)
  const low = roundTo(melt * 0.8, 10)
  const high = roundTo(melt * 0.92, 10)
  return { low, high, melt }
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function formatSEK(n: number): string {
  return n.toLocaleString('sv-SE') + ' kr'
}

/**
 * Fetch a live 24K gold price in SEK/gram from public no-key APIs
 * (gold price in USD/oz × USD→SEK). Throws on failure or out-of-range values
 * so callers can fall back to GOLD_SPOT_SEK_PER_GRAM.
 */
export async function fetchLiveGoldSekPerGram(signal?: AbortSignal): Promise<number> {
  const OZ_TO_GRAM = 31.1034768
  const [goldRes, fxRes] = await Promise.all([
    fetch('https://api.gold-api.com/price/XAU', { signal, next: { revalidate: 300 } } as any),
    fetch('https://api.frankfurter.app/latest?from=USD&to=SEK', { signal, next: { revalidate: 300 } } as any),
  ])
  if (!goldRes.ok || !fxRes.ok) throw new Error('price fetch failed')
  const gold = await goldRes.json()
  const fx = await fxRes.json()
  const usdPerOz = Number(gold?.price)
  const sekPerUsd = Number(fx?.rates?.SEK)
  if (!usdPerOz || !sekPerUsd) throw new Error('price parse failed')
  const sekPerGram = (usdPerOz * sekPerUsd) / OZ_TO_GRAM
  if (sekPerGram < GOLD_MIN_SEK_PER_GRAM || sekPerGram > GOLD_MAX_SEK_PER_GRAM) {
    throw new Error('price out of range')
  }
  return Math.round(sekPerGram)
}
