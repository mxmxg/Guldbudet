import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/orders/[id]/seller
// Returns the private seller's identity (namn, personnummer, adress) for a won
// order. The seller is anonymous everywhere else on the platform, but the
// winning dealer legally needs to document who they bought the item from
// (inköpsunderlag, VMB, handel med begagnade varor). RLS deliberately hides
// customer profiles from dealers, so this runs with the service role and
// enforces access itself: only the order's own dealer, or an admin, may read it.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id
  if (!orderId) {
    return NextResponse.json({ error: 'missing_order_id' }, { status: 400 })
  }

  // Same auth pattern as the rest of the routes: Bearer access token.
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const {
    data: { user },
  } = await createRouteClient(req).auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  const serviceHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  // Read the order with the service role, then enforce access ourselves.
  const found = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,seller_id,dealer_id`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const rows = await found.json().catch(() => [])
  const order = Array.isArray(rows) ? rows[0] : null
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  // Only the winning dealer of this order, or an admin, may see the seller.
  let allowed = order.dealer_id === user.id
  if (!allowed) {
    const profRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      { headers: serviceHeaders, cache: 'no-store' }
    )
    const profRows = await profRes.json().catch(() => [])
    allowed = Array.isArray(profRows) && profRows[0]?.role === 'admin'
  }
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Return only the identification fields the dealer needs for their books.
  const sellerRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(order.seller_id)}&select=full_name,personal_number,address,postal_code,city`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const sellerRows = await sellerRes.json().catch(() => [])
  const seller = Array.isArray(sellerRows) ? sellerRows[0] : null
  if (!seller) {
    return NextResponse.json({ error: 'seller_not_found' }, { status: 404 })
  }

  return NextResponse.json({ seller })
}
