'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Item } from '@/lib/types'
import CountdownTimer from '@/components/CountdownTimer'
import CategoryIcon from '@/components/CategoryIcon'
import { formatSEK } from '@/lib/gold'

type CardItem = Item & { top_bid?: number; bid_count?: number }

// Fönstret för vad som räknas som "snart". Bara riktiga sluttider: finns
// ingen auktion inom ett dygn renderas ingenting alls.
const WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * "Slutar snart"-remsa ovanför auktionsrutnätet på startsidan. Visar upp till
 * fyra auktioner närmast slut, med bild, högsta bud och tickande nedräkning.
 * Beräknas efter mount så serverns och klientens klockor inte ger
 * hydration-mismatch, samma mönster som AuctionCard.
 */
export default function EndingSoonRail({ items }: { items: CardItem[] }) {
  const [soon, setSoon] = useState<CardItem[]>([])

  useEffect(() => {
    const pick = () => {
      const now = Date.now()
      const list = items
        .filter((i) => i.auction_ends_at)
        .map((i) => ({ i, ms: new Date(i.auction_ends_at as string).getTime() - now }))
        .filter(({ ms }) => ms > 0 && ms < WINDOW_MS)
        .sort((a, b) => a.ms - b.ms)
        .slice(0, 4)
        .map(({ i }) => i)
      setSoon(list)
    }
    pick()
    const t = setInterval(pick, 60000)
    return () => clearInterval(t)
  }, [items])

  if (soon.length === 0) return null

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <p className="text-sm font-semibold text-espresso-800">Slutar snart</p>
        <p className="text-xs text-espresso-400 hidden sm:block">Sista chansen att följa slutspurten</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {soon.map((item) => (
          <Link
            key={item.id}
            href={`/auctions/${item.id}`}
            className="shrink-0 flex items-center gap-3 rounded-xl bg-white border border-espresso-100 pl-2 pr-3 py-2 hover:border-gold-400 transition"
          >
            <span className="relative w-10 h-10 rounded-lg overflow-hidden bg-espresso-900 shrink-0">
              {item.image_urls?.[0] ? (
                <Image src={item.image_urls[0]} alt="" fill sizes="40px" className="object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-gold-500/60">
                  <CategoryIcon category={item.category} size={20} strokeWidth={1.5} />
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-espresso-800 truncate max-w-[180px]">
                {item.title}
              </span>
              <span className="block text-xs text-espresso-500 tabular-nums">
                {(item.top_bid || 0) > 0 ? formatSEK(item.top_bid as number) : 'Öppet för bud'}
              </span>
            </span>
            <CountdownTimer endsAt={item.auction_ends_at} className="ml-1" />
          </Link>
        ))}
      </div>
    </div>
  )
}
