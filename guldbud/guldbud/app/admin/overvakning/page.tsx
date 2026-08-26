'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { estimateRange, formatSEK } from '@/lib/gold'

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
// samordnad budgivning – låg konkurrens, hög vinstandel hos en enskild handlare,
// försäljningar under uppskattat värde. Detta är beslutsstöd, inte en anklagelse:
// mönstren ska tolkas av admin innan någon åtgärd vidtas.
export default function OvervakningPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [dealers, setDealers] = useState<DealerStat[]>([])
  const [lowComp, setLowComp] = useState<LowComp[]>([])
  const [totals, setTotals] = useState({ closed: 0, avgBidders: 0, underEstimate: 0 })

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
      const est = estimateRange(item.weight_grams || 0, item.karat || '')
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
          winnerName: winBid ? nameOf(winBid.dealer_id) : '—',
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
          <Link href="/admin" className="text-gold-500/80 text-sm hover:text-gold-300 transition">← Adminpanel</Link>
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
            {/* Nyckeltal */}
            <div className="grid grid-cols-3 gap-3 mb-8">
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
              </div>
            </div>

            {/* Handlarstatistik */}
            <h2 className="font-display text-lg text-espresso-900 mb-1">Handlarstatistik</h2>
            <p className="text-sm text-espresso-500 mb-4 leading-relaxed">
              Titta särskilt efter handlare med <strong>hög vinstandel</strong> i kombination med
              <strong> lågt snitt antal budgivare</strong> i de auktioner de vinner, det kan tyda på att konkurrensen
              hålls tillbaka.
            </p>
            <div className="card overflow-hidden mb-10">
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
                            <td className="p-3 tabular-nums text-espresso-600">{avgW || '—'}</td>
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
            <div className="card overflow-hidden">
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
                            <Link href={`/auctions/${r.itemId}`} className="text-gold-700 hover:text-gold-800">{r.title}</Link>
                          </td>
                          <td className="p-3 text-espresso-700">{r.winnerName}</td>
                          <td className="p-3 tabular-nums text-espresso-800">{formatSEK(r.price)}</td>
                          <td className="p-3 tabular-nums text-espresso-500">{r.estLow ? formatSEK(r.estLow) : '—'}</td>
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
