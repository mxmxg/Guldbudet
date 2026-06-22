'use client' 
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import BidSection from '@/components/BidSection'
import AcceptBid from '@/components/AcceptBid'

export default function AuctionDetails({ item }: { item: any }) {
  const [bids, setBids] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [checked, setChecked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: p } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single()
        setProfile(p)
      }

      const { data: b } = await supabase
        .from('bids')
        .select('id, amount, created_at, profiles(company_name, full_name)')
        .eq('item_id', item.id)
        .order('amount', { ascending: false })
        .limit(10)
      setBids(b || [])
      setChecked(true)
    }
    load()
  }, [])

  if (!checked) return null

  const topBid = bids[0]
  const topAmount = topBid?.amount || 0
  const isOwner = user?.id === item.owner_id
  const isClosed = item.status === 'closed'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Bilder */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-stone-200 relative mb-3">
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

        {/* Detaljer */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-medium text-stone-900">{item.title}</h1>
            {isClosed && (
              <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Avslutad</span>
            )}
          </div>
          <p className="text-stone-400 text-sm mb-4">{item.weight_grams} g · {item.karat}</p>

          {item.description && (
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">{item.description}</p>
          )}

          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-stone-400 mb-1">Högsta bud</p>
            <p className="text-3xl font-medium text-[#B8860B]">
              {topAmount ? topAmount.toLocaleString('sv-SE') + ' kr' : 'Inga bud ännu'}
            </p>
            {topBid && (
              <p className="text-xs text-stone-400 mt-1">
                från {topBid.profiles?.company_name || topBid.profiles?.full_name || 'Handlare'}
              </p>
            )}
            <p className="text-xs text-stone-400 mt-1">{bids.length} bud totalt</p>
          </div>

          {/* Acceptera bud — bara för ägaren när auktionen är aktiv och det finns bud */}
          {isOwner && !isClosed && topBid && (
            <AcceptBid
              itemId={item.id}
              bidId={topBid.id}
              amount={topAmount}
              dealerName={topBid.profiles?.company_name || topBid.profiles?.full_name || 'Handlare'}
              isOwner={isOwner}
            />
          )}

          {/* Avslutad auktion — instruktioner till ägaren */}
          {isOwner && isClosed && item.accepted_bid_id && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-4">
              <p className="font-medium text-green-800 mb-1">Bud accepterat</p>
              <p className="text-sm text-stone-500 mb-4">Skicka föremålet till oss så betalar vi ut via Swish efter verifiering.</p>
              <div className="bg-[#1a1208] rounded-lg p-4 text-center">
                <p className="text-[#8B6914] text-xs tracking-widest uppercase mb-1">Skicka till</p>
                <p className="text-[#D4AF37] font-medium">GuldBud AB</p>
                <p className="text-[#c9a84c] text-sm">Storgatan 1</p>
                <p className="text-[#c9a84c] text-sm">111 22 Stockholm</p>
                <p className="text-[#8B6914] text-xs mt-2">Vid frågor: info@guldbud.com</p>
              </div>
            </div>
          )}

          {/* Budformulär — bara för handlare */}
          {!isOwner && !isClosed && profile?.role === 'dealer' && (
            <BidSection itemId={item.id} currentTop={topAmount} />
          )}

          {/* Inte inloggad */}
          {!user && (
            <div className="bg-stone-50 rounded-xl p-4 text-center mt-4">
              <p className="text-stone-500 text-sm mb-3">Logga in för att lägga bud</p>
              <a href="/auth/login" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white text-sm font-medium px-5 py-2 rounded-lg transition inline-block">
                Logga in
              </a>
            </div>
          )}

          {/* Budhistorik */}
          {bids.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-stone-700 mb-3">Budhistorik</h3>
              <div className="flex flex-col gap-2">
                {bids.map((bid: any, i: number) => (
                  <div key={i} className={`flex justify-between items-center py-2 border-b border-stone-100 text-sm ${i === 0 ? 'text-[#B8860B] font-medium' : 'text-stone-500'}`}>
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
  )
}
