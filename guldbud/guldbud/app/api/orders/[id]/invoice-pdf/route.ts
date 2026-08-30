import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { renderInvoicePdf, ref, type InvoiceData } from '@/lib/pdf/invoiceDoc'
import { mayReleaseSellerIdentity, logIdentityDisclosure } from '@/lib/identityRelease'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/orders/[id]/invoice-pdf
// Returns the caller's document(s) for an order as a real PDF, matching the
// on-screen version at /orders/[id]/invoice:
//   - the seller gets their försäljnings-/utbetalningsunderlag
//   - the winning dealer (or an admin) gets inköpsnota + GuldBuds faktura,
//     including the private seller's identity for their VMB/bokföring.
// Access is enforced here (service-role reads bypass RLS): only the order's
// own seller, its own dealer, or an admin may download.

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
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  const sb = async (path: string) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers, cache: 'no-store' })
    const rows = await res.json().catch(() => [])
    return Array.isArray(rows) ? rows[0] : null
  }

  const order = await sb(
    `orders?id=eq.${encodeURIComponent(orderId)}&select=id,order_no,amount,created_at,refunded_at,refund_reason,seller_id,dealer_id,item_id,status,dealer_paid_at`
  )
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  const meProf = await sb(`profiles?id=eq.${encodeURIComponent(user.id)}&select=role`)
  const isAdmin = meProf?.role === 'admin'
  const isDealer = order.dealer_id && user.id === order.dealer_id
  const isSeller = order.seller_id && user.id === order.seller_id
  if (!isAdmin && !isDealer && !isSeller) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const item = order.item_id
    ? await sb(`items?id=eq.${encodeURIComponent(order.item_id)}&select=title,weight_grams,karat`)
    : null

  let kind: 'invoice' | 'receipt'
  let party: any = null
  let seller: any = null

  if (isAdmin || isDealer) {
    kind = 'invoice'
    const dealerId = isDealer ? user.id : order.dealer_id
    party = await sb(
      `profiles?id=eq.${encodeURIComponent(dealerId)}&select=company_name,full_name,org_number,address,postal_code,city`
    )
    // Säljarens identitet lämnas ut på samma villkor som i seller-rutten, och
    // med samma spår. Är villkoren inte uppfyllda renderas inköpsunderlaget
    // ändå, men med "Privatperson" i stället för namn och personnummer.
    const decision = mayReleaseSellerIdentity(order, user.id, isAdmin)
    if (decision.allowed) {
      const logged = await logIdentityDisclosure(
        supabaseUrl,
        { ...headers, 'Content-Type': 'application/json' },
        {
          orderId: order.id,
          sellerId: order.seller_id,
          requestedBy: user.id,
          requesterRole: decision.role,
          channel: 'invoice_pdf',
        }
      )
      if (!logged) {
        return NextResponse.json({ error: 'disclosure_log_failed' }, { status: 500 })
      }
      seller = await sb(
        `profiles?id=eq.${encodeURIComponent(order.seller_id)}&select=full_name,personal_number,address,postal_code,city`
      )
    }
  } else {
    kind = 'receipt'
    party = await sb(
      `profiles?id=eq.${encodeURIComponent(order.seller_id)}&select=company_name,full_name,org_number,address,postal_code,city`
    )
  }

  const data: InvoiceData = {
    kind,
    order: {
      id: order.id,
      order_no: order.order_no,
      amount: order.amount,
      created_at: order.created_at,
      refunded_at: order.refunded_at,
      refund_reason: order.refund_reason,
    },
    item,
    party,
    seller,
  }

  let pdf: Buffer
  try {
    pdf = await renderInvoicePdf(data)
  } catch (err: any) {
    return NextResponse.json({ error: 'pdf_failed', detail: err?.message || 'unknown' }, { status: 500 })
  }

  const name = kind === 'invoice' ? `GuldBud-faktura-${ref(order.order_no)}` : `GuldBud-underlag-${ref(order.order_no)}`
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
