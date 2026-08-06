'use client'
import { useEffect, useState } from 'react'
import { GOLD_SPOT_SEK_PER_GRAM } from '@/lib/gold'

/**
 * Returns the current 24K gold price (SEK/gram). Starts from the calibrated
 * constant and updates to the live value from /api/gold-price once loaded.
 */
export function useGoldPrice(): { price: number; live: boolean } {
  const [state, setState] = useState<{ price: number; live: boolean }>({
    price: GOLD_SPOT_SEK_PER_GRAM,
    live: false,
  })

  useEffect(() => {
    let active = true
    const load = () =>
      fetch('/api/gold-price')
        .then((r) => r.json())
        .then((d) => {
          if (active && d?.pricePerGram24k) setState({ price: d.pricePerGram24k, live: !!d.live })
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
