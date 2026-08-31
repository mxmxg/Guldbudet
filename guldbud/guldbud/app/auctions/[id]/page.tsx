import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuctionDetails from '@/components/AuctionDetails'
import JsonLd from '@/components/JsonLd'

const SITE = 'https://guldbud.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data: item } = await supabase
    .from('items')
    .select('title, description, weight_grams, karat, image_urls')
    .eq('id', params.id)
    .single()
  if (!item) return { title: 'Auktion · GuldBud' }
  const specs = [item.weight_grams ? `${item.weight_grams} g` : '', item.karat].filter(Boolean).join(' · ')
  const title = `${item.title}${specs ? `, ${specs}` : ''} · GuldBud`
  const description =
    item.description?.slice(0, 160) ||
    `Bjud på ${item.title} hos GuldBud, Sveriges guldauktion. Verifierade handlare budar mot varandra.`
  const image = item.image_urls?.[0]
  return {
    title,
    description,
    alternates: { canonical: `/auctions/${params.id}` },
    openGraph: { title, description, images: image ? [{ url: image }] : undefined, type: 'website' },
  }
}

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  // Do NOT embed profiles(full_name) here: the seller is a customer, and RLS
  // deliberately hides customer profiles from dealers and logged-out visitors.
  // Embedding it makes the whole fetch come back empty for everyone but the
  // owner, which 404'd every auction. The seller stays anonymous by design.
  const { data: item } = await supabase
    .from('items').select('*')
    .eq('id', params.id).single()
  if (!item) return notFound()

  // Current top bid → used as the structured-data offer price (matches the
  // visible price on the page, which Google requires).
  const { data: topBids } = await supabase
    .from('bids').select('amount')
    .eq('item_id', params.id)
    .order('amount', { ascending: false })
    .limit(1)
  const topBid = topBids?.[0]?.amount || 0

  // Är säljaren legitimerad med BankID? Hämtas via en security definer-funktion
  // som bara ger tillbaka ett ja eller nej. Att i stället läsa profiles hade
  // krävt en läspolicy, och RLS kan inte begränsa kolumner, så hela raden hade
  // blivit läsbar. Se noten i schemat vid "public reads dealer names".
  const { data: sellerVerified } = await supabase.rpc('item_seller_verified', {
    p_item: params.id,
  })

  // Reservationsnivån (min_price) skickas bara till ägaren själv. För alla andra
  // skalas talet bort och ersätts med booleaner, så köpare aldrig ser nivån.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  const isOwnerView = !!user && user.id === item.owner_id
  const hasReserve = item.min_price != null
  const reserveMet = hasReserve && topBid >= item.min_price
  const clientItem: any = isOwnerView
    ? { ...item, has_reserve: hasReserve, reserve_met: reserveMet }
    : (() => {
        // source_note (fritext om ursprung) och min_price skalas bort för alla
        // utom ägaren, så de aldrig når köpare eller anonyma besökare.
        const { min_price, source_note, ...rest } = item as any
        return { ...rest, has_reserve: hasReserve, reserve_met: reserveMet }
      })()

  const url = `${SITE}/auctions/${params.id}`
  const specs = [item.category, item.weight_grams ? `${item.weight_grams} g` : '', item.karat]
    .filter(Boolean)
    .join(' · ')
  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    description: item.description || `${item.title}, ${specs}. Bjud hos GuldBud, Sveriges guldauktion.`,
    image: item.image_urls || undefined,
    category: item.category || 'Guld',
    url,
    // Begagnat är sant för i princip allt guld som säljs här.
    itemCondition: 'https://schema.org/UsedCondition',
    ...(topBid > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: topBid,
            priceCurrency: 'SEK',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/UsedCondition',
            url,
            // Budet blev giltigt när auktionen lades ut, och gäller tills den stänger.
            ...(item.created_at ? { validFrom: String(item.created_at).slice(0, 10) } : {}),
            ...(item.auction_ends_at ? { priceValidUntil: String(item.auction_ends_at).slice(0, 10) } : {}),
            // Auktionsköp är slutgiltiga, en sann "inga returer"-policy.
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'SE',
              returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
            },
            // Vi står för och sköter frakten till den vinnande handlaren.
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'SEK' },
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'SE' },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
                transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
              },
            },
          },
        }
      : {}),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hem', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Auktioner', item: `${SITE}/auctions` },
      { '@type': 'ListItem', position: 3, name: item.title, item: url },
    ],
  }

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <Navbar />
      <AuctionDetails item={clientItem} sellerVerified={!!sellerVerified} />
    </div>
  )
}
