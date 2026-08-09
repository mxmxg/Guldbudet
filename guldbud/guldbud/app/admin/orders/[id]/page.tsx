'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OrderStepper from '@/components/OrderStepper'
import OrderChat from '@/components/OrderChat'
import Image from 'next/image'
import Link from 'next/link'
import { ORDER_STEPS, ORDER_STATUS_LABEL, OrderStatus, nextStatus, stepIndex } from '@/lib/orders'
import { formatSEK } from '@/lib/gold'
import { DEALER_COMMISSION_LABEL, commission, totalWithCommission } from '@/lib/fees'

export default function AdminOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [dealer, setDealer] = useState<any>(null)
  const [me, setMe] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [trackingSeller, setTrackingSeller] = useState('')
  const [trackingDealer, setTrackingDealer] = useState('')

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
    setMe(user.id)
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') {
      router.push('/')
      return
    }
    await loadOrder()
    setLoading(false)
    // Markera affärens meddelande-notiser som lästa (rensar badgen).
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .eq('link', `/admin/orders/${params.id}`)
      .ilike('title', '%meddelande%')
      .then(() => {})
  }

  const loadOrder = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('id', params.id).single()
    if (!o) return
    setOrder(o)
    setTrackingSeller(o.tracking_seller || '')
    setTrackingDealer(o.tracking_dealer || '')
    const [{ data: it }, { data: s }, { data: d }] = await Promise.all([
      supabase.from('items').select('*').eq('id', o.item_id).single(),
      supabase.from('profiles').select('*').eq('id', o.seller_id).single(),
      supabase.from('profiles').select('*').eq('id', o.dealer_id).single(),
    ])
    setItem(it)
    setSeller(s)
    setDealer(d)
  }

  const advance = async () => {
    const next = nextStatus(order.status as OrderStatus)
    if (!next) return
    // Säkerhetsspärr: betala aldrig ut säljaren eller skicka vidare till handlaren
    // innan handlarens betalning är registrerad. Inga pengar lämnar huset på kredit.
    if ((next === 'verified_paid' || next === 'shipped_to_dealer') && !order.dealer_paid_at) {
      setSaveError('Registrera handlarens betalning först – vi betalar ut och skickar vidare först när pengarna är inne.')
      return
    }
    setSaving(true)
    setSaveError('')
    const { error } = await supabase
      .from('orders')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    if (error) setSaveError('Kunde inte uppdatera affären: ' + error.message)
    else await loadOrder()
    setSaving(false)
  }

  const setDealerPaid = async (paid: boolean) => {
    setSaving(true)
    setSaveError('')
    const { error } = await supabase
      .from('orders')
      .update({ dealer_paid_at: paid ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    if (error) setSaveError('Kunde inte spara betalningen: ' + error.message)
    else await loadOrder()
    setSaving(false)
  }

  const setStatus = async (status: OrderStatus) => {
    setSaving(true)
    setSaveError('')
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    if (error) setSaveError('Kunde inte uppdatera status: ' + error.message)
    else await loadOrder()
    setSaving(false)
  }

  const saveTracking = async () => {
    setSaving(true)
    setSaveError('')
    const { error } = await supabase
      .from('orders')
      .update({
        tracking_seller: trackingSeller || null,
        tracking_dealer: trackingDealer || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
    if (error) setSaveError('Kunde inte spara spårning: ' + error.message)
    else await loadOrder()
    setSaving(false)
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
          <div className="h-64 rounded-2xl skeleton" />
        </div>
        <Footer />
      </div>
    )
  }

  const status = order.status as OrderStatus
  const next = nextStatus(status)
  const isFinalOrCancelled = status === 'completed' || status === 'cancelled'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="relative overflow-hidden bg-espresso-900 px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto">
          <Link href="/admin/orders" className="text-gold-500/80 text-sm hover:text-gold-300 transition">
            ← Alla affärer
          </Link>
          <h1 className="font-display text-2xl text-gold-100 mt-2">{item?.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 items-center text-sm">
            <span className="chip bg-gold-500/15 text-gold-200 border border-gold-400/25">
              {ORDER_STATUS_LABEL[status]}
            </span>
            <span className="text-gold-200/70">{formatSEK(order.amount)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {saveError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">{saveError}</div>
        )}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: status + controls + parties */}
        <div className="grid gap-6">
          <div className="card p-6">
            <div className="flex gap-4 mb-5">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shrink-0">
                {item?.image_urls?.[0] && (
                  <Image src={item.image_urls[0]} alt={item.title} fill className="object-contain" />
                )}
              </div>
              <div className="text-sm text-espresso-500">
                <p>{item?.category ? `${item.category} · ` : ''}{item?.weight_grams} g · {item?.karat}</p>
                {item?.gemstone && <p>{item.gemstone}{item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}</p>}
                <Link href={`/auctions/${item?.id}`} className="text-gold-600 hover:text-gold-700 transition">
                  Visa auktionen →
                </Link>
              </div>
            </div>
            <OrderStepper status={status} />

            {!isFinalOrCancelled && (
              <div className="mt-5 flex flex-wrap gap-2">
                {next && (
                  <button onClick={advance} disabled={saving} className="btn-gold !py-2">
                    {saving ? '...' : `Markera som ${ORDER_STATUS_LABEL[next]} →`}
                  </button>
                )}
                <button
                  onClick={() => setStatus('cancelled')}
                  disabled={saving}
                  className="text-sm text-red-500 hover:text-red-600 px-3 py-2 transition"
                >
                  Avbryt affär
                </button>
              </div>
            )}
            {status === 'cancelled' && (
              <button onClick={() => setStatus('accepted')} disabled={saving} className="btn-ghost-gold !py-2 mt-5">
                Återöppna affär
              </button>
            )}
          </div>

          {/* Tracking */}
          <div className="card p-6">
            <h2 className="font-display text-lg text-espresso-900 mb-4">Spårningsnummer</h2>
            <label className="block mb-3">
              <span className="block text-xs font-medium text-espresso-500 mb-1.5">Säljare → GuldBud</span>
              <input value={trackingSeller} onChange={(e) => setTrackingSeller(e.target.value)} placeholder="Spårningsnr" />
            </label>
            <label className="block mb-4">
              <span className="block text-xs font-medium text-espresso-500 mb-1.5">GuldBud → handlare</span>
              <input value={trackingDealer} onChange={(e) => setTrackingDealer(e.target.value)} placeholder="Spårningsnr" />
            </label>
            <button onClick={saveTracking} disabled={saving} className="btn-gold !py-2">
              {saving ? 'Sparar...' : 'Spara spårning'}
            </button>
          </div>

          {/* Economy */}
          <div className="card p-6">
            <h2 className="font-display text-lg text-espresso-900 mb-4">Ekonomi</h2>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-espresso-600">
                <span>Handlaren betalar (bud + provision)</span>
                <span className="tabular-nums font-medium">{formatSEK(totalWithCommission(order.amount))}</span>
              </div>
              <div className="flex justify-between text-espresso-600">
                <span>Säljaren får (hela budet)</span>
                <span className="tabular-nums">{formatSEK(order.amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700 pt-2 mt-1 border-t border-espresso-100">
                <span>GuldBuds provision ({DEALER_COMMISSION_LABEL})</span>
                <span className="tabular-nums">{formatSEK(commission(order.amount))}</span>
              </div>
            </div>
            <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-4 text-sm text-gold-600 hover:text-gold-700">
              Visa handlarens faktura →
            </Link>
          </div>

          {/* Handlarens betalning – fristående från logistikstegen */}
          <div className={`card p-6 ${!order.dealer_paid_at && !isFinalOrCancelled ? 'ring-2 ring-gold-300' : ''}`}>
            <h2 className="font-display text-lg text-espresso-900 mb-1">Handlarens betalning</h2>
            {order.dealer_paid_at ? (
              <>
                <p className="text-sm text-emerald-700">
                  Betald ✓ · {new Date(order.dealer_paid_at).toLocaleString('sv-SE')}
                </p>
                <p className="text-xs text-espresso-400 mt-1">
                  Utbetalning till säljare och vidareskick är nu upplåsta.
                </p>
                <button
                  onClick={() => setDealerPaid(false)}
                  disabled={saving}
                  className="mt-3 text-xs text-espresso-400 hover:text-red-500 transition"
                >
                  Ångra (markera som obetald)
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-espresso-500 mb-3 leading-relaxed">
                  Väntar på {formatSEK(totalWithCommission(order.amount))}. Registrera betalningen när pengarna
                  kommit in. Utbetalning till säljaren och vidareskick är låsta tills dess.
                </p>
                <button onClick={() => setDealerPaid(true)} disabled={saving} className="btn-gold !py-2">
                  {saving ? '...' : 'Registrera handlarens betalning'}
                </button>
              </>
            )}
          </div>

          {/* Parties (real details, admin only) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <PartyCard title="Säljare" p={seller} />
            <PartyCard title="Vinnande handlare" p={dealer} />
          </div>
        </div>

        {/* Right: both chat threads */}
        <div className="grid gap-6 content-start">
          <OrderChat
            orderId={order.id}
            party="seller"
            meId={me}
            isAdmin
            counterpartLabel={seller?.full_name || 'säljaren'}
          />
          <OrderChat
            orderId={order.id}
            party="dealer"
            meId={me}
            isAdmin
            counterpartLabel={dealer?.company_name || dealer?.full_name || 'handlaren'}
          />
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}

function PartyCard({ title, p }: { title: string; p: any }) {
  if (!p) return null
  return (
    <div className="card p-4 text-sm">
      <p className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-2">{title}</p>
      <p className="font-medium text-espresso-900">{p.company_name || p.full_name}</p>
      {p.company_name && <p className="text-espresso-500">{p.full_name}</p>}
      {p.org_number && <p className="text-espresso-500">Org.nr: {p.org_number}</p>}
      {p.email && <p className="text-espresso-500 break-all">{p.email}</p>}
      {p.phone && <p className="text-espresso-500">{p.phone}</p>}
      {(p.address || p.city) && (
        <p className="text-espresso-500">
          {p.address}
          {p.postal_code || p.city ? `, ${p.postal_code || ''} ${p.city || ''}` : ''}
        </p>
      )}
      {p.payout_method && (
        <p className="mt-2 pt-2 border-t border-espresso-100 text-espresso-700">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-wide">Utbetalning</span>
          <br />
          {p.payout_method === 'swish'
            ? `Swish: ${p.payout_swish || '— (ej ifyllt)'}`
            : `Bank: ${p.payout_bank_clearing || '—'} / ${p.payout_bank_account || '— (ej ifyllt)'}`}
        </p>
      )}
    </div>
  )
}
