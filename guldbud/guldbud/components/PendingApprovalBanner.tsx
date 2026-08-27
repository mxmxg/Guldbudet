'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { formatSEK } from '@/lib/gold'

// Gul uppmaningsbanner: visas för säljaren när en egen auktion har avslutats med
// minst ett bud men ännu inte godkänts (status 'active', sluttid passerad).
// Länkar rakt till auktionssidan där godkänn-knappen finns, så steget inte missas.
type Pending = { id: string; title: string; topBid: number }

export default function PendingApprovalBanner() {
  const supabase = createClient()
  const [pending, setPending] = useState<Pending[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      // Egna föremål vars auktion tagit slut men som fortfarande är öppna (ej
      // godkända/stängda). Godkända blir status 'closed' och faller bort här.
      const { data: items } = await supabase
        .from('items')
        .select('id, title')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .not('auction_ends_at', 'is', null)
        .lte('auction_ends_at', new Date().toISOString())
      if (!items || items.length === 0) return

      const ids = items.map((i: any) => i.id)
      const { data: bids } = await supabase.from('bids').select('item_id, amount').in('item_id', ids)
      const top: Record<string, number> = {}
      bids?.forEach((b: any) => {
        if (!top[b.item_id] || b.amount > top[b.item_id]) top[b.item_id] = b.amount
      })

      // Bara föremål som faktiskt fått bud går att godkänna.
      const rows: Pending[] = items
        .filter((i: any) => top[i.id])
        .map((i: any) => ({ id: i.id, title: i.title, topBid: top[i.id] }))
      if (alive) setPending(rows)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (pending.length === 0) return null

  return (
    <div className="mb-6 rounded-2xl border border-gold-300 bg-gold-50 p-5 ring-1 ring-gold-200">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-gold-500 text-white grid place-items-center text-lg">✓</div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-espresso-900">
            {pending.length === 1 ? 'Du har ett bud att godkänna' : `Du har ${pending.length} bud att godkänna`}
          </p>
          <p className="text-sm text-espresso-600 mb-3">
            Budgivningen är avslutad. Öppna föremålet för att se budet och välja om du vill sälja.
          </p>
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <Link
                key={p.id}
                href={`/auctions/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-white border border-gold-200 px-4 py-3 hover:border-gold-400 transition"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-espresso-900">{p.title}</span>
                  <span className="text-xs text-espresso-500">Högsta bud: {formatSEK(p.topBid)}</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-gold-700">Granska budet →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
