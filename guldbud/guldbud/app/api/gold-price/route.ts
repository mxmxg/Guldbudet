import { NextResponse } from 'next/server'
import { fetchLiveGold, GOLD_SPOT_SEK_PER_GRAM } from '@/lib/gold'

// Guldpriset ska alltid komma från marknaden, inte från en konstant, så
// cachen hålls kort: en minut. Spotpriset rör sig kontinuerligt och källorna
// uppdaterar ungefär i den takten, så tätare hämtning ger inget mer, bara
// fler anrop.
export const revalidate = 60

export async function GET() {
  try {
    const g = await fetchLiveGold()
    return NextResponse.json(
      { pricePerGram24k: g.pricePerGram24k, changePct: g.changePct, up: g.up, live: true, updatedAt: Date.now() },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    )
  } catch {
    // Reservvärdet gör att gränssnittet aldrig går sönder, men det märks:
    // live=false, och varje yta som visar priset säger "riktvärde" i stället
    // för att presentera konstanten som en kurs.
    return NextResponse.json(
      { pricePerGram24k: GOLD_SPOT_SEK_PER_GRAM, changePct: null, up: true, live: false, updatedAt: Date.now() },
      { headers: { 'Cache-Control': 's-maxage=60' } }
    )
  }
}
