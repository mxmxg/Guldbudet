'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { ORDER_STATUS_LABEL, ORDER_STEPS, OPEN_ORDER_STATES, OrderStatus, stepIndex } from '@/lib/orders'
import { formatSEK } from '@/lib/gold'

const OPEN_STATES = OPEN_ORDER_STATES

export default function AdminOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'done'>('open')

  // Öppna direkt på "Avslutade" när man kommer från "Slutförda affärer".
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'done') {
      setTab('done')
    }
  }, [])

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') {
      router.push('/')
      return
    }
    const { data: os } = await supabase
      .from('orders')
      .select('*, items(title, image_urls), seller:profiles!orders_seller_id_fkey(full_name), dealer:profiles!orders_dealer_id_fkey(company_name, full_name)')
      .order('created_at', { ascending: false })
    setOrders(os || [])
    setLoading(false)
  }

  const shown = orders.filter((o) =>
    tab === 'open' ? OPEN_STATES.includes(o.status) : o.status === 'completed' || o.status === 'cancelled'
  )
  const openCount = orders.filter((o) => OPEN_STATES.includes(o.status)).length

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="relative overflow-hidden bg-espresso-900 px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto">
          <Link href="/admin" className="text-gold-500/80 text-sm hover:text-gold-300 transition">← Adminpanel</Link>
          <h1 className="font-display text-2xl text-gold-100 mt-2">Affärer</h1>
          <p className="text-gold-200/70 text-sm mt-1">{openCount} pågående affärer att hantera.</p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex gap-1 bg-white border border-espresso-100 p-1 rounded-xl w-fit mb-6 shadow-soft">
          {(['open', 'done'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-gold-sheen text-espresso-900 shadow-gold' : 'text-espresso-500 hover:text-espresso-800'
              }`}
            >
              {t === 'open' ? 'Pågående' : 'Avslutade'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}</div>
        ) : shown.length === 0 ? (
          <div className="card p-16 text-center text-espresso-400">Inga affärer här.</div>
        ) : (
          <div className="grid gap-3">
            {shown.map((o) => {
              const idx = stepIndex(o.status as OrderStatus)
              const pct = o.status === 'cancelled' ? 0 : Math.round(((idx + 1) / ORDER_STEPS.length) * 100)
              return (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="card card-hover p-4 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shrink-0">
                    {o.items?.image_urls?.[0] && (
                      <Image src={o.items.image_urls[0]} alt="" fill className="object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-espresso-900 truncate">{o.items?.title}</p>
                      <span className="chip bg-espresso-100 text-espresso-600">{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span>
                    </div>
                    <p className="text-xs text-espresso-400 mt-0.5">
                      {o.seller?.full_name} → {o.dealer?.company_name || o.dealer?.full_name}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-espresso-100 overflow-hidden max-w-xs">
                      <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gold-700 tabular-nums">{formatSEK(o.amount)}</p>
                    <span className="text-sm text-gold-600">Öppna →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
