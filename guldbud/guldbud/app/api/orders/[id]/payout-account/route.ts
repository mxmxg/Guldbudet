import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { mayReleaseSellerPayoutAccount, logIdentityDisclosure } from '@/lib/identityRelease'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/orders/[id]/payout-account
//
// Säljarens bankkonto och kontohavarens namn, till den vinnande handlaren,
// så att handlaren kan betala köpeskillingen direkt till säljaren (väg C).
// Bara de tre fälten: clearingnummer, kontonummer och namn. Personnummer och
// adress lämnas ut separat via /seller, och först efter betalning.
//
// RLS döljer kundprofiler för handlare med avsikt, så rutten går med
// servicerollen och avgör åtkomsten själv, i lib/identityRelease. Varje
// utlämning skrivs till identity_disclosures innan uppgifterna lämnar
// servern, med kanalen payout_account.
//
// Kontot är ännu inte verifierat mot banken (öppen bank-API är en
// lanseringsspärr, se CLAUDE.md). Tills dess är det säljarens egen uppgift ur
// profilen, och admin ser den bredvid BankID-namnet i affärsvyn.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id
  if (!orderId) return NextResponse.json({ error: 'missing_order_id' }, { status: 400 })

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

  const found = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
      orderId
    )}&select=id,seller_id,dealer_id,status,dealer_paid_at,refunded_at`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const rows = await found.json().catch(() => [])
  const order = Array.isArray(rows) ? rows[0] : null
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  const profRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const profRows = await profRes.json().catch(() => [])
  const isAdmin = Array.isArray(profRows) && profRows[0]?.role === 'admin'

  const decision = mayReleaseSellerPayoutAccount(order, user.id, isAdmin)
  if (!decision.allowed) {
    const status = decision.reason === 'not_a_party' ? 403 : 409
    return NextResponse.json({ error: decision.reason }, { status })
  }

  const logged = await logIdentityDisclosure(supabaseUrl, serviceHeaders, {
    orderId: order.id,
    sellerId: order.seller_id,
    requestedBy: user.id,
    requesterRole: decision.role,
    channel: 'payout_account',
  })
  if (!logged) {
    return NextResponse.json({ error: 'disclosure_log_failed' }, { status: 500 })
  }

  const sellerRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
      order.seller_id
    )}&select=full_name,verified_name,payout_bank_clearing,payout_bank_account`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  const sellerRows = await sellerRes.json().catch(() => [])
  const seller = Array.isArray(sellerRows) ? sellerRows[0] : null
  if (!seller) return NextResponse.json({ error: 'seller_not_found' }, { status: 404 })

  // BankID-namnet i första hand: det är det namn som ska stå som kontohavare.
  return NextResponse.json({
    account: {
      name: seller.verified_name || seller.full_name || null,
      clearing: seller.payout_bank_clearing || null,
      account: seller.payout_bank_account || null,
    },
  })
}
