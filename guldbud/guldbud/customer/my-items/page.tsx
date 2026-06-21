'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Image from 'next/image'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Väntar på granskning', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Godkänd', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Auktion pågår', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Avslutad', color: 'bg-stone-100 text-stone-500' },
  rejected: { label: 'Avvisad', color: 'bg-red-100 text-red-600' },
}

export default function MyItemsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-stone-900">Mina föremål</h1>
          <button onClick={() => router.push('/customer/submit')}
            className="btn-gold text-sm">+ Lägg ut nytt</button>
        </div>

        {loading ? (
          <p className="text-stone-400 text-center py-10">Laddar...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-stone-200 rounded-xl text-stone-400">
            <p className="mb-3">Du har inte lagt ut några föremål ännu.</p>
            <button onClick={() => router.push('/customer/submit')} className="btn-gold">Lägg ut ditt första föremål</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map(item => {
              const s = STATUS_LABEL[item.status] || { label: item.status, color: 'bg-stone-100 text-stone-500' }
              return (
                <div key={item.id} className="bg-white border border-stone-200 rounded-xl flex gap-4 p-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gold-900 to-gold-700 relative">
                    {item.image_urls?.[0] && <Image src={item.image_urls[0]} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-stone-900">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-stone-400 mb-2">{item.weight_grams} g · {item.karat}</p>
                    {item.min_price && <p className="text-xs text-stone-500">Minimipris: {item.min_price.toLocaleString('sv-SE')} kr</p>}
                    <p className="text-xs text-stone-300 mt-1">{new Date(item.created_at).toLocaleDateString('sv-SE')}</p>
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
