import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuctionDetails from '@/components/AuctionDetails'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data: item } = await supabase
    .from('items')
    .select('title, description, weight_grams, karat, image_urls')
    .eq('id', params.id)
    .single()
  if (!item) return { title: 'Auktion · GuldBud' }
  const specs = [item.weight_grams ? `${item.weight_grams} g` : '', item.karat].filter(Boolean).join(' · ')
  const title = `${item.title}${specs ? ` – ${specs}` : ''} · GuldBud`
  const description =
    item.description?.slice(0, 160) ||
    `Bjud på ${item.title} hos GuldBud – Sveriges guldauktion. Verifierade handlare budar mot varandra.`
  const image = item.image_urls?.[0]
  return {
    title,
    description,
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
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <AuctionDetails item={item} />
    </div>
  )
}
