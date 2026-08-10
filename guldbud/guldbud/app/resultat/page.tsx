import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CategoryIcon from '@/components/CategoryIcon'
import Link from 'next/link'
import { formatSEK } from '@/lib/gold'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Sålda resultat · GuldBud',
  description: 'Se vad guld faktiskt sålts för på GuldBud. Transparent prisstatistik – inga lockpriser.',
}

export default async function ResultsPage() {
  const supabase = createClient()
  const { data: items } = await supabase
    .from('items')
    .select('id, title, category, weight_grams, karat, gemstone, accepted_at, accepted_bid_id')
    .eq('status', 'closed')
    .not('accepted_bid_id', 'is', null)
    .order('accepted_at', { ascending: false })
    .limit(60)

  const list = items || []
  let priceByBid: Record<string, number> = {}
  if (list.length > 0) {
    const bidIds = list.map((i: any) => i.accepted_bid_id).filter(Boolean)
    const { data: bids } = await supabase.from('bids').select('id, amount').in('id', bidIds)
    bids?.forEach((b: any) => (priceByBid[b.id] = b.amount))
  }

  const rows = list
    .map((i: any) => ({ ...i, price: priceByBid[i.accepted_bid_id] || 0 }))
    .filter((r: any) => r.price > 0)

  const totalPrice = rows.reduce((s: number, r: any) => s + r.price, 0)
  const totalWeight = rows.reduce((s: number, r: any) => s + (r.weight_grams || 0), 0)
  const avgPerGram = totalWeight > 0 ? Math.round(totalPrice / totalWeight) : 0

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="relative overflow-hidden bg-espresso-900 px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-4xl text-gold-100 mb-4">Sålda resultat</h1>
          <p className="text-gold-200/70 max-w-xl mx-auto text-sm leading-relaxed">
            Se vad guld faktiskt sålts för hos GuldBud. Inga lockpriser – bara riktiga slutpriser från
            verklig budgivning, så att du vet vad du kan förvänta dig.
          </p>
          {rows.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              <Stat value={rows.length.toString()} label="Sålda föremål" />
              <Stat value={`${avgPerGram.toLocaleString('sv-SE')} kr/g`} label="Snittpris (blandade karat)" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {rows.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="font-display text-xl text-espresso-800 mb-2">Inga avslutade affärer ännu</p>
            <p className="text-espresso-500 text-sm mb-6">
              Så snart de första auktionerna avslutats visas slutpriserna här.
            </p>
            <Link href="/auctions" className="btn-gold">Se pågående auktioner</Link>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-espresso-100">
            {rows.map((r: any) => {
              const perGram = r.weight_grams ? Math.round(r.price / r.weight_grams) : 0
              return (
                <div key={r.id} className="flex items-center gap-4 p-4">
                  <div className="w-11 h-11 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
                    <CategoryIcon category={r.category} size={20} strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-espresso-900 truncate">{r.title}</p>
                    <p className="text-xs text-espresso-400">
                      {r.category ? `${r.category} · ` : ''}{r.weight_grams} g · {r.karat}
                      {r.gemstone ? ` · ${r.gemstone}` : ''}
                      {r.accepted_at ? ` · ${new Date(r.accepted_at).toLocaleDateString('sv-SE')}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gold-700 tabular-nums">{formatSEK(r.price)}</p>
                    {perGram > 0 && <p className="text-[11px] text-espresso-400">{perGram.toLocaleString('sv-SE')} kr/g</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-espresso-400 mt-6">
          Alla resultat är anonymiserade. Priserna avser vinnande bud vid avslutad auktion.
        </p>
      </div>
      <Footer />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-gold-100">{value}</div>
      <div className="text-xs text-gold-500/60">{label}</div>
    </div>
  )
}
