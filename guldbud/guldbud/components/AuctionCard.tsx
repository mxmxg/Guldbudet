'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Item } from '@/lib/types'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff < 0) return 'Avslutad'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h/24)} d ${h%24} h`
  return `${h} h ${m} min`
}

export default function AuctionCard({ item }: { item: Item }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClient()
  const img = item.image_urls?.[0]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="block bg-white border border-stone-200 rounded-xl overflow-hidden relative">
        <div className="h-44 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center relative">
          {img ? (
            <Image src={img} alt={item.title} fill className="object-cover opacity-30 blur-sm" />
          ) : (
            <span className="text-5xl opacity-20">◆</span>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <span className="text-3xl mb-2">🔒</span>
            <p className="text-white text-sm font-medium">Logga in för att se bud</p>
            <Link
              href="/auth/login"
              className="mt-3 bg-[#B8860B] hover:bg-[#D4AF37] text-white text-xs font-medium px-4 py-1.5 rounded-lg transition"
            >
              Logga in
            </Link>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-stone-400 mb-0.5">{item.title}</h3>
          <p className="text-xs text-stone-300 mb-3">{item.weight_grams} g · {item.karat}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-stone-300">Högsta bud</p>
              <p className="text-lg font-medium text-stone-300">— — —</p>
            </div>
            {item.auction_ends_at && (
              <div className="text-right">
                <p className="text-xs text-stone-300">Tid kvar</p>
                <p className="text-sm font-medium text-stone-300">{timeLeft(item.auction_ends_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/auctions/${item.id}`} className="group block bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition">
      <div className="h-44 bg-gradient-to-br from-gold-900 to-gold-700 flex items-center justify-center relative">
        {img ? (
          <Image src={img} alt={item.title} fill className="object-cover" />
        ) : (
          <span className="text-5xl opacity-60">◆</span>
        )}
        <span className="absolute top-2 right-2 bg-gold-900 text-gold-100 text-xs px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-stone-900 mb-0.5 group-hover:text-gold-600 transition">{item.title}</h3>
        <p className="text-xs text-stone-400 mb-3">{item.weight_grams} g · {item.karat}</p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-stone-400">Högsta bud</p>
            <p className="text-lg font-medium text-gold-500">—</p>
          </div>
          {item.auction_ends_at && (
            <div className="text-right">
              <p className="text-xs text-stone-400">Tid kvar</p>
              <p className="text-sm font-medium text-stone-700">{timeLeft(item.auction_ends_at)}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
