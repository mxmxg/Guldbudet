import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, extractIdentity } from '@/lib/idura'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

function back(qs: string) {
  return NextResponse.redirect(`${SITE}/verifiering?${qs}`)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err = url.searchParams.get('error')

  if (err) return back('error=avbruten')
  if (!code || !state) return back('error=avbruten')

  // Läs och validera flödes-cookien (state + nonce + PKCE-verifier + userId).
  // userId sattes server-side i start-routen efter att access_token validerats,
  // så den är betrodd, ingen ny sessionsläsning behövs här.
  let flow: { state: string; nonce: string; verifier: string; userId: string } | null = null
  try {
    flow = JSON.parse(req.cookies.get('bankid_flow')?.value || 'null')
  } catch {
    flow = null
  }
  if (!flow || flow.state !== state || !flow.userId) return back('error=ogiltig_session')

  let identity: { name: string; ssn: string }
  try {
    const tokens = await exchangeCode(code, flow.verifier)
    if (!tokens.id_token) throw new Error('Inget id_token')
    identity = extractIdentity(tokens.id_token, flow.nonce)
  } catch (e: any) {
    return back(`error=${encodeURIComponent('verifiering_misslyckades')}`)
  }

  // Skriv identiteten med SERVICE ROLE, inte via användarens egen update-policy.
  // Då kan ingen själv sätta identity_verified=true utan att ha kört BankID.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return back('error=serverkonfig')

  const patch = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(flow.userId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        identity_verified: true,
        verified_name: identity.name,
        verified_ssn: identity.ssn,
        identity_verified_at: new Date().toISOString(),
      }),
    }
  )
  if (!patch.ok) return back('error=kunde_ej_spara')

  const res = back('ok=1')
  res.cookies.set('bankid_flow', '', { path: '/', maxAge: 0 })
  return res
}
