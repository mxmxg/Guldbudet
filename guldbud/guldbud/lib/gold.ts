// Gold value helpers — shared by the estimator, auction cards and detail view.
// The spot price is a sensible static baseline used for indicative estimates only;
// real payouts are set by dealer bidding. Prices in SEK per gram of pure (24K) gold.

export const GOLD_SPOT_SEK_PER_GRAM = 785 // indicative 24K spot, SEK/g

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
export function meltValue(weightGrams: number, karat: string): number {
  const purity = KARAT_PURITY[karat] ?? 0.585
  return Math.round(weightGrams * purity * GOLD_SPOT_SEK_PER_GRAM)
}

/**
 * Indicative auction range. Dealers on GuldBud compete, so the realised price
 * typically lands between a conservative floor and a competitive ceiling of the
 * melt value. Returns rounded, nicely-stepped numbers.
 */
export function estimateRange(weightGrams: number, karat: string): {
  low: number
  high: number
  melt: number
} {
  const melt = meltValue(weightGrams, karat)
  const low = roundTo(melt * 0.9, 10)
  const high = roundTo(melt * 1.06, 10)
  return { low, high, melt }
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function formatSEK(n: number): string {
  return n.toLocaleString('sv-SE') + ' kr'
}
