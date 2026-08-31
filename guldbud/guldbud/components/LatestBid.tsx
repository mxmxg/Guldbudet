'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { formatSEK } from '@/lib/gold'

// Ett bud äldre än ett dygn säljer motsatsen till aktivitet, då renderas
// ingenting. Bara riktig data, aldrig simulerad, se beslutsloggen.
const MAX_AGE_MS = 24 * 60 * 60 * 1000

type Latest = { amount: number; created_at: string; item_id: string; title: string }

/**
 * "Senaste bud"-puls på startsidan. Läser det senaste budet på en aktiv
 * auktion och lyssnar via realtime efter nya, samma kanalmönster som
 * auktionssidan. Landar ett bud medan besökaren tittar blinkar raden till.
 */
export default function LatestBid() {
  const [latest, setLatest] = useState<Latest | null>(null)
  const [flash, setFlash] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let alive = true

    const load = async () => {
      // FK-namnet krävs: bids och items har två relationer (bids.item_id och
      // items.accepted_bid_id), och utan namnet svarar PostgREST med PGRST201.
      const { data } = await supabase
        .from('bids')
        .select('amount, created_at, item_id, items!bids_item_id_fkey!inner(title, status)')
        .eq('items.status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      const row: any = data?.[0]
      if (alive && row?.items?.title) {
        setLatest({ amount: row.amount, created_at: row.created_at, item_id: row.item_id, title: row.items.title })
      }
    }
    load()

    const channel = supabase
      .channel('latest-bid-home')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        async (payload: any) => {
          const nb = payload.new
          if (!nb?.item_id) return
          const { data: it } = await supabase
            .from('items')
            .select('title, status')
            .eq('id', nb.item_id)
            .single()
          if (!it || it.status !== 'active') return
          setLatest({ amount: nb.amount, created_at: nb.created_at, item_id: nb.item_id, title: it.title })
          setFlash(true)
          setTimeout(() => setFlash(false), 1500)
        }
      )
      .subscribe()

    // Relativtiden ("för 2 min sedan") ska ticka utan nya hämtningar.
    const t = setInterval(() => setTick((n) => n + 1), 30000)
    return () => {
      alive = false
      clearInterval(t)
      supabase.removeChannel(channel)
    }
  }, [])

  if (!latest) return null
  const age = Date.now() - new Date(latest.created_at).getTime()
  if (age < 0 || age > MAX_AGE_MS) return null

  return (
    <Link
      href={`/auctions/${latest.item_id}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
        flash
          ? 'border-gold-400 bg-gold-50 shadow-gold'
          : 'border-espresso-100 bg-white hover:border-gold-400'
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-gold-500 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
      </span>
      <span className="text-espresso-600">Senaste bud</span>
      <span className="font-semibold text-espresso-900 tabular-nums">{formatSEK(latest.amount)}</span>
      <span className="text-espresso-400 text-xs">{relTime(age)}</span>
    </Link>
  )
}

function relTime(ms: number) {
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'nyss'
  if (m < 60) return `för ${m} min sedan`
  const h = Math.floor(m / 60)
  return `för ${h} tim sedan`
}
