'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import VerifiedBadge from '@/components/VerifiedBadge'

// Budhistorik för ett föremål, anonymiserad (handlarna visas som "Kund XXXXXX",
// aldrig med namn). Läsbar för säljaren på sin egen affär: RLS tillåter select
// på bud för föremål med status 'active'/'closed', och affärens föremål är stängt.
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'nyss'
  if (m < 60) return `${m} min sedan`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h sedan`
  return `${Math.floor(h / 24)} d sedan`
}
function dealerCode(id: string | null | undefined) {
  if (!id) return '000000'
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return String(h % 1000000).padStart(6, '0')
}

export default function BidHistory({ itemId }: { itemId: string }) {
  const supabase = createClient()
  const [bids, setBids] = useState<any[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data } = await supabase
        .from('bids')
        .select('id, amount, created_at, dealer_id')
        .eq('item_id', itemId)
        .order('amount', { ascending: false })
      if (alive) setBids(data || [])
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  if (bids.length === 0) return null

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg text-espresso-900 mb-3 flex items-center gap-2">
        Budhistorik
        <span className="chip bg-espresso-100 text-espresso-500">{bids.length}</span>
      </h2>
      {/* Ett pastaende om alla budgivare, inte ett markt per rad. Kravet ligger
          i dealer_may_bid, sa varje bud i listan kommer per definition fran en
          godkand och legitimerad handlare. Ett markt per rad hade dessutom
          rojt nagot om enskilda anonyma budgivare. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <VerifiedBadge verified label="Legitimerade handlare" />
        <span className="text-xs text-espresso-400">
          Alla som budar är godkända av oss och legitimerade med BankID.
        </span>
      </div>
      <div className="rounded-2xl border border-espresso-100 overflow-hidden bg-white">
        {bids.map((bid: any, i: number) => (
          <div
            key={bid.id || i}
            className={`flex items-center justify-between px-4 py-3 text-sm ${
              i > 0 ? 'border-t border-espresso-50' : ''
            } ${i === 0 ? 'bg-gold-50/50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i === 0 ? 'bg-gold-sheen text-espresso-900' : 'bg-espresso-100 text-espresso-500'
                }`}
              >
                {dealerCode(bid.dealer_id).slice(-2)}
              </div>
              <div>
                <p className={i === 0 ? 'font-medium text-espresso-900' : 'text-espresso-600'}>
                  Kund {dealerCode(bid.dealer_id)}
                  {i === 0 && <span className="ml-2 chip bg-emerald-100 text-emerald-700">Vinnande bud</span>}
                </p>
                <p className="text-[11px] text-espresso-300">{relTime(bid.created_at)}</p>
              </div>
            </div>
            <span className={`tabular-nums ${i === 0 ? 'font-semibold text-gold-700' : 'text-espresso-600'}`}>
              {bid.amount.toLocaleString('sv-SE')} kr
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
