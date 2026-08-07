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
import { ORDER_STATUS_LABEL, OrderStatus } from '@/lib/orders'
import { formatSEK } from '@/lib/gold'
import { DEALER_COMMISSION_LABEL, commission, totalWithCommission, PAYMENT_WINDOW_LABEL } from '@/lib/fees'

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [me, setMe] = useState<string>('')
  const [party, setParty] = useState<'seller' | 'dealer' | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

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
    if (prof?.role === 'admin') {
      router.replace(`/admin/orders/${params.id}`)
      return
    }

    const { data: o } = await supabase.from('orders').select('*').eq('id', params.id).single()
    if (!o) {
      setDenied(true)
      setLoading(false)
      return
    }
    setOrder(o)
    setParty(o.seller_id === user.id ? 'seller' : o.dealer_id === user.id ? 'dealer' : null)

    // Öppna affären → markera dess meddelande-notiser som lästa (rensar badgen).
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .eq('link', `/orders/${params.id}`)
      .ilike('title', '%meddelande%')
      .then(() => {})

    const { data: it } = await supabase
      .from('items')
      .select('id, title, image_urls, weight_grams, karat, category')
      .eq('id', o.item_id)
      .single()
    setItem(it)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
          <div className="h-64 rounded-2xl skeleton" />
        </div>
        <Footer />
      </div>
    )
  }

  if (denied || !order || !party) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-20 text-center">
          <p className="font-display text-2xl text-espresso-900 mb-2">Affären hittades inte</p>
          <p className="text-espresso-500 text-sm mb-6">Du har inte tillgång till den här affären.</p>
          <Link href="/" className="btn-gold">Till startsidan</Link>
        </div>
        <Footer />
      </div>
    )
  }

  const status = order.status as OrderStatus

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="relative overflow-hidden bg-espresso-900 px-4 py-10">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-gold-500/80 mb-1">Affär</p>
          <h1 className="font-display text-3xl text-gold-100">{item?.title || 'Föremål'}</h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center text-sm">
            <span className="chip bg-gold-500/15 text-gold-200 border border-gold-400/25">
              {ORDER_STATUS_LABEL[status]}
            </span>
            <span className="text-gold-200/70">Belopp: {formatSEK(order.amount)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 grid gap-6">
        {/* Item + stepper */}
        <div className="card p-6 grid sm:grid-cols-[auto_1fr] gap-6">
          <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shrink-0">
            {item?.image_urls?.[0] && (
              <Image src={item.image_urls[0]} alt={item.title} fill className="object-contain" />
            )}
          </div>
          <div>
            <p className="text-xs text-espresso-400 mb-4">
              {item?.category ? `${item.category} · ` : ''}
              {item?.weight_grams} g · {item?.karat}
            </p>
            <OrderStepper status={status} />
          </div>
        </div>

        {/* Party-specific info */}
        {party === 'seller' ? (
          <SellerPanel order={order} />
        ) : (
          <DealerPanel order={order} />
        )}

        {/* Chat */}
        <OrderChat orderId={order.id} party={party} meId={me} isAdmin={false} counterpartLabel="GuldBud" />
      </div>
      <Footer />
    </div>
  )
}

function SellerPanel({ order }: { order: any }) {
  const needsShipping = order.status === 'accepted'
  return (
    <div className="card p-6">
      {needsShipping ? (
        <>
          <h2 className="font-display text-lg text-espresso-900 mb-1">Nästa steg: skicka föremålet</h2>
          <p className="text-sm text-espresso-500 mb-4">
            Packa föremålet omsorgsfullt och skicka det rekommenderat och försäkrat till oss. Skriv
            gärna spårningsnumret i chatten nedan.
          </p>
          <div className="rounded-xl bg-espresso-900 p-4 text-center">
            <p className="text-gold-500/70 text-xs tracking-widest uppercase mb-1">Skicka till</p>
            <p className="text-gold-200 font-medium">GuldBud AB</p>
            <p className="text-gold-200/80 text-sm">Storgatan 1, 111 22 Stockholm</p>
          </div>
        </>
      ) : (
        <>
          <h2 className="font-display text-lg text-espresso-900 mb-1">Status</h2>
          <p className="text-sm text-espresso-500">
            {order.status === 'shipped_by_seller' && 'Vi väntar på att ditt föremål ska komma fram.'}
            {order.status === 'received' && 'Vi har tagit emot föremålet och kontrollerar äktheten.'}
            {order.status === 'dealer_paid' && 'Handlaren har betalat – din utbetalning förbereds nu.'}
            {order.status === 'verified_paid' && 'Godkänt! Din betalning är på väg via Swish.'}
            {(order.status === 'shipped_to_dealer' || order.status === 'completed') &&
              'Affären är klar. Tack för att du sålde via GuldBud!'}
          </p>
          {['verified_paid', 'shipped_to_dealer', 'completed'].includes(order.status) && (
            <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
              Visa utbetalningsspecifikation →
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function DealerPanel({ order }: { order: any }) {
  const awaitingPayment = order.status === 'received'
  const paid = ['dealer_paid', 'verified_paid', 'shipped_to_dealer', 'completed'].includes(order.status)
  return (
    <>
      <div className={`card p-6 ${awaitingPayment ? 'ring-2 ring-gold-300' : ''}`}>
        <h2 className="font-display text-lg text-espresso-900 mb-3">Att betala</h2>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-espresso-600">
            <span>Vinnande bud</span>
            <span className="tabular-nums">{formatSEK(order.amount)}</span>
          </div>
          <div className="flex justify-between text-espresso-600">
            <span>Provision {DEALER_COMMISSION_LABEL}</span>
            <span className="tabular-nums">+{formatSEK(commission(order.amount))}</span>
          </div>
          <div className="flex justify-between font-semibold text-espresso-900 pt-2 mt-1 border-t border-espresso-100">
            <span>Ditt totalpris</span>
            <span className="tabular-nums">{formatSEK(totalWithCommission(order.amount))}</span>
          </div>
        </div>
        {awaitingPayment && (
          <div className="mt-4 rounded-xl bg-gold-50 border border-gold-200 p-4 text-sm">
            <p className="font-medium text-gold-800">Dags att betala</p>
            <p className="text-espresso-600 mt-1 leading-relaxed">
              Föremålet är mottaget och kontrollerat. Betala inom <span className="font-medium">{PAYMENT_WINDOW_LABEL}</span> så
              skickar vi det till dig. Betalningsinstruktioner finns i meddelandena nedan – hör av dig där om något är oklart.
            </p>
          </div>
        )}
        {paid && <p className="mt-3 text-sm text-emerald-700">Betalning registrerad ✓</p>}
        {(awaitingPayment || paid) && (
          <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
            Visa faktura →
          </Link>
        )}
      </div>
      <div className="card p-6">
        <h2 className="font-display text-lg text-espresso-900 mb-1">Status</h2>
        <p className="text-sm text-espresso-500">
          {(order.status === 'accepted' || order.status === 'shipped_by_seller') &&
            'Inget du behöver göra just nu – vi hör av oss så fort föremålet är mottaget och kontrollerat.'}
          {order.status === 'received' && 'Föremålet är kontrollerat. Betala så skickar vi det vidare till dig.'}
          {order.status === 'dealer_paid' && 'Tack för din betalning! Vi förbereder leverans till dig.'}
          {order.status === 'verified_paid' && 'Säljaren är utbetald och föremålet packas för leverans till dig.'}
          {order.status === 'shipped_to_dealer' &&
            `Föremålet är skickat till dig.${order.tracking_dealer ? ` Spårningsnummer: ${order.tracking_dealer}.` : ''}`}
          {order.status === 'completed' && 'Affären är slutförd. Tack!'}
        </p>
      </div>
    </>
  )
}
