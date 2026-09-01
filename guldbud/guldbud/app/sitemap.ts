import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'
import { PAGE_UPDATED } from '@/lib/pageUpdated'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

// Sidlistan och deras lastmod kommer ur lib/pageUpdated.ts, som genereras av
// scripts/sitemap-dates.mjs före varje bygge. Datumen hämtas ur git, alltså när
// sidans fil senast ändrades, och sidorna hittas automatiskt under app/. Läggs
// en ny guide till hamnar den i sitemapen utan att någon behöver komma ihåg det.
//
// Google använder lastmod för att prioritera vad som ska hämtas om, och en ny
// domän har en snålt tilltagen genomsökningsbudget. Den 1 september 2026 låg 18
// adresser i Search Console som "upptäckt, inte indexerad" med tom kolumn för
// senaste genomsökning, alltså aldrig hämtade.
//
// Aldrig byggtiden som datum: en sitemap som påstår att varje sida ändrades vid
// senaste deployen ljuger vid varje deploy, och då slutar Google lita på
// uppgiften helt.

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
