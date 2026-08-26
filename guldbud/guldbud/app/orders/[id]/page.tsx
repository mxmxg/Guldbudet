'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OrderStepper from '@/components/OrderStepper'
import OrderChat from '@/components/OrderChat'
import DisputePanel from '@/components/DisputePanel'
import TrustpilotInvite from '@/components/TrustpilotInvite'
import Image from 'next/image'
import Link from 'next/link'
import { ORDER_STATUS_LABEL, OrderStatus } from '@/lib/orders'
import { formatSEK } from '@/lib/gold'
import { DEALER_COMMISSION_LABEL, DEALER_SHIPPING_FEE, commission, dealerTotal } from '@/lib/fees'

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

    // Explicita kolumner (inte '*') så interna admin-fält (admin_notes,
    // cancel_reason) aldrig når säljar-/handlarvyn.
    const { data: o } = await supabase
      .from('orders')
      .select(
        'id, item_id, seller_id, dealer_id, amount, status, dealer_paid_at, payment_due_at, tracking_dealer, order_no, created_at, refunded_at, refund_reason'
      )
      .eq('id', params.id)
      .single()
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

        {/* Retur/kreditering – föremålet godkändes inte vid kontroll */}
        {order.refunded_at && (
          <div className="card p-6 border border-amber-200 bg-amber-50">
            <h2 className="font-display text-lg text-amber-800 mb-1">Affären återgick</h2>
            <p className="text-sm text-espresso-600 leading-relaxed">
              {party === 'seller'
                ? `Vid vår kontroll stämde inte uppgifterna${order.refund_reason ? ` (${order.refund_reason})` : ''}, så affären kunde inte slutföras. Vi skickar tillbaka föremålet till dig.`
                : `Föremålet godkändes inte vid vår äkthetskontroll${order.refund_reason ? ` (${order.refund_reason})` : ''}. Affären återgår och beloppet återbetalas till dig.`}
            </p>
            {party === 'dealer' && (
              <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
                Visa kreditfaktura →
              </Link>
            )}
          </div>
        )}

        {/* Party-specific info */}
        {party === 'seller' ? (
          <SellerPanel order={order} />
        ) : (
          <DealerPanel order={order} />
        )}

        {/* Betygsätt oss – vid det bästa tillfället, precis efter avslutad affär */}
        {party === 'seller' &&
          ['verified_paid', 'shipped_to_dealer', 'completed'].includes(order.status) && (
            <TrustpilotInvite />
          )}

        {/* Chat */}
        <OrderChat orderId={order.id} party={party} meId={me} isAdmin={false} counterpartLabel="GuldBud" />

        {/* Ärenden / tvistehantering */}
        <DisputePanel orderId={order.id} party={party} meId={me} />
      </div>
      <Footer />
    </div>
  )
}

function SellerPanel({ order }: { order: any }) {
  const needsShipping = order.status === 'accepted'
  return (
    <div className={`card p-6 ${needsShipping ? 'ring-2 ring-gold-300' : ''}`}>
      {needsShipping ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="chip bg-gold-100 text-gold-800 border border-gold-200">Din tur</span>
          </div>
          <h2 className="font-display text-xl text-espresso-900 mb-1">Skicka in föremålet nu</h2>
          <p className="text-sm text-espresso-500 mb-5 leading-relaxed">
            Budet är accepterat och affären är din. Så fort du godkänt ditt slutpris skickar vi dig ett kostnadsfritt,
            rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Lägg föremålet i det och posta det rekommenderat.
            Ju snabbare det är på väg, desto snabbare får du betalt.
          </p>

          <ol className="grid gap-3 mb-5">
            {[
              'Linda in föremålet väl, gärna i bubbelplast, och lägg det i det kostnadsfria rekommenderade brevet vi skickar dig.',
              'Posta brevet rekommenderat. Porto och adress är redan klara och försändelsen är försäkrad upp till 100 000 kr.',
              'Skriv spårningsnumret i meddelandena längst ner så vi kan följa försändelsen.',
            ].map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-espresso-700">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gold-500 text-white grid place-items-center text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{t}</span>
              </li>
            ))}
          </ol>

          <div className="rounded-xl bg-espresso-900 p-4 text-center">
            <p className="text-gold-500/70 text-xs tracking-widest uppercase mb-1">Frakt</p>
            <p className="text-gold-200 font-medium">Kostnadsfritt rekommenderat brev</p>
            <p className="text-gold-200/80 text-sm">Förbetalt porto och adress, försäkrat upp till 100 000 kr. Skickas när du godkänt ditt slutpris.</p>
          </div>
          <p className="text-xs text-espresso-400 mt-3 leading-relaxed">
            Så fort vi tar emot och äkthetskontrollerat föremålet betalar vi ut hela budet till dig. Har
            du frågor innan du postar, skriv i meddelandena nedan.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-display text-lg text-espresso-900 mb-1">Status</h2>
          <p className="text-sm text-espresso-500">
            {order.status === 'shipped_by_seller' && 'Vi väntar på att ditt föremål ska komma fram.'}
            {order.status === 'received' && 'Vi har tagit emot föremålet och kontrollerar äktheten.'}
            {order.status === 'dealer_paid' && 'Vi förbereder din utbetalning nu.'}
            {order.status === 'verified_paid' && 'Godkänt! Din utbetalning är på väg till ditt konto.'}
            {(order.status === 'shipped_to_dealer' || order.status === 'completed') &&
              'Affären är klar. Tack för att du sålde via GuldBud!'}
            {order.status === 'cancelled' && !order.refunded_at &&
              'Affären kunde tyvärr inte slutföras och har avbrutits. Har du frågor, skriv i meddelandena nedan.'}
          </p>
          {['verified_paid', 'shipped_to_dealer', 'completed'].includes(order.status) && (
            <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
              Visa avräkningsnota →
            </Link>
          )}
        </>
      )}
    </div>
  )
}

// Startar en A2A-betalning (Brite som första leverantör). Skickar dealern till
// leverantörens hostade betalsida. Servern svarar 503 payments_not_configured
// tills betalnycklarna är på plats, och då visar vi bara en lugn notis och
// låter den befintliga omgående-texten stå kvar som fallback.
function PayNowButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [notConfigured, setNotConfigured] = useState(false)
  const [error, setError] = useState('')

  const pay = async () => {
    setLoading(true)
    setError('')
    setNotConfigured(false)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (res.status === 503) {
        setNotConfigured(true)
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.redirectUrl) {
        setError('Betalningen kunde inte startas just nu. Försök igen om en stund.')
        return
      }
      window.location.href = data.redirectUrl
    } catch {
      setError('Betalningen kunde inte startas just nu. Försök igen om en stund.')
    } finally {
      setLoading(false)
    }
  }

  if (notConfigured) {
    return <p className="mt-4 text-xs text-espresso-400">Onlinebetalning aktiveras inom kort.</p>
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={pay} disabled={loading} className="btn-gold w-full sm:w-auto disabled:opacity-60">
        {loading ? 'Öppnar betalning…' : 'Betala nu'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function DealerPanel({ order }: { order: any }) {
  const paid = !!order.dealer_paid_at
  const awaitingPayment = !paid && order.status !== 'cancelled'
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
          <div className="flex justify-between text-espresso-600">
            <span>Frakt</span>
            <span className="tabular-nums">+{formatSEK(DEALER_SHIPPING_FEE)}</span>
          </div>
          <div className="flex justify-between font-semibold text-espresso-900 pt-2 mt-1 border-t border-espresso-100">
            <span>Ditt totalpris</span>
            <span className="tabular-nums">{formatSEK(dealerTotal(order.amount))}</span>
          </div>
        </div>
        {awaitingPayment && (() => {
          const due = order.payment_due_at ? new Date(order.payment_due_at) : null
          const overdue = due ? due.getTime() < Date.now() : false
          return (
            <div className={`mt-4 rounded-xl p-4 text-sm border ${overdue ? 'bg-red-50 border-red-200' : 'bg-gold-50 border-gold-200'}`}>
              <p className={`font-medium ${overdue ? 'text-red-700' : 'text-gold-800'}`}>
                {overdue ? 'Din betalning är försenad' : 'Du vann budgivningen, dags att betala'}
              </p>
              <p className="text-espresso-600 mt-1 leading-relaxed">
                {overdue
                  ? 'Betala snart så håller vi affären öppen. Uteblir betalningen avbryts affären automatiskt.'
                  : <>Föremålet är ditt. Betala bud + provision + frakt <span className="font-medium">omgående</span>, så tar säljaren emot din instruktion att skicka in det. Vi kontrollerar äktheten och skickar det sedan vidare till dig. Betalningsinstruktioner finns i meddelandena nedan.</>}
              </p>
              {due && (
                <p className={`mt-2 font-medium ${overdue ? 'text-red-700' : 'text-espresso-700'}`}>
                  Betala senast {due.toLocaleDateString('sv-SE')}
                </p>
              )}
              <PayNowButton orderId={order.id} />
            </div>
          )
        })()}
        {paid && <p className="mt-3 text-sm text-emerald-700">Betalning registrerad ✓</p>}
        <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
          Visa faktura →
        </Link>
      </div>
      <div className="card p-6">
        <h2 className="font-display text-lg text-espresso-900 mb-1">Status</h2>
        <p className="text-sm text-espresso-500">
          {(order.status === 'accepted' || order.status === 'shipped_by_seller') &&
            'Vi väntar på att säljaren skickar in föremålet. Så fort det är mottaget och kontrollerat hör vi av oss.'}
          {order.status === 'received' &&
            (paid
              ? 'Föremålet är mottaget och kontrollerat. Vi packar det och skickar det till dig inom kort.'
              : 'Föremålet är mottaget och kontrollerat. Vi skickar det vidare så snart din betalning är registrerad.')}
          {order.status === 'dealer_paid' && 'Vi förbereder leverans till dig.'}
          {order.status === 'verified_paid' && 'Föremålet packas för leverans till dig.'}
          {order.status === 'shipped_to_dealer' &&
            `Föremålet är skickat till dig.${order.tracking_dealer ? ` Spårningsnummer: ${order.tracking_dealer}.` : ''}`}
          {order.status === 'completed' && 'Affären är slutförd. Tack!'}
          {order.status === 'cancelled' && !order.refunded_at &&
            (order.cancel_reason ? `Affären har avbrutits: ${order.cancel_reason}.` : 'Affären har avbrutits.')}
        </p>
      </div>
    </>
  )
}
