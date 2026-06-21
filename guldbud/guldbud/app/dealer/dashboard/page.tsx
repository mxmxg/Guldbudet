'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Item, Bid } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Image from 'next/image'

export default function DealerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [myBids, setMyBids] = useState<Record<string, number>>({})
  const [topBids, setTopBids] = useState<Record<string, number>>({})
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tab, setTab] = useState<'active' | 'mybids'>('active')

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login?role=dealer'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'dealer') { router.push('/'); return }
    if (!prof.approved) { router.push('/auth/pending'); return }
    setProfile(prof)

    const { data: activeItems } = await supabase
      .from('items').select('*, profiles(full_name)')
      .eq('status', 'active').order('auction_ends_at', { ascending: true })
    setItems(activeItems || [])

    // Top bids per item
    if (activeItems && activeItems.length > 0) {
      const itemIds = activeItems.map((i: Item) => i.id)
      const { data: bids } = await supabase.from('bids').select('item_id, amount').in('item_id', itemIds).order('amount', { ascending: false })
      const top: Record<string, number> = {}
      bids?.forEach((b: any) => { if (!top[b.item_id] || b.amount > top[b.item_id]) top[b.item_id] = b.amount })
      setTopBids(top)

      // My bids
      const { data: mine } = await supabase.from('bids').select('item_id, amount').eq('dealer_id', user.id)
      const my: Record<string, number> = {}
      mine?.forEach((b: any) => { if (!my[b.item_id] || b.amount > my[b.item_id]) my[b.item_id] = b.amount })
      setMyBids(my)
    }
    setLoading(false)
  }

  const placeBid = async (itemId: string) => {
    const amount = parseInt(bidInputs[itemId] || '0')
    const currentTop = topBids[itemId] || 0
    if (!amount || amount <= currentTop) {
      alert(`Budet måste vara minst ${(currentTop + 1).toLocaleString('sv-SE')} kr`)
      return
    }
    setBidding(itemId)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('bids').insert({ item_id: itemId, dealer_id: user!.id, amount })
    if (error) { alert(error.message) }
    else {
      setTopBids(prev => ({ ...prev, [itemId]: amount }))
      setMyBids(prev => ({ ...prev, [itemId]: amount }))
      setBidInputs(prev => ({ ...prev, [itemId]: '' }))
    }
    setBidding(null)
  }

  const displayItems = tab === 'mybids' ? items.filter(i => myBids[i.id]) : items

  return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-stone-900">Dashboard</h1>
            {profile && <p className="text-stone-500 text-sm">{profile.company_name || profile.full_name}</p>}
          </div>
          <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
            {(['active', 'mybids'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                {t === 'active' ? 'Alla auktioner' : 'Mina bud'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-400">Laddar auktioner...</div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-16 text-stone-400 border border-dashed border-stone-200 rounded-xl">
            {tab === 'mybids' ? 'Du har inte lagt några bud ännu.' : 'Inga aktiva auktioner just nu.'}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayItems.map(item => {
              const top = topBids[item.id] || 0
              const mine = myBids[item.id]
              const isWinning = mine && mine === top
              return (
                <div key={item.id} className={`bg-white border rounded-xl overflow-hidden flex ${isWinning ? 'border-green-300' : 'border-stone-200'}`}>
                  <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-gold-900 to-gold-700 relative">
                    {item.image_urls?.[0] && <Image src={item.image_urls[0]} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-stone-900">{item.title}</h3>
                        {isWinning && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Bästa bud</span>}
                        {mine && !isWinning && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Överbudat</span>}
                      </div>
                      <p className="text-xs text-stone-400 mb-2">{item.weight_grams} g · {item.karat}</p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-stone-400">Högsta: </span>
                          <span className="font-medium text-gold-600">{top ? top.toLocaleString('sv-SE') + ' kr' : '—'}</span>
                        </div>
                        {mine && (
                          <div>
                            <span className="text-stone-400">Mitt: </span>
                            <span className="font-medium">{mine.toLocaleString('sv-SE')} kr</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="number" value={bidInputs[item.id] || ''}
                        onChange={e => setBidInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder={`Min ${(top + 100).toLocaleString('sv-SE')} kr`}
                        className="w-36 text-sm" />
                      <button onClick={() => placeBid(item.id)} disabled={bidding === item.id}
                        className="btn-gold whitespace-nowrap">
                        {bidding === item.id ? '...' : 'Lägg bud'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
