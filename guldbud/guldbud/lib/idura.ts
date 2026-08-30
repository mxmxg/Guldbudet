import crypto from 'crypto'
import { normalizeSsn } from './identity'

// BankID via Idura (tidigare Criipto), OIDC. Vi använder standard-OIDC med PKCE.
// Konfigureras helt via env, så koden ligger klar och väntar på test-nycklarna.
//   IDURA_DOMAIN         t.ex. guldbud-test.criipto.id (Idura behåller .criipto.id-domäner)
//   IDURA_CLIENT_ID
//   IDURA_CLIENT_SECRET
// Redirect-URI byggs från NEXT_PUBLIC_SITE_URL: {site}/api/bankid/callback

const DOMAIN = process.env.IDURA_DOMAIN || ''
const CLIENT_ID = process.env.IDURA_CLIENT_ID || ''
const CLIENT_SECRET = process.env.IDURA_CLIENT_SECRET || ''
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

// Svenskt BankID hos Idura/Criipto.
const ACR_VALUES = 'urn:grn:authn:se:bankid'

export function iduraConfigured() {
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

// Byter authorization code mot tokens hos Iduras token-endpoint. Anropet sker
// server-till-server över TLS med vår client_secret, så id_token som returneras
// kommer direkt från Idura (betrodd kanal).
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
    throw new Error(`Idura token exchange failed (${res.status}): ${detail.slice(0, 300)}`)
  }
  return (await res.json()) as { id_token?: string; access_token?: string }
}

export type VerifiedIdentity = { name: string; ssn: string }

// ---------------------------------------------------------------------------
// OIDC-metadata och signeringsnycklar.
//
// Både utfärdaren (issuer) och adressen till nycklarna läses ur leverantörens
// discovery-dokument i stället för att gissas ihop av domännamnet. Gissar man
// fel på issuer-strängen slutar BankID fungera den dag det slås på skarpt, och
// det felet syns inte förrän då.
// ---------------------------------------------------------------------------

type Discovery = { issuer: string; jwks_uri: string }
type Jwk = Record<string, any>

const ONE_HOUR = 60 * 60 * 1000
let discoveryCache: { at: number; value: Discovery } | null = null
let jwksCache: { at: number; uri: string; keys: Jwk[] } | null = null

async function getDiscovery(): Promise<Discovery> {
  if (discoveryCache && Date.now() - discoveryCache.at < ONE_HOUR) return discoveryCache.value
  const res = await fetch(`https://${DOMAIN}/.well-known/openid-configuration`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Kunde inte hämta OIDC-metadata (${res.status})`)
  const data: any = await res.json().catch(() => null)
  const issuer = typeof data?.issuer === 'string' ? data.issuer : ''
  const jwksUri = typeof data?.jwks_uri === 'string' ? data.jwks_uri : ''
  if (!issuer || !jwksUri) throw new Error('OIDC-metadata saknar issuer eller jwks_uri')
  const value = { issuer, jwks_uri: jwksUri }
  discoveryCache = { at: Date.now(), value }
  return value
}

async function getJwks(uri: string, force = false): Promise<Jwk[]> {
  if (!force && jwksCache && jwksCache.uri === uri && Date.now() - jwksCache.at < ONE_HOUR) {
    return jwksCache.keys
  }
  const res = await fetch(uri, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Kunde inte hämta signeringsnycklar (${res.status})`)
  const data: any = await res.json().catch(() => null)
  const keys: Jwk[] = Array.isArray(data?.keys) ? data.keys : []
  if (keys.length === 0) throw new Error('Nyckeluppsättningen är tom')
  jwksCache = { at: Date.now(), uri, keys }
  return keys
}

function pickKey(keys: Jwk[], kid: string | undefined): Jwk | null {
  const usable = keys.filter((k) => k.kty === 'RSA' && (!k.use || k.use === 'sig'))
  if (kid) return usable.find((k) => k.kid === kid) || null
  // Utan kid går det bara om det finns exakt en tänkbar nyckel. Att prova alla
  // vore att göra nyckelvalet till en gissning.
  return usable.length === 1 ? usable[0] : null
}

function decodeSegment(seg: string): Record<string, any> {
  return JSON.parse(Buffer.from(seg, 'base64url').toString('utf8'))
}

// Verifierar id_token och plockar ut identiteten.
//
// Att token kommer från en betrodd server-till-server-kanal räcker inte som
// skäl att hoppa över signaturen: den dagen någon del av kedjan byts ut, eller
// ett svar kommer någon annan väg, är signaturen det enda som säger att
// innehållet är leverantörens och inte någon annans.
export async function extractIdentity(
  idToken: string,
  expectedNonce: string
): Promise<VerifiedIdentity> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Ogiltig id_token')

  const header = decodeSegment(parts[0])
  // Bara RS256. Att läsa algoritmen ur token och lita på den är det klassiska
  // JWT-felet: 'none' eller ett byte till HMAC gör signaturen meningslös.
  if (header.alg !== 'RS256') throw new Error(`Otillåten signaturalgoritm (${header.alg})`)

  const { issuer, jwks_uri } = await getDiscovery()

  const signedInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8')
  const signature = Buffer.from(parts[2], 'base64url')
  const verify = (jwk: Jwk) =>
    crypto.verify(
      'RSA-SHA256',
      signedInput,
      crypto.createPublicKey({ key: jwk as any, format: 'jwk' }),
      signature
    )

  let jwk = pickKey(await getJwks(jwks_uri), header.kid)
  let ok = jwk ? verify(jwk) : false
  if (!ok) {
    // Nycklar roteras. Hämta om en gång innan vi underkänner token.
    jwk = pickKey(await getJwks(jwks_uri, true), header.kid)
    ok = jwk ? verify(jwk) : false
  }
  if (!ok) throw new Error('Signaturen på id_token går inte att verifiera')

  const payload = decodeSegment(parts[1])

  // Samtliga kontroller är obligatoriska. Tidigare släppte en token utan nonce
  // eller exp igenom, eftersom kontrollerna bara gjordes om fältet fanns.
  const strip = (s: string) => s.replace(/\/$/, '')
  if (typeof payload.iss !== 'string' || strip(payload.iss) !== strip(issuer)) {
    throw new Error('Fel utfärdare')
  }
  if (!payload.nonce || payload.nonce !== expectedNonce) throw new Error('Nonce stämmer inte')
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!CLIENT_ID || !aud.includes(CLIENT_ID)) throw new Error('Fel audience')
  if (typeof payload.exp !== 'number' || Date.now() / 1000 > payload.exp) {
    throw new Error('id_token har gått ut')
  }

  // Idura/Criipto exponerar personnumret under något av dessa claims beroende
  // på konfiguration. `sub` är INTE med i listan: den är ett ogenomskinligt
  // subject-id, inte ett personnummer, och att falla tillbaka på den skrev in
  // en identifierare som såg ut som ett verifierat personnummer utan att vara
  // det.
  const rawSsn =
    payload.ssn ||
    payload.socialno ||
    payload.personalNumber ||
    payload['https://data.criipto.com/ssn'] ||
    ''
  const ssn = normalizeSsn(rawSsn)
  if (!ssn) throw new Error('Kunde inte läsa ett giltigt personnummer ur BankID-svaret')

  const name: string =
    payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ') || ''

  return { name, ssn }
}
