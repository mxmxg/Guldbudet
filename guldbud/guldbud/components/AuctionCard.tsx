'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Item } from '@/lib/types'
import CountdownTimer from '@/components/CountdownTimer'
import { formatSEK } from '@/lib/gold'

type CardItem = Item & { top_bid?: number; bid_count?: number }

function capitalize(s: string) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function AuctionCard({ item }: { item: CardItem }) {
  const img = item.image_urls?.[0]
  const topBid = item.top_bid || 0
  const bidCount = item.bid_count || 0
  const hot = bidCount >= 3

  return (
    <Link
      href={`/auctions/${item.id}`}
      className="group relative block card card-hover overflow-hidden"
    >
      {/* Image */}
      <div className="h-52 relative overflow-hidden">
        {img ? (
          <Image
            src={img}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-espresso-800 to-espresso-600 flex items-center justify-center">
            <span className="text-5xl text-gold-500/40 animate-float">◆</span>
          </div>
        )}
        {/* gradient veil */}
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
            <span className="chip bg-red-500/90 backdrop-blur text-white">🔥 Hett</span>
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
          <h3 className="font-display text-lg text-white leading-tight drop-shadow-sm">
            {capitalize(item.title)}
          </h3>
          <p className="text-white/70 text-xs mt-0.5">
            {item.weight_grams} g · {item.karat}
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
        </div>
        <div className="text-right">
          <span className="chip bg-gold-50 text-gold-700">
            {bidCount} {bidCount === 1 ? 'bud' : 'bud'}
          </span>
          <p className="mt-1.5 text-xs text-gold-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Se auktion
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
        </div>
      </div>
    </Link>
  )
}
