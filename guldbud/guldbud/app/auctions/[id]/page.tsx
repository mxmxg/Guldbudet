import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import BidSection from '@/components/BidSection'

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: item } = await supabase
    .from('items').select('*, profiles(full_name)')
    .eq('id', params.id).single()

  if (!item) return notFound()

  const { data: bids } = await supabase
    .from('bids').select('amount, created_at, profiles(company_name, full_name)')
    .eq('item_id', params.id).order('amount', { ascending: false }).limit(10)

  const topBid = bids?.[0]?.amount || 0

  return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gold-900 to-gold-700 relative mb-3">
              {item.image_urls?.[0] ? (
                <Image src={item.image_urls[0]} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-6xl opacity-40">◆</div>
              )}
            </div>
            {item.image_urls?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.image_urls.slice(1, 5).map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden relative">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-medium text-stone-900 mb-1">{item.title}</h1>
            <p className="text-stone-400 text-sm mb-4">{item.weight_grams} g · {item.karat}</p>

            {item.description && (
              <p className="text-stone-600 text-sm mb-6 leading-relaxed">{item.description}</p>
            )}

            <div className="bg-stone-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-stone-400 mb-1">Högsta bud</p>
              <p className="text-3xl font-medium text-gold-600">
                {topBid ? topBid.toLocaleString('sv-SE') + ' kr' : 'Inga bud ännu'}
              </p>
              <p className="text-xs text-stone-400 mt-1">{bids?.length || 0} bud totalt</p>
            </div>

            <BidSection itemId={item.id} currentTop={topBid} />

            {/* Bid history */}
            {bids && bids.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-stone-700 mb-3">Budhistorik</h3>
                <div className="flex flex-col gap-2">
                  {bids.map((bid: any, i: number) => (
                    <div key={i} className={`flex justify-between items-center py-2 border-b border-stone-100 text-sm ${i === 0 ? 'text-gold-700 font-medium' : 'text-stone-500'}`}>
                      <span>{(bid.profiles?.company_name || bid.profiles?.full_name || 'Handlare').slice(0, 20)}</span>
                      <span>{bid.amount.toLocaleString('sv-SE')} kr</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
