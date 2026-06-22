import { createClient } from '@/lib/supabase-server'
import { Item } from '@/lib/types'
import Navbar from '@/components/Navbar'
import HomeContent from '@/components/HomeContent'

export default async function HomePage() {
  const supabase = createClient()
  const { data: items } = await supabase
    .from('items')
    .select('*, profiles(full_name)')
    .eq('status', 'active')
    .order('auction_ends_at', { ascending: true })

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <HomeContent items={(items || []) as Item[]} />
    </div>
  )
}
