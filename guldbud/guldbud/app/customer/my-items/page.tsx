'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Väntar på granskning', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Godkänd', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Auktion pågår', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Avslutad', color: 'bg-espresso-100 text-espresso-500' },
  rejected: { label: 'Avvisad', color: 'bg-red-100 text-red-600' },
}

export default function MyItemsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="eyebrow text-gold-600">Din portfölj</span>
            <h1 className="font-display text-3xl text-espresso-900 mt-1">Mina föremål</h1>
          </div>
          <Link href="/customer/submit" className="btn-gold">
            + Lägg ut nytt
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 rounded-2xl skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-4 text-3xl animate-float">
              ✨
            </div>
            <p className="text-espresso-500 mb-5">Du har inte lagt ut några föremål ännu.</p>
            <Link href="/customer/submit" className="btn-gold">
              Lägg ut ditt första föremål
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const s = STATUS_LABEL[item.status] || {
                label: item.status,
                color: 'bg-espresso-100 text-espresso-500',
              }
              const clickable = item.status === 'active' || item.status === 'closed'
              const Wrapper: any = clickable ? Link : 'div'
              return (
                <Wrapper
                  key={item.id}
                  {...(clickable ? { href: `/auctions/${item.id}` } : {})}
                  className={`card p-4 flex gap-4 items-center ${clickable ? 'card-hover' : ''}`}
                >
                  <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-800 to-espresso-600 relative">
                    {item.image_urls?.[0] && (
                      <Image src={item.image_urls[0]} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-espresso-900">{item.title}</h3>
                      <span className={`chip ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-espresso-400 mb-1.5">
                      {item.weight_grams} g · {item.karat}
                    </p>
                    {item.min_price && (
                      <p className="text-xs text-espresso-500">
                        Minimipris: {item.min_price.toLocaleString('sv-SE')} kr
                      </p>
                    )}
                    <p className="text-[11px] text-espresso-300 mt-1">
                      {new Date(item.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  {clickable && (
                    <span className="text-sm text-gold-600 shrink-0 hidden sm:inline">Se auktion →</span>
                  )}
                </Wrapper>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
