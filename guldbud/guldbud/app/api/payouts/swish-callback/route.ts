import { NextRequest, NextResponse } from 'next/server'
import { swishPayoutsConfigured, getSwishPayout } from '@/lib/payouts/swishPayout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/payouts/swish-callback
//
// Swish anropar hit varje gång en utbetalnings status ändras, och gör om
// anropet upp till tio gånger tills vi svarar 200. Det utnyttjar vi:
// lyckas verifieringen eller uppdateringen inte svarar vi 500, och Swish
// försöker igen om en stund.
//
// Callbackens innehåll är obetrott, vem som helst kan posta hit. Därför
// läses bara payoutInstructionUUID ur kroppen, och statusen hämtas med ett
// eget mTLS-anrop till Swish innan något skrivs. Samma skeptiska mönster
// som kortflödets betalcallback: verifiera, lita aldrig.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const uuid: string | undefined = body?.payoutInstructionUUID
  if (!uuid || !/^[0-9A-F]{32}$/i.test(uuid)) {
    // Missbildat anrop: inget att göra om, 200 så Swish inte retryar i onödan.
    return NextResponse.json({ ok: false, reason: 'bad_uuid' })
  }

  if (!swishPayoutsConfigured()) {
    return NextResponse.json({ ok: false, reason: 'not_configured' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  // Finns raden? En callback för en instruktion vi aldrig skapat ignoreras.
  const rowRes = await fetch(
    `${supabaseUrl}/rest/v1/payouts?instruction_uuid=eq.${encodeURIComponent(uuid.toUpperCase())}&select=id,status,callback_identifier`,
    { headers, cache: 'no-store' }
  )
  const rows = await rowRes.json().catch(() => [])
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return NextResponse.json({ ok: false, reason: 'unknown_instruction' })

  // Äkthetskontroll enligt Swish rekommendation: nyckeln vi skickade med
  // anropet ska komma tillbaka oförändrad i huvudet. Fel eller saknad nyckel
  // betyder att anropet inte kommer från Swish, och då rör vi ingenting.
  // 200 med flit: en förfalskare ska inte få tio nya försök.
  const cbId = req.headers.get('callbackidentifier')
  if (row.callback_identifier && cbId !== row.callback_identifier) {
    return NextResponse.json({ ok: false, reason: 'bad_identifier' })
  }

  // Redan slutförd: idempotent, svara 200 utan att skriva.
  if (row.status === 'paid') return NextResponse.json({ ok: true })

  // Verifiera mot Swish i stället för att lita på kroppen.
  const verified = await getSwishPayout(uuid.toUpperCase())
  if (!verified) {
    // Kunde inte verifiera just nu: 500 ger oss Swish nästa retry.
    return NextResponse.json({ error: 'verify_failed' }, { status: 500 })
  }

  let patch: Record<string, unknown> | null = null
  if (verified.status === 'PAID') {
    patch = { status: 'paid', paid_at: verified.datePaid || new Date().toISOString() }
  } else if (verified.status === 'ERROR') {
    patch = {
      status: 'failed',
      error_code: verified.errorCode || null,
      error_message: verified.errorMessage || null,
    }
  }
  // CREATED/DEBITED är mellanlägen: raden står kvar som initiated.
  if (!patch) return NextResponse.json({ ok: true, pending: true })

  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/payouts?instruction_uuid=eq.${encodeURIComponent(uuid.toUpperCase())}`,
    { method: 'PATCH', headers, body: JSON.stringify(patch), cache: 'no-store' }
  )
  if (!patchRes.ok) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
