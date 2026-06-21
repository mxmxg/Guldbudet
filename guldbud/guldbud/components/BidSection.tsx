'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function BidSection({ itemId, currentTop }: { itemId: string; currentTop: number }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const place = async () => {
    const val = parseInt(amount)
    if (!val || val <= currentTop) {
      setMsg(`Budet måste vara högre än ${currentTop.toLocaleString('sv-SE')} kr`)
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login?role=dealer'); return }

    const { data: prof } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single()
    if (prof?.role !== 'dealer') { setMsg('Bara guldhandlare kan lägga bud.'); setLoading(false); return }
    if (!prof?.approved) { setMsg('Ditt konto väntar på godkännande.'); setLoading(false); return }

    const { error } = await supabase.from('bids').insert({ item_id: itemId, dealer_id: user.id, amount: val })
    if (error) setMsg(error.message)
    else { setMsg('Budet är lagt! ✓'); setAmount(''); router.refresh() }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder={`Bud över ${(currentTop + 100).toLocaleString('sv-SE')} kr`}
          className="flex-1" />
        <button onClick={place} disabled={loading} className="btn-gold">
          {loading ? '...' : 'Lägg bud'}
        </button>
      </div>
      {msg && <p className={`text-sm mt-2 ${msg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
      <p className="text-xs text-stone-400 mt-2">Inloggad som guldhandlare krävs för att buda.</p>
    </div>
  )
}
