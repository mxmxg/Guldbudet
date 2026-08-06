import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuctionDetails from '@/components/AuctionDetails'

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
