import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') redirect('/')
  
  const { data: pendingDealers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'dealer')
    .eq('approved', false)
    .order('created_at', { ascending: false })
  
  const { data: pendingItems } = await supabase
    .from('items')
    .select('*, profiles(full_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  return <AdminPanel pendingDealers={pendingDealers || []} pendingItems={pendingItems || []} />
}
