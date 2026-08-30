'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { feesAt } from '@/lib/fees'

// GuldBud's own details.
const GULDBUD = {
  name: 'GuldBud AB',
  org: '559291-4781',
  vat: 'SE559291478101', // momsregistreringsnummer, bekräftat mot Skatteverket
  email: 'info@guldbud.com',
  box: 'Box 6007',
  postal: '102 31 Stockholm',
}

function ref(orderNo?: number) {
  return 'GB-' + String(orderNo ?? 0).padStart(6, '0')
}
// Belopp med två decimaler (moms ger ören).
function kr2(n: number) {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr'
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [party, setParty] = useState<any>(null) // the recipient's profile
  const [seller, setSeller] = useState<any>(null) // säljarens identitet (bara på handlarens inköpsunderlag)
  const [kind, setKind] = useState<'invoice' | 'receipt' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push('/auth/login')
      return
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const { data: o } = await supabase.from('orders').select('*').eq('id', params.id).single()
    if (!o) {
      setLoading(false)
      return
    }
    setOrder(o)
    const { data: it } = await supabase.from('items').select('title, weight_grams, karat').eq('id', o.item_id).single()
    setItem(it)

    if (prof?.role === 'admin' || user.id === o.dealer_id) {
      setKind('invoice') // handlaren: inköpsunderlag + GuldBuds faktura
      const targetId = user.id === o.dealer_id ? user.id : o.dealer_id
      const { data: p } = await supabase.from('profiles').select('*').eq('id', targetId).single()
      setParty(p)
      // Säljarens identitet hämtas via service-role-route (RLS döljer den annars
      // för handlaren). Handlaren behöver den för sitt inköpsunderlag/VMB.
      try {
        const res = await fetch(`/api/orders/${o.id}/seller`, {
          headers: { Authorization: `Bearer ${session!.access_token}` },
          cache: 'no-store',
        })
        if (res.ok) {
          const j = await res.json()
          setSeller(j.seller)
        }
      } catch {
        /* om det inte går att hämta visas fallback "Privatperson" */
      }
    } else if (user.id === o.seller_id) {
      setKind('receipt') // säljaren: försäljnings-/utbetalningsunderlag
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setParty(p)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-espresso-400">Laddar…</div>
  }
  if (!order || !kind) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-espresso-700">Dokumentet kunde inte hämtas.</p>
        <Link href="/" className="btn-gold">Till startsidan</Link>
      </div>
    )
  }

  const credit = kind === 'invoice' && !!order.refunded_at
  const date = new Date(order.created_at).toLocaleDateString('sv-SE')
  const bid = order.amount
  // Avgifterna som gällde när affären slöts, inte dagens. En faktura är ett
  // kvitto på vad som avtalades och ska visa samma belopp för alltid.
  const fees = feesAt(order.created_at)
  const spec = `${item?.title || 'Föremål'} · ${item?.weight_grams} g · ${item?.karat}`

  return (
    <div className="min-h-screen bg-espresso-50 py-8 px-4">
      <style>{`@media print { .no-print { display:none !important; } body { background:#fff; } .doc { page-break-inside: avoid; } .doc + .doc { page-break-before: always; } }`}</style>

      <div className="max-w-2xl mx-auto mb-4 flex justify-between items-center no-print">
        <Link href={`/orders/${order.id}`} className="text-sm text-espresso-500 hover:text-espresso-800">← Tillbaka till affären</Link>
        <button onClick={() => window.print()} className="btn-gold !py-2">Skriv ut / Spara som PDF</button>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {kind === 'receipt' ? (
          /* ============ SÄLJARE: försäljnings-/utbetalningsunderlag ============ */
          <Doc>
            <DocHead title="Försäljnings- och utbetalningsunderlag" sub="Underlag för din försäljning" order={order} date={date} />
            <Recipient label="Utbetalas till" party={party} />
            <table className="w-full text-sm mb-5">
              <tbody>
                <Row label={`Vara: ${item?.title || 'Föremål'}`} value={`${item?.weight_grams} g · ${item?.karat}`} plain />
                <Row label="Försäljningspris" value={kr2(bid)} />
                <Total label="Utbetalt till dig" value={kr2(bid)} />
              </tbody>
            </table>
            <Fine>
              {order.refunded_at
                ? `Affären återgick: föremålet godkändes inte vid äkthetskontroll${order.refund_reason ? ` (${order.refund_reason})` : ''}, och försäljningen genomfördes inte.`
                : `Du får hela försäljningspriset. GuldBud har inte gjort något avdrag från ditt belopp. Som privatperson lägger du ingen moms på försäljning av dina egna begagnade föremål. Förmedlat av ${GULDBUD.name} (org.nr ${GULDBUD.org}). Referens: ${ref(order.order_no)}.`}
            </Fine>
          </Doc>
        ) : (
          <>
            {/* ============ HANDLARE, dok 1: inköpsunderlag ============ */}
            <Doc>
              <DocHead title="Inköpsunderlag" sub="Köp av föremål från privatperson" order={order} date={date} />
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <Recipient label="Köpare" party={party} />
                <SellerBlock seller={seller} />
              </div>
              <div className="mb-6 rounded-xl bg-espresso-50 px-4 py-3">
                <p className="text-xs text-espresso-400 uppercase tracking-wide mb-0.5">Förmedlare</p>
                <p className="text-sm text-espresso-700">
                  {GULDBUD.name}, org.nr {GULDBUD.org}. GuldBud har förmedlat affären mellan säljaren och köparen och är inte part i köpet av föremålet.
                </p>
              </div>
              <table className="w-full text-sm mb-5">
                <tbody>
                  <Row label={`Vara: ${item?.title || 'Föremål'}`} value={`${item?.weight_grams} g · ${item?.karat}`} plain />
                  <Total label={credit ? 'Inköpspris (återgått)' : 'Inköpspris'} value={(credit ? '−' : '') + kr2(bid)} />
                </tbody>
              </table>
              <Fine>
                {credit
                  ? `Inköpet har återgått. Föremålet godkändes inte vid äkthetskontroll${order.refund_reason ? ` (${order.refund_reason})` : ''} och affären krediteras i sin helhet.`
                  : `Säljaren är privatperson och försäljningen är inte momsbelagd, ingen moms tas ut på föremålet. Affären är förmedlad av ${GULDBUD.name} (org.nr ${GULDBUD.org}), som inte är part i själva köpet. Referens: ${ref(order.order_no)}. Detta underlag styrker ditt inköp av föremålet från säljaren ovan.`}
              </Fine>
            </Doc>

            {/* ============ HANDLARE, dok 2: GuldBuds faktura ============ */}
            <Doc>
              <DocHead
                title={credit ? 'Kreditfaktura' : 'Faktura'}
                sub={credit ? `Kreditering av faktura ${ref(order.order_no)}` : 'GuldBuds förmedlingstjänst'}
                order={order}
                date={date}
                showVat
              />
              <Recipient label="Faktureras" party={party} />
              <table className="w-full text-sm mb-2">
                <thead>
                  <tr className="border-b border-espresso-200 text-left text-espresso-400">
                    <th className="py-2 font-medium">Beskrivning</th>
                    <th className="py-2 font-medium text-right">Belopp exkl moms</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label={`Förmedlingsprovision ${fees.commissionLabel}`} value={(credit ? '−' : '') + kr2(fees.commission(bid))} />
                  <Row label="Frakt" value={(credit ? '−' : '') + kr2(fees.shippingFeeExVat)} />
                  <Row label="Summa exkl moms" value={(credit ? '−' : '') + kr2(fees.commission(bid) + fees.shippingFeeExVat)} />
                  <Row label={`Moms ${fees.vatLabel}`} value={(credit ? '−' : '') + kr2(fees.commissionVat(bid) + fees.shippingFeeVat)} />
                  <Total label={credit ? 'Att återbetala' : 'Att betala till GuldBud'} value={(credit ? '−' : '') + kr2(fees.guldbudServiceTotal(bid))} />
                </tbody>
              </table>
              <Fine>
                Avser GuldBuds förmedlingstjänst (provision + frakt). Föremålets pris ({kr2(bid)}) faktureras separat enligt inköpsunderlaget och tillfaller säljaren.{' '}
                {credit ? '' : `Handlaren betalar hela affären som en summa: ${kr2(fees.dealerTotal(bid))} (föremål ${kr2(bid)} + denna faktura ${kr2(fees.guldbudServiceTotal(bid))}). `}
                Referens: {ref(order.order_no)}.
              </Fine>
            </Doc>
          </>
        )}
        <p className="text-[11px] text-espresso-300 text-center">
          Automatiskt genererade dokument från GuldBud. Vid frågor, kontakta {GULDBUD.email}.
        </p>
      </div>
    </div>
  )

  function DocHead({ title, sub, order, date, showVat }: { title: string; sub: string; order: any; date: string; showVat?: boolean }) {
    return (
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="font-sans font-semibold tracking-tight text-2xl text-espresso-900">GuldBud</p>
          <p className="text-xs text-espresso-400 mt-1">{GULDBUD.name}</p>
          <p className="text-xs text-espresso-400">Org.nr {GULDBUD.org}</p>
          {showVat && <p className="text-xs text-espresso-400">Momsnr {GULDBUD.vat}</p>}
          <p className="text-xs text-espresso-400">{GULDBUD.box}</p>
          <p className="text-xs text-espresso-400">{GULDBUD.postal}</p>
          <p className="text-xs text-espresso-400">{GULDBUD.email}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-espresso-900 uppercase tracking-wide text-sm">{title}</p>
          <p className="text-[11px] text-espresso-400">{sub}</p>
          <p className="text-xs text-espresso-400 mt-1">Nr: {ref(order.order_no)}</p>
          <p className="text-xs text-espresso-400">Datum: {date}</p>
        </div>
      </div>
    )
  }
}

function Doc({ children }: { children: React.ReactNode }) {
  return (
    <div className="doc bg-white border border-espresso-100 rounded-2xl p-8 sm:p-10 print:border-0 print:rounded-none">
      {children}
    </div>
  )
}

function Recipient({ label, party }: { label: string; party: any }) {
  return (
    <div className="mb-8">
      <p className="text-xs text-espresso-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium text-espresso-900">{party?.company_name || party?.full_name || '—'}</p>
      {party?.company_name && <p className="text-sm text-espresso-500">{party.full_name}</p>}
      {party?.org_number && <p className="text-sm text-espresso-500">Org.nr {party.org_number}</p>}
      {(party?.address || party?.city) && (
        <p className="text-sm text-espresso-500">
          {party.address}{party.postal_code || party.city ? `, ${party.postal_code || ''} ${party.city || ''}` : ''}
        </p>
      )}
    </div>
  )
}

function SellerBlock({ seller }: { seller: any }) {
  return (
    <div>
      <p className="text-xs text-espresso-400 uppercase tracking-wide mb-1">Säljare (privatperson)</p>
      {seller ? (
        <>
          <p className="font-medium text-espresso-900">{seller.full_name || '—'}</p>
          {seller.personal_number && <p className="text-sm text-espresso-500">Personnr {seller.personal_number}</p>}
          {(seller.address || seller.city) && (
            <p className="text-sm text-espresso-500">
              {seller.address}{seller.postal_code || seller.city ? `, ${seller.postal_code || ''} ${seller.city || ''}` : ''}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-espresso-500">Privatperson</p>
      )}
    </div>
  )
}

function Row({ label, value, plain }: { label: string; value: string; plain?: boolean }) {
  return (
    <tr className={plain ? '' : 'border-b border-espresso-100'}>
      <td className="py-2.5 text-espresso-700">{label}</td>
      <td className="py-2.5 text-right tabular-nums text-espresso-800">{value}</td>
    </tr>
  )
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-espresso-200">
      <td className="py-3 font-semibold text-espresso-900">{label}</td>
      <td className="py-3 text-right font-semibold tabular-nums text-espresso-900">{value}</td>
    </tr>
  )
}

function Fine({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-espresso-400 leading-relaxed">{children}</p>
}
