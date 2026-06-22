import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuctionDetails from '@/components/AuctionDetails'

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: item } = await supabase
    .from('items').select('*, profiles(full_name)')
    .eq('id', params.id).single()
  if (!item) return notFound()
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <AuctionDetails item={item} />
    </div>
  )
}
