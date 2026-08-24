'use client'
import { useEffect, useState } from 'react'
import { GOLD_SPOT_SEK_PER_GRAM } from '@/lib/gold'

type GoldState = { price: number; live: boolean; changePct: number | null; up: boolean }

/**
 * Returns the current 24K gold price (SEK/gram) plus the real daily change
 * (changePct / up). Starts from the calibrated constant and updates to the live
 * value from /api/gold-price once loaded, then every 5 minutes.
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
    // Keep an open page in sync with the market every 5 minutes.
    const id = setInterval(load, 5 * 60 * 1000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return state
}
