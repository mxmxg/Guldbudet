'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function AdminPage() {
  const [pendingDealers, setPendingDealers] = useState<any[]>([])
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      const { data: dealers } = await supabase.from('profiles').select('*').eq('role', 'dealer').eq('approved', false).order('created_at', { ascending: false })
      const { data: items } = await supabase.from('items').select('*, profiles(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false })

      setPendingDealers(dealers || [])
      setPendingItems(items || [])
      setLoading(false)
    }
    load()
  }, [])

  const approveDealer = async (id: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('id', id)
    setPendingDealers(prev => prev.filter(d => d.id !== id))
  }

  const rejectDealer = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    setPendingDealers(prev => prev.filter(d => d.id !== id))
  }

  const approveItem = async (id: string) => {
    await supabase.from('items').update({ status: 'active', auction_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', id)
    setPendingItems(prev => prev.filter(i => i.id !== id))
  }

  const rejectItem = async (id: string) => {
    await supabase.from('items').update({ status: 'rejected' }).eq('id', id)
    setPendingItems(prev => prev.filter(i => i.id !== id))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Laddar...</div>

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-medium text-stone-900 mb-8">⚙️ Adminpanel</h1>

        <section className="mb-10">
          <h2 className="text-lg font-medium text-stone-800 mb-4">
            Handlare som väntar på godkännande
            <span className="ml-2 bg-gold-100 text-gold-700 text-sm px-2 py-0.5 rounded-full">{pendingDealers.length}</span>
          </h2>
          {pendingDealers.length === 0 ? (
            <p className="text-stone-400 text-sm">Inga väntande handlare.</p>
          ) : (
            <div className="space-y-3">
              {pendingDealers.map(dealer => (
                <div key={dealer.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-900">{dealer.full_name}</p>
                    <p className="text-sm text-stone-500">{dealer.email}</p>
                    {dealer.company_name && <p className="text-sm text-stone-400">{dealer.company_name}</p>}
                    <p className="text-xs text-stone-300 mt-1">{new Date(dealer.created_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => approveDealer(dealer.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Godkänn</button>
                    <button onClick={() => rejectDealer(dealer.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition">Neka</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 mb-4">
            Föremål som väntar på granskning
            <span className="ml-2 bg-gold-100 text-gold-700 text-sm px-2 py-0.5 rounded-full">{pendingItems.length}</span>
          </h2>
          {pendingItems.length === 0 ? (
            <p className="text-stone-400 text-sm">Inga väntande föremål.</p>
          ) : (
            <div className="space-y-3">
              {pendingItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4">
                  {item.image_urls?.[0] && (
                    <img src={item.image_urls[0]} alt={item.title} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900">{item.title}</p>
                    <p className="text-sm text-stone-500">{item.weight_grams}g · {item.karat}</p>
                    {item.min_price && <p className="text-sm text-stone-500">Minimipris: {item.min_price.toLocaleString('sv-SE')} kr</p>}
                    <p className="text-xs text-stone-400 mt-1">{item.profiles?.full_name} · {item.profiles?.email}</p>
                    {item.description && <p className="text-xs text-stone-400 mt-1 truncate">{item.description}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => approveItem(item.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Godkänn</button>
                    <button onClick={() => rejectItem(item.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition">Neka</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
