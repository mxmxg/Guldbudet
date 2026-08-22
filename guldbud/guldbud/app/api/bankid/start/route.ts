import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { iduraConfigured, makePkce, randomToken, buildAuthorizeUrl } from '@/lib/idura'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Startar BankID-flödet. Klienten (som säkert känner sin session) skickar sitt
// access_token i Authorization-headern. Vi validerar det mot Supabase Auth
// (getUser(token)) i stället för att läsa den sköra cookie-sessionen. Den
// validerade user-iden bäddas in i en httpOnly-cookie tillsammans med PKCE/state,
// så callbacken vet vem verifieringen gäller utan att läsa sessionen igen.
export async function POST(request: NextRequest) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const supabase = createRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  if (!iduraConfigured()) return NextResponse.json({ error: 'ej_konfigurerad' }, { status: 503 })

  const state = randomToken()
  const nonce = randomToken()
  const { verifier, challenge } = makePkce()

  const res = NextResponse.json({ url: buildAuthorizeUrl({ state, nonce, codeChallenge: challenge }) })
  res.cookies.set('bankid_flow', JSON.stringify({ state, nonce, verifier, userId: user.id }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
