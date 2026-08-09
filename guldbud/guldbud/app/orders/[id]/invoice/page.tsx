'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { formatSEK } from '@/lib/gold'
import { DEALER_COMMISSION_LABEL, commission, totalWithCommission } from '@/lib/fees'

// GuldBud's own details (placeholders until the real Box address / org.nr are set).
const GULDBUD = {
  name: 'GuldBud AB',
  address: 'Storgatan 1, 111 22 Stockholm',
  org: 'XXXXXX-XXXX',
  email: 'info@guldbud.com',
}

function ref(orderNo?: number) {
  return 'GB-' + String(orderNo ?? 0).padStart(6, '0')
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [party, setParty] = useState<any>(null) // the recipient's profile
  const [kind, setKind] = useState<'invoice' | 'receipt' | null>(null)
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
    const { data: o } = await supabase.from('orders').select('*').eq('id', params.id).single()
    if (!o) {
      setLoading(false)
      return
    }
    setOrder(o)
    const { data: it } = await supabase.from('items').select('title, weight_grams, karat').eq('id', o.item_id).single()
    setItem(it)

    if (prof?.role === 'admin' || user.id === o.dealer_id) {
      // Dealer invoice (buyer pays bid + commission).
      setKind('invoice')
      const targetId = user.id === o.dealer_id ? user.id : o.dealer_id
      const { data: p } = await supabase.from('profiles').select('*').eq('id', targetId).single()
      setParty(p)
    } else if (user.id === o.seller_id) {
      // Seller payout receipt (seller gets the full bid).
      setKind('receipt')
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

  const isInvoice = kind === 'invoice'
  const date = new Date(order.created_at).toLocaleDateString('sv-SE')

  return (
    <div className="min-h-screen bg-espresso-50 py-8 px-4">
      <style>{`@media print { .no-print { display:none !important; } body { background:#fff; } }`}</style>

      <div className="max-w-2xl mx-auto mb-4 flex justify-between items-center no-print">
        <Link href={`/orders/${order.id}`} className="text-sm text-espresso-500 hover:text-espresso-800">← Tillbaka till affären</Link>
        <button onClick={() => window.print()} className="btn-gold !py-2">Skriv ut / Spara som PDF</button>
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-espresso-100 rounded-2xl p-8 sm:p-10 print:border-0 print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="font-display text-2xl text-espresso-900" style={{ fontFamily: 'Georgia, serif' }}>GuldBud</p>
            <p className="text-xs text-espresso-400 mt-1">{GULDBUD.name}</p>
            <p className="text-xs text-espresso-400">{GULDBUD.address}</p>
            <p className="text-xs text-espresso-400">Org.nr {GULDBUD.org}</p>
            <p className="text-xs text-espresso-400">{GULDBUD.email}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-espresso-900 uppercase tracking-wide text-sm">
              {isInvoice ? 'Faktura' : 'Avräkningsnota'}
            </p>
            {isInvoice ? (
              <p className="text-[11px] text-espresso-400">Gäller även som inköpsunderlag</p>
            ) : (
              <p className="text-[11px] text-espresso-400">Underlag för din försäljning</p>
            )}
            <p className="text-xs text-espresso-400 mt-1">Nr: {ref(order.order_no)}</p>
            <p className="text-xs text-espresso-400">Datum: {date}</p>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-8">
          <p className="text-xs text-espresso-400 uppercase tracking-wide mb-1">
            {isInvoice ? 'Faktureras' : 'Utbetalas till'}
          </p>
          <p className="font-medium text-espresso-900">{party?.company_name || party?.full_name || '—'}</p>
          {party?.company_name && <p className="text-sm text-espresso-500">{party.full_name}</p>}
          {party?.org_number && <p className="text-sm text-espresso-500">Org.nr {party.org_number}</p>}
          {(party?.address || party?.city) && (
            <p className="text-sm text-espresso-500">
              {party.address}{party.postal_code || party.city ? `, ${party.postal_code || ''} ${party.city || ''}` : ''}
            </p>
          )}
        </div>

        {/* Lines */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-espresso-200 text-left text-espresso-400">
              <th className="py-2 font-medium">Beskrivning</th>
              <th className="py-2 font-medium text-right">Belopp</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-espresso-100">
              <td className="py-2.5 text-espresso-700">{isInvoice ? 'Vinnande bud' : 'Utbetalning för'} – {item?.title}</td>
              <td className="py-2.5 text-right tabular-nums text-espresso-800">{formatSEK(order.amount)}</td>
            </tr>
            {isInvoice && (
              <tr className="border-b border-espresso-100">
                <td className="py-2.5 text-espresso-700">Köparprovision {DEALER_COMMISSION_LABEL}</td>
                <td className="py-2.5 text-right tabular-nums text-espresso-800">{formatSEK(commission(order.amount))}</td>
              </tr>
            )}
            <tr>
              <td className="py-3 font-semibold text-espresso-900">{isInvoice ? 'Att betala' : 'Utbetalt belopp'}</td>
              <td className="py-3 text-right font-semibold tabular-nums text-espresso-900">
                {formatSEK(isInvoice ? totalWithCommission(order.amount) : order.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs text-espresso-400 leading-relaxed">
          Föremål: {item?.title} · {item?.weight_grams} g · {item?.karat}.{' '}
          {isInvoice
            ? `Sålt i kommission av ${GULDBUD.name} (org.nr ${GULDBUD.org}). Betalning enligt instruktioner i affären. Referens: ${ref(order.order_no)}. Detta dokument utgör inköpsunderlag för föremålet.`
            : `Sålt genom ${GULDBUD.name} i kommission för din räkning. Utbetalning sker till angivet konto efter godkänd äkthetskontroll. Som privatperson lägger du ingen moms på försäljning av dina egna begagnade föremål.`}
        </p>

        <p className="text-[11px] text-espresso-300 mt-6 pt-4 border-t border-espresso-100">
          Detta är ett automatiskt genererat dokument från GuldBud. Vid frågor, kontakta {GULDBUD.email}.
        </p>
      </div>
    </div>
  )
}
