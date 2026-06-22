'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function BidSection({ itemId, currentTop }: { itemId: string; currentTop: number }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: prof } = await supabase.from('profiles').select('role, approved').eq('id', data.user.id).single()
        setRole(prof?.role ?? null)
        setApproved(prof?.approved ?? false)
      }
      setChecked(true)
    })
  }, [])

  const place = async () => {
    const val = parseInt(amount)
    if (!val || val <= currentTop) {
      setMsg(`Budet måste vara högre än ${currentTop.toLocaleString('sv-SE')} kr`)
      return
    }
    setLoading(true)
    const { error } = await supabase.from('bids').insert({ item_id: itemId, dealer_id: (await supabase.auth.getUser()).data.user?.id, amount: val })
    if (error) setMsg(error.message)
    else { setMsg('Budet är lagt! ✓'); setAmount(''); router.refresh() }
    setLoading(false)
  }

  if (!checked) return null

  if (!role) {
    return (
      <div className="bg-stone-50 rounded-xl p-4 text-center">
        <p className="text-stone-500 text-sm mb-3">Logga in för att lägga bud</p>
        <Link href="/auth/login" className="btn-gold inline-block">Logga in</Link>
      </div>
    )
  }

  if (role === 'customer' || role === 'admin') {
    return (
      <div className="bg-stone-50 rounded-xl p-4">
        <p className="text-stone-500 text-sm">Endast auktoriserade guldhandlare kan lägga bud.</p>
      </div>
    )
  }

  if (!approved) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-700 text-sm font-medium">Ditt handlarkonto väntar på godkännande.</p>
        <p className="text-amber-600 text-xs mt-1">Du får ett mejl när du är godkänd och kan börja buda.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`Bud över ${(currentTop + 100).toLocaleString('sv-SE')} kr`}
          className="flex-1"
        />
        <button onClick={place} disabled={loading} className="btn-gold">
          {loading ? '...' : 'Lägg bud'}
        </button>
      </div>
      {msg && <p className={`text-sm mt-2 ${msg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  )
}
