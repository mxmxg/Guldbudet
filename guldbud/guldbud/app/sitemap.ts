import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    '',
    '/auctions',
    '/resultat',
    '/how-it-works',
    '/dealer/guide',
    '/guider',
    '/guider/salja-guld',
    '/guider/vad-ar-mitt-guld-vart',
    '/guider/guldpris-idag',
    '/guider/karat-18k-14k-9k',
    '/guider/salja-arvguld',
    '/terms',
    '/privacy',
  ].map((p) => ({
    url: `${SITE}${p}`,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))

  let auctionPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data: items } = await supabase
      .from('items')
      .select('id')
      .eq('status', 'active')
      .or(`auction_ends_at.is.null,auction_ends_at.gt.${new Date().toISOString()}`)
    auctionPages = (items || []).map((i: { id: string }) => ({
      url: `${SITE}/auctions/${i.id}`,
      changeFrequency: 'hourly' as const,
      priority: 0.6,
    }))
  } catch {
    // If the DB is unreachable at build/request time, still return static pages.
  }

  return [...staticPages, ...auctionPages]
}
