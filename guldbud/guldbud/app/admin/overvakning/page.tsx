'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { loginUrl } from '@/lib/loginUrl'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { estimateRange, formatSEK } from '@/lib/gold'
import { useGoldPrice } from '@/lib/useGoldPrice'

type DealerStat = {
  id: string
  name: string
  bids: number
  participated: number
  wins: number
  uncontestedWins: number
  sumBiddersWhenWon: number
}

type LowComp = {
  itemId: string
  title: string
  winnerName: string
  price: number
  estLow: number
  bidders: number
}

// Marknadsövervakning (anti-samverkan). Lyfter fram mönster som KAN tyda på
// samordnad budgivning, låg konkurrens, hög vinstandel hos en enskild handlare,
// försäljningar under uppskattat värde. Detta är beslutsstöd, inte en anklagelse:
// mönstren ska tolkas av admin innan någon åtgärd vidtas.
export default function OvervakningPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [dealers, setDealers] = useState<DealerStat[]>([])
  const [lowComp, setLowComp] = useState<LowComp[]>([])
  const [totals, setTotals] = useState({ closed: 0, avgBidders: 0, underEstimate: 0 })

  // 24K-priset per gram, live. Faller tillbaka på riktvärdet i lib/gold tills
  // /api/gold-price svarat.
  const { price: spot } = useGoldPrice()

  useEffect(() => {
    init()
    // Räknas om när kursen kommer in, annars hade sidan visat riktvärdets
    // uppskattning kvar hela besöket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot])

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push(loginUrl())
      return
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') {
      router.push('/')
      return
    }

    const [{ data: items }, { data: bids }, { data: profs }] = await Promise.all([
      supabase.from('items').select('id, title, status, weight_grams, karat, accepted_bid_id'),
      supabase.from('bids').select('id, item_id, dealer_id, amount'),
      supabase.from('profiles').select('id, company_name, full_name').eq('role', 'dealer'),
    ])

    const nameOf = (id: string) => {
      const p = (profs || []).find((x: any) => x.id === id)
      return p?.company_name || p?.full_name || 'Handlare'
    }

    const allBids = bids || []
    const closed = (items || []).filter((i: any) => i.status === 'closed' && i.accepted_bid_id)

    const stats: Record<string, DealerStat> = {}
    const ensure = (id: string) => {
      if (!stats[id]) stats[id] = { id, name: nameOf(id), bids: 0, participated: 0, wins: 0, uncontestedWins: 0, sumBiddersWhenWon: 0 }
      return stats[id]
    }
    // Alla bud räknas per handlare (även på pågående auktioner).
    allBids.forEach((b: any) => ensure(b.dealer_id).bids++)

    const low: LowComp[] = []
    let bidderSum = 0
    let underEstimate = 0

    closed.forEach((item: any) => {
      const itemBids = allBids.filter((b: any) => b.item_id === item.id)
      const bidders = new Set(itemBids.map((b: any) => b.dealer_id))
      const uniqueBidders = bidders.size
      bidderSum += uniqueBidders

      const winBid = allBids.find((b: any) => b.id === item.accepted_bid_id)
      const price = winBid?.amount || 0
      const est = estimateRange(item.weight_grams || 0, item.karat || '', spot)
      const estLow = est.low || 0
      if (estLow > 0 && price < estLow) underEstimate++

      // Deltagande per handlare i denna avslutade auktion.
      bidders.forEach((did) => ensure(did as string).participated++)

      if (winBid) {
        const w = ensure(winBid.dealer_id)
        w.wins++
        w.sumBiddersWhenWon += uniqueBidders
        if (uniqueBidders <= 1) w.uncontestedWins++
      }

      if (uniqueBidders <= 1) {
        low.push({
          itemId: item.id,
          title: item.title,
          winnerName: winBid ? nameOf(winBid.dealer_id) : '-',
          price,
          estLow,
          bidders: uniqueBidders,
        })
      }
    })

    const list = Object.values(stats)
      .filter((d) => d.participated > 0 || d.bids > 0)
      .sort((a, b) => b.wins / Math.max(1, b.participated) - a.wins / Math.max(1, a.participated))

    setDealers(list)
    setLowComp(low)
    setTotals({
      closed: closed.length,
      avgBidders: closed.length ? Math.round((bidderSum / closed.length) * 10) / 10 : 0,
      underEstimate,
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="relative overflow-hidden bg-espresso-900 px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto">
          {/* Klickytan var 17 px hög. py med negativ marginal ger 29 px utan att sidhuvudet växer. */}
          <Link href="/admin" className="inline-block py-1.5 -my-1.5 text-gold-500/80 text-sm hover:text-gold-300 transition">← Adminpanel</Link>
          <h1 className="font-display text-2xl text-gold-100 mt-2">Marknadsövervakning</h1>
          <p className="text-gold-200/70 text-sm mt-1">
            Mönster som kan tyda på samordnad budgivning. Beslutsstöd, inte en anklagelse.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="h-64 rounded-2xl skeleton" />
        ) : (
          <>
            {/* Nyckeltal. Tre kolumner i 390 px gav 100 px breda kort med
                etiketter på tre rader, därför en kolumn under sm. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="card p-4">
                <p className="font-display text-2xl text-espresso-900 tabular-nums">{totals.closed}</p>
                <p className="text-xs text-espresso-400 mt-0.5">Avslutade auktioner</p>
              </div>
              <div className="card p-4">
                <p className="font-display text-2xl text-espresso-900 tabular-nums">{totals.avgBidders}</p>
                <p className="text-xs text-espresso-400 mt-0.5">Snitt antal budgivare</p>
              </div>
              <div className="card p-4">
                <p className="font-display text-2xl text-espresso-900 tabular-nums">{totals.underEstimate}</p>
                <p className="text-xs text-espresso-400 mt-0.5">Sålda under uppskattat värde</p>
                <p className="text-[11px] text-espresso-300 mt-1">
                  Uppskattningen räknas på dagens guldkurs. Vi sparar ingen historisk kurs, så
                  jämförelsen är trubbig för äldre affärer.
                </p>
              </div>
            </div>

            {/* Handlarstatistik */}
            <h2 className="font-display text-lg text-espresso-900 mb-1">Handlarstatistik</h2>
            <p className="text-sm text-espresso-500 mb-4 leading-relaxed">
              Titta särskilt efter handlare med <strong>hög vinstandel</strong> i kombination med
              <strong> lågt snitt antal budgivare</strong> i de auktioner de vinner, det kan tyda på att konkurrensen
              hålls tillbaka.
            </p>
            {/* Tabellen mätte 503 px i en yta på 356 och rullade i sidled utan
                att det syntes. Under sm visas raderna som kort i stället, så
                alla sex värden är läsbara utan rullning. Tabellen är kvar från
                sm och uppåt, oförändrad. */}
            <div className="sm:hidden grid gap-3 mb-10">
              {dealers.length === 0 ? (
                <div className="card p-6 text-center text-espresso-300 text-sm">Ingen data än.</div>
              ) : (
                dealers.map((d) => {
                  const winRate = d.participated ? Math.round((d.wins / d.participated) * 100) : 0
                  const avgW = d.wins ? Math.round((d.sumBiddersWhenWon / d.wins) * 10) / 10 : 0
                  const flag = d.wins >= 3 && winRate >= 60 && avgW <= 1.5
                  return (
                    <div key={d.id} className={`card p-4 text-sm ${flag ? 'bg-amber-50' : ''}`}>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="font-medium text-espresso-800 break-words">{d.name}</p>
                        {flag && <span className="chip bg-amber-100 text-amber-800 border border-amber-200 text-xs">Se över</span>}
                      </div>
                      <dl className="grid grid-cols-3 gap-x-3 gap-y-2">
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-espresso-400">Bud</dt>
                          <dd className="tabular-nums text-espresso-600">{d.bids}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-espresso-400">Deltagit</dt>
                          <dd className="tabular-nums text-espresso-600">{d.participated}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-espresso-400">Vinster</dt>
                          <dd className="tabular-nums text-espresso-600">{d.wins}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-espresso-400">Vinstandel</dt>
                          <dd className="tabular-nums text-espresso-800">{winRate}%</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-[11px] uppercase tracking-wide text-espresso-400">Snitt budgivare / vinst</dt>
                          <dd className="tabular-nums text-espresso-600">{avgW || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                  )
                })
              )}
            </div>
            <div className="hidden sm:block card overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-espresso-400 border-b border-espresso-100">
                      <th className="p-3 font-medium">Handlare</th>
                      <th className="p-3 font-medium tabular-nums">Bud</th>
                      <th className="p-3 font-medium tabular-nums">Deltagit</th>
                      <th className="p-3 font-medium tabular-nums">Vinster</th>
                      <th className="p-3 font-medium tabular-nums">Vinstandel</th>
                      <th className="p-3 font-medium tabular-nums">Snitt budgivare / vinst</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealers.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-espresso-300">Ingen data än.</td></tr>
                    ) : (
                      dealers.map((d) => {
                        const winRate = d.participated ? Math.round((d.wins / d.participated) * 100) : 0
                        const avgW = d.wins ? Math.round((d.sumBiddersWhenWon / d.wins) * 10) / 10 : 0
                        // Signal: hög vinstandel + få budgivare vid vinst.
                        const flag = d.wins >= 3 && winRate >= 60 && avgW <= 1.5
                        return (
                          <tr key={d.id} className={`border-b border-espresso-50 ${flag ? 'bg-amber-50' : ''}`}>
                            <td className="p-3 text-espresso-800">
                              {d.name}
                              {flag && <span className="chip ml-2 bg-amber-100 text-amber-800 border border-amber-200 text-xs">Se över</span>}
                            </td>
                            <td className="p-3 tabular-nums text-espresso-600">{d.bids}</td>
                            <td className="p-3 tabular-nums text-espresso-600">{d.participated}</td>
                            <td className="p-3 tabular-nums text-espresso-600">{d.wins}</td>
                            <td className="p-3 tabular-nums text-espresso-800">{winRate}%</td>
                            <td className="p-3 tabular-nums text-espresso-600">{avgW || '-'}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lågkonkurrens-auktioner */}
            <h2 className="font-display text-lg text-espresso-900 mb-1">Auktioner med låg konkurrens</h2>
            <p className="text-sm text-espresso-500 mb-4 leading-relaxed">
              Avslutade auktioner som vunnits utan att någon annan handlare budade emot. Enstaka fall är helt normala,
              men en handlare som återkommer här är värd en närmare titt.
            </p>
            {/* Samma sak här: 459 px i 356. Kort under sm, tabell från sm. */}
            <div className="sm:hidden grid gap-3">
              {lowComp.length === 0 ? (
                <div className="card p-6 text-center text-espresso-300 text-sm">Inga lågkonkurrens-auktioner. Bra tecken.</div>
              ) : (
                lowComp.map((r) => (
                  <div key={r.itemId} className="card p-4 text-sm">
                    <Link href={`/auctions/${r.itemId}`} className="block py-1 font-medium text-gold-700 hover:text-gold-800 break-words">
                      {r.title}
                    </Link>
                    <dl className="grid grid-cols-[auto,minmax(0,1fr)] gap-x-4 gap-y-1 mt-1">
                      <dt className="text-espresso-400">Vinnare</dt>
                      <dd className="text-espresso-700 text-right break-words">{r.winnerName}</dd>
                      <dt className="text-espresso-400">Slutpris</dt>
                      <dd className="tabular-nums text-espresso-800 text-right whitespace-nowrap">{formatSEK(r.price)}</dd>
                      <dt className="text-espresso-400">Uppskattat</dt>
                      <dd className="tabular-nums text-espresso-500 text-right whitespace-nowrap">{r.estLow ? formatSEK(r.estLow) : '-'}</dd>
                    </dl>
                  </div>
                ))
              )}
            </div>
            <div className="hidden sm:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-espresso-400 border-b border-espresso-100">
                      <th className="p-3 font-medium">Föremål</th>
                      <th className="p-3 font-medium">Vinnare</th>
                      <th className="p-3 font-medium tabular-nums">Slutpris</th>
                      <th className="p-3 font-medium tabular-nums">Uppskattat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowComp.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-espresso-300">Inga lågkonkurrens-auktioner. Bra tecken.</td></tr>
                    ) : (
                      lowComp.map((r) => (
                        <tr key={r.itemId} className="border-b border-espresso-50">
                          <td className="p-3">
                            <Link href={`/auctions/${r.itemId}`} className="inline-block py-1.5 -my-1.5 text-gold-700 hover:text-gold-800">{r.title}</Link>
                          </td>
                          <td className="p-3 text-espresso-700">{r.winnerName}</td>
                          <td className="p-3 tabular-nums text-espresso-800">{formatSEK(r.price)}</td>
                          <td className="p-3 tabular-nums text-espresso-500">{r.estLow ? formatSEK(r.estLow) : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
