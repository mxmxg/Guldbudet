import crypto from 'crypto'

// BankID via Criipto (OIDC). Vi använder Criiptos standard-OIDC-flöde med PKCE.
// Konfigureras helt via env, så koden ligger klar och väntar på test-nycklarna.
//   CRIIPTO_DOMAIN         t.ex. guldbud-test.criipto.id
//   CRIIPTO_CLIENT_ID
//   CRIIPTO_CLIENT_SECRET
// Redirect-URI byggs från NEXT_PUBLIC_SITE_URL: {site}/api/bankid/callback

const DOMAIN = process.env.CRIIPTO_DOMAIN || ''
const CLIENT_ID = process.env.CRIIPTO_CLIENT_ID || ''
const CLIENT_SECRET = process.env.CRIIPTO_CLIENT_SECRET || ''
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

// Svenskt BankID hos Criipto.
const ACR_VALUES = 'urn:grn:authn:se:bankid'

export function criiptoConfigured() {
  return Boolean(DOMAIN && CLIENT_ID && CLIENT_SECRET)
}

export function redirectUri() {
  return `${SITE.replace(/\/$/, '')}/api/bankid/callback`
}

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// PKCE + state/nonce. code_verifier lagras server-side (httpOnly-cookie) och
// får aldrig lämna baksidan.
export function makePkce() {
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export function randomToken() {
  return base64url(crypto.randomBytes(24))
}

export function buildAuthorizeUrl(params: { state: string; nonce: string; codeChallenge: string }) {
  const u = new URL(`https://${DOMAIN}/oauth2/authorize`)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('client_id', CLIENT_ID)
  u.searchParams.set('redirect_uri', redirectUri())
  u.searchParams.set('scope', 'openid')
  u.searchParams.set('acr_values', ACR_VALUES)
  u.searchParams.set('state', params.state)
  u.searchParams.set('nonce', params.nonce)
  u.searchParams.set('code_challenge', params.codeChallenge)
  u.searchParams.set('code_challenge_method', 'S256')
  return u.toString()
}

// Byter authorization code mot tokens hos Criiptos token-endpoint. Anropet sker
// server-till-server över TLS med vår client_secret, så id_token som returneras
// kommer direkt från Criipto (betrodd kanal).
export async function exchangeCode(code: string, codeVerifier: string) {
  const res = await fetch(`https://${DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Criipto token exchange failed (${res.status}): ${detail.slice(0, 300)}`)
  }
  return (await res.json()) as { id_token?: string; access_token?: string }
}

export type VerifiedIdentity = { name: string; ssn: string }

// Dekodar id_token-payloaden (kommer från betrodd token-endpoint) och validerar
// nonce/aud/exp. Full JWKS-signaturverifiering är ett hardening-steg (TODO).
export function extractIdentity(idToken: string, expectedNonce: string): VerifiedIdentity {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Ogiltig id_token')
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as Record<string, any>

  if (payload.nonce && payload.nonce !== expectedNonce) throw new Error('Nonce stämmer inte')
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (CLIENT_ID && !aud.includes(CLIENT_ID)) throw new Error('Fel audience')
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('id_token har gått ut')

  // Criipto exponerar personnummer och namn under något av dessa claims beroende
  // på konfiguration. Läs defensivt.
  const ssn: string =
    payload.ssn ||
    payload.socialno ||
    payload.personalNumber ||
    payload['https://data.criipto.com/ssn'] ||
    payload.sub ||
    ''
  const name: string =
    payload.name ||
    [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
    ''

  if (!ssn) throw new Error('Kunde inte läsa personnummer ur BankID-svaret')
  return { name, ssn }
}
