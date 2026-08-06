'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

// Lets an approved dealer add/remove an auction from their watchlist.
export default function WatchButton({ itemId }: { itemId: string }) {
  const supabase = createClient()
  const [show, setShow] = useState(false)
  const [watched, setWatched] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single()
      if (prof?.role !== 'dealer' || !prof?.approved) return
      setShow(true)
      const { data } = await supabase
        .from('watchlist')
        .select('item_id')
        .eq('dealer_id', user.id)
        .eq('item_id', itemId)
        .maybeSingle()
      setWatched(!!data)
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  if (!show) return null

  const toggle = async () => {
    setBusy(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    if (watched) {
      await supabase.from('watchlist').delete().eq('dealer_id', user.id).eq('item_id', itemId)
      setWatched(false)
    } else {
      await supabase.from('watchlist').insert({ dealer_id: user.id, item_id: itemId })
      setWatched(true)
    }
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition ${
        watched
          ? 'bg-gold-50 border-gold-300 text-gold-700'
          : 'bg-white border-espresso-200 text-espresso-600 hover:border-gold-400 hover:text-gold-700'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={watched ? 'currentColor' : 'none'}>
        <path
          d="M12 21s-7-4.35-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3.2 1.2 4 2.3C10.8 7.2 12 6 14 6c3.5 0 5 3.5 3.5 6.5C19 16.65 12 21 12 21z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {watched ? 'Bevakas' : 'Bevaka auktion'}
    </button>
  )
}
