import { NextResponse } from 'next/server'
import { fetchLiveGold, GOLD_SPOT_SEK_PER_GRAM } from '@/lib/gold'

// Refresh the live price every 5 minutes (gold spot moves continuously; this
// keeps the ticker close to real time without hammering the free APIs).
export const revalidate = 300

export async function GET() {
  try {
    const g = await fetchLiveGold()
    return NextResponse.json(
      { pricePerGram24k: g.pricePerGram24k, changePct: g.changePct, up: g.up, live: true, updatedAt: Date.now() },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' } }
    )
  } catch {
    // Fall back to the calibrated constant so the UI is never broken.
    return NextResponse.json(
      { pricePerGram24k: GOLD_SPOT_SEK_PER_GRAM, changePct: null, up: true, live: false, updatedAt: Date.now() },
      { headers: { 'Cache-Control': 's-maxage=60' } }
    )
  }
}
