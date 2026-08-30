import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { mayReleaseSellerIdentity, logIdentityDisclosure } from '@/lib/identityRelease'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/orders/[id]/seller
// Returns the private seller's identity (namn, personnummer, adress) for a won
// order. The seller is anonymous everywhere else on the platform, but the
// winning dealer legally needs to document who they bought the item from
// (inköpsunderlag, VMB, handel med begagnade varor). RLS deliberately hides
// customer profiles from dealers, so this runs with the service role and
// enforces access itself.
//
// Who and when is decided in lib/identityRelease, shared with the invoice-pdf
// route so the two cannot drift apart, and every release is written to
// identity_disclosures before the data leaves the server.

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
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
      orderId
    )}&select=id,seller_id,dealer_id,status,dealer_paid_at,refunded_at`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const rows = await found.json().catch(() => [])
  const order = Array.isArray(rows) ? rows[0] : null
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  const profRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const profRows = await profRes.json().catch(() => [])
  const isAdmin = Array.isArray(profRows) && profRows[0]?.role === 'admin'

  const decision = mayReleaseSellerIdentity(order, user.id, isAdmin)
  if (!decision.allowed) {
    // Ett utlämnande som inte är tillåtet ska inte gå att skilja från en affär
    // som inte finns, annars går det att kartlägga vilka affärer som existerar.
    const status = decision.reason === 'not_a_party' ? 403 : 409
    return NextResponse.json({ error: decision.reason }, { status })
  }

  // Spåret skrivs INNAN uppgifterna lämnar servern. Går det inte att skriva
  // lämnar vi inte ut något: ett utlämnande utan spår är det vi bygger bort.
  const logged = await logIdentityDisclosure(supabaseUrl, serviceHeaders, {
    orderId: order.id,
    sellerId: order.seller_id,
    requestedBy: user.id,
    requesterRole: decision.role,
    channel: 'seller_api',
  })
  if (!logged) {
    return NextResponse.json({ error: 'disclosure_log_failed' }, { status: 500 })
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
