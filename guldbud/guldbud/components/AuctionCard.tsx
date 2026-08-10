'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Item } from '@/lib/types'
import CountdownTimer from '@/components/CountdownTimer'
import CategoryIcon from '@/components/CategoryIcon'
import { FlameIcon, ArrowRightIcon } from '@/components/Icons'
import { formatSEK } from '@/lib/gold'

type CardItem = Item & { top_bid?: number; bid_count?: number }

function capitalize(str: string) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function AuctionCard({ item }: { item: CardItem }) {
  const img = item.image_urls?.[0]
  const topBid = item.top_bid || 0
  const bidCount = item.bid_count || 0
  const hot = bidCount >= 3
  // Beräknas efter mount (undviker hydration-mismatch): auktionen slutar inom en timme.
  const [endingSoon, setEndingSoon] = useState(false)
  useEffect(() => {
    if (!item.auction_ends_at) return
    const check = () => {
      const ms = new Date(item.auction_ends_at as string).getTime() - Date.now()
      setEndingSoon(ms > 0 && ms < 60 * 60 * 1000)
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [item.auction_ends_at])
  // Bara status, aldrig själva reservationsnivån. Beräknas server-side och
  // skickas som booleaner så min_price aldrig når klienten.
  const hasReserve = !!(item as any).has_reserve
  const reserveMet = !!(item as any).reserve_met

  return (
    <Link href={`/auctions/${item.id}`} className="group relative block card card-hover overflow-hidden">
      {/* Image */}
      <div className="h-52 relative overflow-hidden bg-espresso-900">
        {img ? (
          <Image
            src={img}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-espresso-800 to-espresso-600 flex items-center justify-center">
            <CategoryIcon category={item.category} size={54} className="text-gold-500/45 animate-float" strokeWidth={1.3} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="chip bg-espresso-900/85 backdrop-blur text-gold-200 border border-gold-500/25">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-pulse-ring" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            Live
          </span>
          {hot && (
            <span className="chip bg-red-500/90 backdrop-blur text-white">
              <FlameIcon size={12} /> Hett
            </span>
          )}
          {endingSoon && (
            <span className="chip bg-amber-500/95 backdrop-blur text-white">⏳ Slutar snart</span>
          )}
        </div>

        {/* Countdown */}
        {item.auction_ends_at && (
          <div className="absolute top-3 right-3">
            <CountdownTimer endsAt={item.auction_ends_at} variant="chip" className="backdrop-blur shadow-sm" />
          </div>
        )}

        {/* Title on image */}
        <div className="absolute bottom-3 left-4 right-4">
          {item.category && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gold-200/90 mb-1">
              <CategoryIcon category={item.category} size={13} strokeWidth={1.8} />
              {item.category}
            </span>
          )}
          <h3 className="font-display text-lg text-white leading-tight drop-shadow-sm">{capitalize(item.title)}</h3>
          <p className="text-white/70 text-xs mt-0.5">
            {item.weight_grams} g · {item.karat}
            {item.gemstone ? ` · ${item.gemstone}${item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}` : ''}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-espresso-400 uppercase tracking-wide">Högsta bud</p>
          {topBid > 0 ? (
            <p className="text-xl font-semibold text-gradient-gold tabular-nums">{formatSEK(topBid)}</p>
          ) : (
            <p className="text-base font-medium text-espresso-400">Öppet för bud</p>
          )}
          {/* Alltid samma höjd så alla kort blir lika höga; text bara när reservationspris finns */}
          <div className="mt-1 min-h-[1.05rem]">
            {hasReserve && (
              <span
                className={`text-[11px] font-medium inline-flex items-center gap-1.5 ${
                  reserveMet ? 'text-emerald-600' : 'text-espresso-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${reserveMet ? 'bg-emerald-500' : 'bg-espresso-300'}`} />
                {reserveMet ? 'Reservationspris uppnått' : 'Reservationspris ej uppnått'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="chip bg-gold-50 text-gold-700">{bidCount} bud</span>
          <p className="mt-1.5 text-xs text-gold-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Se auktion
            <ArrowRightIcon size={12} strokeWidth={2.5} />
          </p>
        </div>
      </div>
    </Link>
  )
}
