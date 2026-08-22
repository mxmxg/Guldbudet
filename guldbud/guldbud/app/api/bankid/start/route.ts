import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { iduraConfigured, makePkce, randomToken, buildAuthorizeUrl } from '@/lib/idura'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

export async function GET(request: NextRequest) {
  const supabase = createRouteClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  // Tillfällig diagnostik: /api/bankid/start?debug=1 visar vad servern ser.
  if (request.nextUrl.searchParams.get('debug') === '1') {
    return NextResponse.json({
      hasUser: !!user,
      authError: error?.message || null,
      iduraConfigured: iduraConfigured(),
      cookieNames: request.cookies.getAll().map((c) => c.name),
      site: SITE,
    })
  }

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
