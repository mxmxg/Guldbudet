'use server'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function approveDealer(dealerId: string) {
  const supabase = createClient()
  await supabase.from('profiles').update({ approved: true }).eq('id', dealerId)
  revalidatePath('/admin')
}

export async function rejectDealer(dealerId: string) {
  const supabase = createClient()
  await supabase.from('profiles').delete().eq('id', dealerId)
  revalidatePath('/admin')
}

export async function approveItem(itemId: string) {
  const supabase = createClient()
  await supabase.from('items').update({ 
    status: 'active',
    auction_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }).eq('id', itemId)
  revalidatePath('/admin')
}

export async function rejectItem(itemId: string) {
  const supabase = createClient()
  await supabase.from('items').update({ status: 'rejected' }).eq('id', itemId)
  revalidatePath('/admin')
}
