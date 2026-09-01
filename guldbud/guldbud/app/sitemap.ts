import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

// När sidans text senast ändrades i sak, per sida.
//
// Google använder lastmod för att prioritera vad som ska hämtas om, och en ny
// domän har en snålt tilltagen genomsökningsbudget. Utan datum får varje sida
// samma prioritet, och den 1 september 2026 låg 18 adresser i Search Console
// som "upptäckt, inte indexerad" med tom kolumn för senaste genomsökning,
// alltså aldrig hämtade.
//
// Datumen sätts för hand, aldrig till byggtiden. En sitemap som påstår att
// varje sida ändrades vid senaste deployen ljuger vid varje deploy, och då
// slutar Google lita på uppgiften helt. Ändrar du texten på en sida: flytta
// fram datumet på den raden, ingen annan.
//
// Startvärdena är hämtade ur git, alltså när filen senast ändrades.
const PAGE_UPDATED: Record<string, string> = {
  '': '2026-08-31',
  '/auctions': '2026-08-31',
  '/resultat': '2026-08-31',
  '/how-it-works': '2026-08-31',
  '/dealer/guide': '2026-08-31',
  '/handlarvillkor': '2026-08-29',
  '/guider': '2026-08-25',
  '/guider/salja-guld': '2026-08-31',
  '/guider/guldauktion': '2026-08-24',
  '/guider/bast-betalt-for-guld': '2026-08-31',
  '/guider/vad-ar-mitt-guld-vart': '2026-08-31',
  '/guider/guldpris-idag': '2026-08-31',
  '/guider/var-salja-guld': '2026-08-22',
  '/guider/salja-guld-online': '2026-08-27',
  '/guider/karat-18k-14k-9k': '2026-08-31',
  '/guider/salja-arvguld': '2026-08-31',
  '/guider/salja-trasigt-guld': '2026-08-27',
  '/guider/salja-guldmynt': '2026-08-31',
  '/guider/pantbank-eller-auktion': '2026-08-24',
  '/guider/salja-guld-stockholm': '2026-08-27',
  '/guider/salja-guld-goteborg': '2026-08-25',
  '/guider/salja-guld-malmo': '2026-08-25',
  '/guider/salja-vitguld-rodguld': '2026-08-31',
  '/guider/salja-guld-utan-kvitto': '2026-08-25',
  '/guider/skatt-pa-salt-guld': '2026-08-31',
  '/guider/salja-guld-uppsala': '2026-08-27',
  '/guider/salja-guld-helsingborg': '2026-08-25',
  '/terms': '2026-08-29',
  '/privacy': '2026-08-22',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = Object.entries(PAGE_UPDATED).map(([p, updated]) => ({
    url: `${SITE}${p}`,
    lastModified: new Date(updated),
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))

  let auctionPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data: items } = await supabase
      .from('items')
      .select('id, created_at')
      .eq('status', 'active')
      .or(`auction_ends_at.is.null,auction_ends_at.gt.${new Date().toISOString()}`)
    // items har ingen updated_at, så publiceringsdatumet är det enda ärliga
    // svaret på när sidan senast ändrades. Buden ändrar sidan oftare än så,
    // men de ligger i en annan tabell och changeFrequency säger redan hourly.
    auctionPages = (items || []).map((i: { id: string; created_at: string }) => ({
      url: `${SITE}/auctions/${i.id}`,
      lastModified: new Date(i.created_at),
      changeFrequency: 'hourly' as const,
      priority: 0.6,
    }))
  } catch {
    // If the DB is unreachable at build/request time, still return static pages.
  }

  return [...staticPages, ...auctionPages]
}
