'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { loginUrl } from '@/lib/loginUrl'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OrderStepper from '@/components/OrderStepper'
import OrderChat from '@/components/OrderChat'
import BidHistory from '@/components/BidHistory'
import DisputePanel from '@/components/DisputePanel'
import TrustpilotInvite from '@/components/TrustpilotInvite'
import Image from 'next/image'
import Link from 'next/link'
import { ORDER_STATUS_LABEL, OrderStatus, SELLER_DOC_STATES } from '@/lib/orders'
import { formatSEK } from '@/lib/gold'
import { feesAt } from '@/lib/fees'
import { GULDBUD, OPERATING_ACCOUNT } from '@/lib/company'

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [relisted, setRelisted] = useState<{ id: string; status: string } | null>(null)
  const [me, setMe] = useState<string>('')
  const [party, setParty] = useState<'seller' | 'dealer' | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const init = async () => {
    // getSession() läser sessionen från lagringen och förnyar en utgången
    // access-token. getUser() gör bara ett nätverksanrop som misslyckas på en
    // utgången token, vilket kastade ut handlaren vid återkomst från Stripe.
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push(loginUrl())
      return
    }
    setMe(user.id)

    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role === 'admin') {
      router.replace(`/admin/orders/${params.id}`)
      return
    }

    // Explicita kolumner (inte '*') så interna admin-fält som admin_notes
    // aldrig når säljar- eller handlarvyn.
    //
    // seal_number och cancel_reason saknades tidigare i listan trots att vyn
    // renderar dem. Följden var att förseglingsnumret aldrig syntes för
    // parterna, och att en avbruten affär bara sa "Affären har avbrutits" utan
    // anledningen. cancel_reason visas bara för handlaren, och bara när affären
    // avbrutits utan kreditering, alltså den automatiska texten om utebliven
    // betalning.
    const { data: o } = await supabase
      .from('orders')
      .select(
        'id, item_id, seller_id, dealer_id, amount, status, dealer_paid_at, fee_paid_at, payment_due_at, tracking_dealer, seal_number, cancel_reason, order_no, created_at, refunded_at, refund_reason'
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

    // Har föremålet lagts ut igen efter att affären avbrutits? Utan den här
    // upplysningen slutar säljarens vy i ett rött återvändsgränd: affären är
    // avbruten, punkt, trots att föremålet ligger ute på en ny auktion.
    // Återpublicering skapar alltid en ny rad, aldrig en återanvänd, eftersom
    // orders.item_id är unikt.
    if (o.status === 'cancelled') {
      const { data: again } = await supabase
        .from('items')
        .select('id, status')
        .eq('relisted_from', o.item_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setRelisted(again || null)
    }
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
              <Image src={item.image_urls[0]} alt={item.title} fill sizes="(max-width: 640px) 100vw, 128px" className="object-contain" />
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

        {/* Retur/kreditering, föremålet godkändes inte vid kontroll */}
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
          <SellerPanel order={order} relisted={relisted} meId={me} onChanged={init} />
        ) : (
          <DealerPanel order={order} />
        )}

        {/* Budhistorik, vad som ledde fram till affären, anonymiserat */}
        {order.item_id && <BidHistory itemId={order.item_id} />}

        {/* Betygsätt oss, vid det bästa tillfället, precis efter avslutad affär */}
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

// Statusar där GuldBud tagit emot och kontrollerat föremålet, alltså där
// handlaren ska betala köpeskillingen till säljaren och säljaren kan bekräfta.
const PAYABLE_STATES = ['received', 'dealer_paid', 'verified_paid', 'shipped_to_dealer', 'completed']

// Referensformatet GB-XXXXXX är samma som fakturans ref(), medvetet
// kopierat: att importera lib/pdf/invoiceDoc hit hade dragit in react-pdf i
// klientbundlen.
function payRef(orderNo?: number | null) {
  return 'GB-' + String(orderNo ?? 0).padStart(6, '0')
}

function SellerPanel({
  order,
  relisted,
  meId,
  onChanged,
}: {
  order: any
  relisted: { id: string; status: string } | null
  meId: string
  onChanged: () => Promise<void>
}) {
  const supabase = createClient()
  const [bank, setBank] = useState<{ clearing: string | null; account: string | null } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  const needsShipping = order.status === 'accepted'
  // Väg C: handlaren betalar köpeskillingen direkt till säljarens konto när
  // föremålet är kontrollerat, och säljaren bekräftar här. Bekräftelsen
  // (dealer_paid_at) är det som låser upp vidareskicket i databasen.
  const awaitingConfirm =
    !order.dealer_paid_at &&
    !order.refunded_at &&
    order.status !== 'cancelled' &&
    PAYABLE_STATES.includes(order.status)

  useEffect(() => {
    if (!awaitingConfirm) return
    // Egen rad, RLS tillåter det. Visas så säljaren ser vilket konto
    // handlaren fått, och reagerar om det är fel.
    supabase
      .from('profiles')
      .select('payout_bank_clearing, payout_bank_account')
      .eq('id', meId)
      .single()
      .then(({ data }) =>
        setBank(data ? { clearing: data.payout_bank_clearing, account: data.payout_bank_account } : null)
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingConfirm, meId])

  const confirm = async () => {
    setConfirming(true)
    setConfirmError('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const res = await fetch(`/api/orders/${order.id}/confirm-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token || ''}` },
    })
    if (!res.ok) {
      setConfirmError('Bekräftelsen kunde inte sparas. Försök igen, eller skriv i meddelandena nedan.')
      setConfirming(false)
      return
    }
    await onChanged()
    setConfirming(false)
  }

  return (
    <div className={`card p-6 ${needsShipping || awaitingConfirm ? 'ring-2 ring-gold-300' : ''}`}>
      {needsShipping ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="chip bg-gold-100 text-gold-800 border border-gold-200">Din tur</span>
          </div>
          <h2 className="font-display text-xl text-espresso-900 mb-1">Grattis, ditt föremål är sålt!</h2>
          <p className="text-sm text-espresso-500 mb-5 leading-relaxed">
            Du sålde för {formatSEK(order.amount)}. Handlaren betalar hela beloppet direkt till ditt bankkonto
            när vi tagit emot och kontrollerat föremålet. Nu skickar vi dig ett kostnadsfritt, rekommenderat
            brev med förbetalt porto, försäkrat upp till 100 000 kr. Lägg föremålet i det och posta det
            rekommenderat. Ju snabbare det är på väg, desto snabbare får du betalt.
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
            <p className="text-gold-200/80 text-sm">Förbetalt porto och adress, försäkrat upp till 100 000 kr. Vi skickar det till dig nu, posta så snart du kan.</p>
          </div>
          <p className="text-xs text-espresso-400 mt-3 leading-relaxed">
            Så fort vi tagit emot och äkthetskontrollerat föremålet får handlaren dina kontouppgifter och
            betalar {formatSEK(order.amount)} direkt till ditt konto. Du bekräftar här när pengarna kommit,
            och först då skickar vi föremålet vidare. Har du frågor innan du postar, skriv i meddelandena nedan.
          </p>
        </>
      ) : awaitingConfirm ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="chip bg-gold-100 text-gold-800 border border-gold-200">Din tur</span>
          </div>
          <h2 className="font-display text-xl text-espresso-900 mb-1">Väntar på din bekräftelse</h2>
          <p className="text-sm text-espresso-500 leading-relaxed">
            Föremålet är mottaget och kontrollerat. Handlaren betalar {formatSEK(order.amount)} direkt
            till ditt bankkonto
            {bank?.clearing || bank?.account ? (
              <>
                {' '}
                <span className="font-medium text-espresso-700 tabular-nums">
                  {bank.clearing || '-'} / {bank.account || '-'}
                </span>
              </>
            ) : null}
            . När pengarna syns på kontot, bekräfta här. Först då skickar vi föremålet vidare till handlaren.
          </p>
          <button onClick={confirm} disabled={confirming} className="btn-gold mt-4">
            {confirming ? '...' : 'Pengarna har kommit in på mitt konto'}
          </button>
          {confirmError && <p className="mt-2 text-xs text-red-600">{confirmError}</p>}
          <p className="text-xs text-espresso-400 mt-3 leading-relaxed">
            Bekräfta bara när beloppet faktiskt syns på kontot. Har inget kommit inom ett par bankdagar,
            skriv i meddelandena så tar vi kontakt med handlaren.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-display text-lg text-espresso-900 mb-1">Status</h2>
          <p className="text-sm text-espresso-500">
            {order.status === 'shipped_by_seller' && 'Vi väntar på att ditt föremål ska komma fram.'}
            {(order.status === 'received' || order.status === 'dealer_paid' || order.status === 'verified_paid') &&
              'Du har bekräftat betalningen. Vi skickar föremålet vidare till handlaren.'}
            {(order.status === 'shipped_to_dealer' || order.status === 'completed') &&
              'Affären är klar. Tack för att du sålde via GuldBud!'}
            {order.status === 'cancelled' && !order.refunded_at &&
              'Affären kunde tyvärr inte slutföras och har avbrutits. Har du frågor, skriv i meddelandena nedan.'}
          </p>
          {/* Slutar inte i ett återvändsgränd när föremålet redan ligger ute
              igen. Den nya annonsen är en egen rad, så utan den här raden ser
              säljaren bara den avbrutna affären och en till synes orelaterad
              auktion i Mina föremål. */}
          {order.status === 'cancelled' && relisted && (
            <p className="mt-3 text-sm text-emerald-700">
              Föremålet är utlagt igen.{' '}
              {relisted.status === 'pending' ? (
                <span className="text-espresso-500">Den nya annonsen väntar på granskning.</span>
              ) : (
                <Link href={`/auctions/${relisted.id}`} className="text-gold-600 hover:text-gold-700">
                  Se den nya auktionen →
                </Link>
              )}
            </p>
          )}
          {SELLER_DOC_STATES.includes(order.status) && (
            <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
              Visa försäljningsunderlag →
            </Link>
          )}
          {order.seal_number && (
            <p className="mt-3 text-xs text-espresso-500">
              Säkerhetsförsegling: <span className="font-medium text-espresso-700">{order.seal_number}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}

// En av handlarens två betalningar, som en numrerad ruta.
function PayBox({
  step,
  title,
  done,
  children,
}: {
  step: string
  title: string
  done: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`mt-4 rounded-xl border p-4 text-sm ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-espresso-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`shrink-0 w-6 h-6 rounded-full grid place-items-center text-xs font-semibold ${
            done ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-white'
          }`}
        >
          {done ? '✓' : step}
        </span>
        <p className="font-medium text-espresso-900">{title}</p>
      </div>
      {children}
    </div>
  )
}

// Handlarens betalning under väg C, beslutad 2026-09-15: två överföringar,
// två mottagare. GuldBuds faktura (provision plus frakt inklusive moms) går
// till rörelsekontot och betalas omgående. Köpeskillingen går direkt till
// säljarens bankkonto och betalas först när GuldBud tagit emot och
// kontrollerat föremålet, eftersom pengarna då inte går att få tillbaka via
// oss om föremålet underkänns. Säljaren bekräftar i affären, och först då
// skickas föremålet vidare. GuldBud tar aldrig emot köpeskillingen.
function DealerPanel({ order }: { order: any }) {
  const supabase = createClient()
  // Avgifterna som gällde när affären slöts, samma som på fakturan.
  const fees = feesAt(order.created_at)
  const live = !order.refunded_at && order.status !== 'cancelled'
  const feePaid = !!order.fee_paid_at
  const sellerPaid = !!order.dealer_paid_at
  const payable = live && PAYABLE_STATES.includes(order.status)
  const [account, setAccount] = useState<{ name: string | null; clearing: string | null; account: string | null } | null>(null)
  const [accountError, setAccountError] = useState('')

  useEffect(() => {
    if (!payable || sellerPaid) return
    // Kontouppgifterna lämnas ut av en rutt med servicerollen, loggad i
    // identity_disclosures, först när föremålet är kontrollerat.
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch(`/api/orders/${order.id}/payout-account`, {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        setAccountError('Kontouppgifterna kunde inte hämtas. Skriv i meddelandena så hjälper vi dig.')
        return
      }
      const j = await res.json().catch(() => null)
      setAccount(j?.account || null)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payable, sellerPaid, order.id])

  const due = order.payment_due_at ? new Date(order.payment_due_at) : null
  const overdue = due ? due.getTime() < Date.now() : false

  return (
    <>
      <div className={`card p-6 ${live && (!feePaid || !sellerPaid) ? 'ring-2 ring-gold-300' : ''}`}>
        <h2 className="font-display text-lg text-espresso-900 mb-3">Att betala</h2>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-espresso-600">
            <span>Vinnande bud, till säljaren</span>
            <span className="tabular-nums">{formatSEK(order.amount)}</span>
          </div>
          <div className="flex justify-between text-espresso-600">
            <span>Provision {fees.commissionLabel}, till GuldBud</span>
            <span className="tabular-nums">+{formatSEK(fees.commission(order.amount))}</span>
          </div>
          <div className="flex justify-between text-espresso-600">
            <span>Frakt (inkl moms), till GuldBud</span>
            <span className="tabular-nums">+{formatSEK(fees.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-espresso-600">
            <span>Moms {fees.vatLabel} på provision</span>
            <span className="tabular-nums">+{formatSEK(fees.commissionVat(order.amount))}</span>
          </div>
          <div className="flex justify-between font-semibold text-espresso-900 pt-2 mt-1 border-t border-espresso-100">
            <span>Ditt totalpris</span>
            <span className="tabular-nums">{formatSEK(fees.dealerTotal(order.amount))}</span>
          </div>
        </div>
        <p className="text-xs text-espresso-500 mt-2 leading-relaxed">
          Betalas i två delar: GuldBuds faktura till oss nu, och köpeskillingen direkt till säljaren när
          föremålet är kontrollerat. GuldBud tar inte emot köpeskillingen.
        </p>

        {live && (
          <>
            <PayBox step="1" title="GuldBuds faktura, betala omgående" done={feePaid}>
              {feePaid ? (
                <p className="text-emerald-700">
                  Registrerad {new Date(order.fee_paid_at).toLocaleDateString('sv-SE')}. Tack!
                </p>
              ) : (
                <>
                  <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 gap-x-3">
                    <dt className="text-espresso-400">Belopp</dt>
                    <dd className="m-0 font-semibold text-espresso-900 tabular-nums">{formatSEK(fees.guldbudServiceTotal(order.amount))}</dd>
                    <dt className="text-espresso-400">Mottagare</dt>
                    <dd className="m-0 text-espresso-700">{GULDBUD.name}</dd>
                    <dt className="text-espresso-400">{OPERATING_ACCOUNT.label}</dt>
                    <dd className="m-0 text-espresso-700 tabular-nums">{OPERATING_ACCOUNT.number}</dd>
                    <dt className="text-espresso-400">Referens</dt>
                    <dd className="m-0 font-semibold text-espresso-900 tabular-nums">{payRef(order.order_no)}</dd>
                  </dl>
                  {due && (
                    <p className={`mt-2 font-medium ${overdue ? 'text-red-700' : 'text-espresso-700'}`}>
                      {overdue ? 'Förfallen sedan ' : 'Betala senast '}
                      {due.toLocaleDateString('sv-SE')}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-espresso-500">
                    Märk betalningen med referensen. Vi prickar av inkomna betalningar löpande och
                    bekräftar här i affären.
                    {overdue ? ' Uteblir betalningen avbryts affären automatiskt.' : ''}
                  </p>
                  <Link href={`/orders/${order.id}/invoice`} className="btn-gold w-full sm:w-auto mt-3 inline-flex justify-center">
                    Öppna fakturan
                  </Link>
                </>
              )}
            </PayBox>

            <PayBox step="2" title="Köpeskillingen, direkt till säljaren" done={sellerPaid}>
              {sellerPaid ? (
                <p className="text-emerald-700">
                  Säljaren har bekräftat {new Date(order.dealer_paid_at).toLocaleDateString('sv-SE')}. Vi skickar
                  föremålet till dig.
                </p>
              ) : !payable ? (
                <p className="text-espresso-600">
                  {formatSEK(order.amount)}. Betalas när vi tagit emot och kontrollerat föremålet, inte innan.
                  Säljarens kontouppgifter visas här då.
                </p>
              ) : account ? (
                <>
                  <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 gap-x-3">
                    <dt className="text-espresso-400">Belopp</dt>
                    <dd className="m-0 font-semibold text-espresso-900 tabular-nums">{formatSEK(order.amount)}</dd>
                    <dt className="text-espresso-400">Kontohavare</dt>
                    <dd className="m-0 text-espresso-700">{account.name || '-'}</dd>
                    <dt className="text-espresso-400">Clearing</dt>
                    <dd className="m-0 text-espresso-700 tabular-nums">{account.clearing || '-'}</dd>
                    <dt className="text-espresso-400">Kontonummer</dt>
                    <dd className="m-0 text-espresso-700 tabular-nums">{account.account || '-'}</dd>
                    <dt className="text-espresso-400">Referens</dt>
                    <dd className="m-0 font-semibold text-espresso-900 tabular-nums">{payRef(order.order_no)}</dd>
                  </dl>
                  <p className="mt-2 text-xs text-espresso-500">
                    Föremålet är mottaget och kontrollerat. Betala direkt till säljaren och märk med referensen.
                    När säljaren bekräftat att pengarna kommit skickar vi föremålet till dig.
                  </p>
                </>
              ) : accountError ? (
                <p className="text-red-600">{accountError}</p>
              ) : (
                <p className="text-espresso-400">Hämtar säljarens kontouppgifter...</p>
              )}
            </PayBox>
          </>
        )}

        {(!live || feePaid) && (
          <Link href={`/orders/${order.id}/invoice`} className="inline-block mt-3 text-sm text-gold-600 hover:text-gold-700">
            Visa faktura →
          </Link>
        )}
      </div>
      <div className="card p-6">
        <h2 className="font-display text-lg text-espresso-900 mb-1">Status</h2>
        <p className="text-sm text-espresso-500">
          {(order.status === 'accepted' || order.status === 'shipped_by_seller') &&
            'Vi väntar på att säljaren skickar in föremålet. Betala GuldBuds faktura under tiden. Så fort föremålet är mottaget och kontrollerat hör vi av oss.'}
          {order.status === 'received' &&
            (sellerPaid
              ? 'Säljaren har bekräftat din betalning. Vi packar och skickar föremålet till dig inom kort.'
              : 'Föremålet är mottaget och kontrollerat. Betala köpeskillingen till säljaren, så skickar vi det vidare när säljaren bekräftat.')}
          {order.status === 'dealer_paid' && 'Vi förbereder leverans till dig.'}
          {order.status === 'verified_paid' && 'Föremålet packas för leverans till dig.'}
          {order.status === 'shipped_to_dealer' &&
            `Föremålet är skickat till dig.${order.tracking_dealer ? ` Spårningsnummer: ${order.tracking_dealer}.` : ''}`}
          {order.status === 'completed' && 'Affären är slutförd. Tack!'}
          {order.status === 'cancelled' && !order.refunded_at &&
            (order.cancel_reason ? `Affären har avbrutits: ${order.cancel_reason}.` : 'Affären har avbrutits.')}
        </p>
        {order.seal_number && (
          <p className="mt-3 text-xs text-espresso-500">
            Säkerhetsförsegling: <span className="font-medium text-espresso-700">{order.seal_number}</span>
          </p>
        )}
      </div>
    </>
  )
}
