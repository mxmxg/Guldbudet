'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'

type Thread = {
  orderId: string
  href: string
  title: string
  image: string | null
  preview: string
  fromMe: boolean
  at: string
  unread: boolean
}

function time(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

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
    const isAdmin = prof?.role === 'admin'

    // Affärer man är part i (eller alla, som admin).
    let ordersQuery = supabase
      .from('orders')
      .select('id, item_id, seller_id, dealer_id, items(title, image_urls)')
      .order('created_at', { ascending: false })
    if (!isAdmin) ordersQuery = ordersQuery.or(`seller_id.eq.${user.id},dealer_id.eq.${user.id}`)
    const { data: orders } = await ordersQuery
    const orderList = orders || []
    if (orderList.length === 0) {
      setLoading(false)
      return
    }

    const ids = orderList.map((o: any) => o.id)
    // RLS visar bara de trådar användaren får se (sin egen part, eller allt som admin).
    const { data: messages } = await supabase
      .from('order_messages')
      .select('order_id, body, created_at, sender_id')
      .in('order_id', ids)
      .order('created_at', { ascending: false })

    // Senaste meddelandet per affär.
    const latest: Record<string, any> = {}
    ;(messages || []).forEach((m: any) => {
      if (!latest[m.order_id]) latest[m.order_id] = m
    })

    // Olästa: notiser om meddelanden som ännu inte lästs.
    const { data: notifs } = await supabase
      .from('notifications')
      .select('link')
      .eq('user_id', user.id)
      .eq('read', false)
      .ilike('title', '%meddelande%')
    const unreadLinks = new Set((notifs || []).map((n: any) => n.link))

    const list: Thread[] = orderList
      .filter((o: any) => latest[o.id])
      .map((o: any) => {
        const href = isAdmin ? `/admin/orders/${o.id}` : `/orders/${o.id}`
        const m = latest[o.id]
        return {
          orderId: o.id,
          href,
          title: o.items?.title || 'Affär',
          image: o.items?.image_urls?.[0] || null,
          preview: m.body,
          fromMe: m.sender_id === user.id,
          at: m.created_at,
          unread: unreadLinks.has(href),
        }
      })
      .sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1
        return new Date(b.at).getTime() - new Date(a.at).getTime()
      })

    setThreads(list)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-3xl mx-auto px-4 py-10">
          <p className="eyebrow text-gold-500/80 mb-1">Meddelanden</p>
          <h1 className="font-display text-3xl text-gold-100">Dina konversationer</h1>
          <p className="text-gold-200/70 text-sm mt-1">All kontakt sker tryggt via GuldBud, kopplad till din affär.</p>
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl skeleton" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-espresso-500">Du har inga meddelanden än.</p>
            <p className="text-sm text-espresso-400 mt-1">
              När du har en affär kan du och GuldBud skriva till varandra här.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {threads.map((t) => (
              <Link
                key={t.orderId}
                href={t.href}
                className="card card-hover p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shrink-0">
                  {t.image && <Image src={t.image} alt="" fill className="object-contain" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate ${t.unread ? 'font-semibold text-espresso-900' : 'font-medium text-espresso-800'}`}>
                      {t.title}
                    </p>
                    {t.unread && <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
                  </div>
                  <p className={`text-sm truncate ${t.unread ? 'text-espresso-600' : 'text-espresso-400'}`}>
                    {t.fromMe ? 'Du: ' : ''}
                    {t.preview}
                  </p>
                </div>
                <span className="text-xs text-espresso-300 shrink-0">{time(t.at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
