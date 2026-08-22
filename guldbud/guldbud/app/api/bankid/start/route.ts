import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { iduraConfigured, makePkce, randomToken, buildAuthorizeUrl } from '@/lib/idura'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

export async function GET(request: NextRequest) {
  const supabase = createRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${SITE}/auth/login`)
  }

  if (!iduraConfigured()) {
    return NextResponse.redirect(`${SITE}/verifiering?error=ej_konfigurerad`)
  }

  const state = randomToken()
  const nonce = randomToken()
  const { verifier, challenge } = makePkce()

  const res = NextResponse.redirect(buildAuthorizeUrl({ state, nonce, codeChallenge: challenge }))
  // Kortlivad, httpOnly. code_verifier lämnar aldrig baksidan.
  res.cookies.set('bankid_flow', JSON.stringify({ state, nonce, verifier }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
