'use client'
import { useEffect, useState } from 'react'
import { GOLD_SPOT_SEK_PER_GRAM } from '@/lib/gold'

type GoldState = { price: number; live: boolean; changePct: number | null; up: boolean }

/**
 * Returns the current 24K gold price (SEK/gram) plus the real daily change
 * (changePct / up) and whether the value is live. Starts from the fallback
 * constant, updates to the live value from /api/gold-price once loaded, then
 * every minute.
 *
 * live=false betyder att konstanten visas, inte kursen. Varje yta som skriver
 * ut priset ska säga det, i stället för att presentera reservvärdet som en
 * marknadskurs.
 */
export function useGoldPrice(): GoldState {
  const [state, setState] = useState<GoldState>({
    price: GOLD_SPOT_SEK_PER_GRAM,
    live: false,
    changePct: null,
    up: true,
  })

  useEffect(() => {
    let active = true
    const load = () =>
      fetch('/api/gold-price')
        .then((r) => r.json())
        .then((d) => {
          if (active && d?.pricePerGram24k)
            setState({
              price: d.pricePerGram24k,
              live: !!d.live,
              changePct: typeof d.changePct === 'number' ? d.changePct : null,
              up: !!d.up,
            })
        })
        .catch(() => {})
    load()
    // En öppen sida ska följa marknaden, inte frysa vid första hämtningen.
    const id = setInterval(load, 60 * 1000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return state
}
