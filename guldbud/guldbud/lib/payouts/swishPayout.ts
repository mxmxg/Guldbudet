import crypto from 'crypto'
import https from 'https'

// Swish utbetalningar (Payouts-API). Byggd 2026-09-01 mot dokumentationen på
// developer.swish.nu, avsnittet "Setting up the Swish Payout API".
//
// Autentiseringen har två halvor, båda krävs:
//  1. TLS-klientcertifikatet, för mTLS-anslutningen till Swish.
//  2. Signeringscertifikatet, vars privata nyckel signerar en SHA-512-hash av
//     payloaden (SHA512withRSA, Base64). Payloaden bär dessutom
//     signeringscertifikatets serienummer i hexadecimal form.
//
// Certifikaten ligger som Base64-kodade PEM-strängar i miljövariabler och
// lämnar aldrig servern. VIKTIGT: SWISH_TLS_CERT måste innehålla HELA
// certifikatkedjan (lövcert plus mellanled, hopklistrade i en PEM), inte
// bara lövcertet. Swish server avvisar annars handskakningen med alert 40.
// Verifierat mot MSS 2026-09-01: med kedjan svarar API:t 201. Nodes
// cert-option skickar en hopklistrad kedja korrekt. Testmiljön (MSS) accepterar bara Swish egna
// testcertifikat, skarpa certifikat genereras av certifikatansvarig (CPOC) i
// Swish certifikathanterare när bankavtalet är klart. Miljön styr basadressen:
// MSS  https://mss.cpc.getswish.net  ·  produktion  https://cpc.getswish.net
//
// Beloppsgräns: SEB:s standard är 30 000 kr per utbetalning. Gränsen sätts i
// avtalet, inte här, men anropet svarar med fel om den överskrids, och
// admin-rutten faller då tillbaka på manuell banköverföring.

const API_BASE = process.env.SWISH_PAYOUT_API_BASE || 'https://cpc.getswish.net'

function pemFromEnv(name: string): string | null {
  const raw = process.env[name]
  if (!raw) return null
  try {
    return Buffer.from(raw, 'base64').toString('utf8')
  } catch {
    return null
  }
}

// Alla fyra hemligheterna plus bolagets Swish-nummer krävs. Saknas något är
// tjänsten inte konfigurerad, och admin-rutten svarar 503 i stället för att
// gissa, samma mönster som paymentsConfigured() för kortflödet.
export function swishPayoutsConfigured(): boolean {
  return !!(
    process.env.SWISH_TLS_CERT &&
    process.env.SWISH_TLS_KEY &&
    process.env.SWISH_SIGNING_CERT &&
    process.env.SWISH_SIGNING_KEY &&
    process.env.SWISH_PAYER_ALIAS
  )
}

// payoutInstructionUUID: 32 hexadecimala tecken i versaler, utan bindestreck.
export function newInstructionUuid(): string {
  return crypto.randomUUID().replace(/-/g, '').toUpperCase()
}

// Swish payeeAlias är mobilnumret på formen 46XXXXXXXXX. Profilfältet kan
// innehålla 070-123 45 67, mellanslag eller +46, så vi normaliserar.
export function normalizeSwishAlias(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('46') && digits.length >= 10) return digits
  if (digits.startsWith('0') && digits.length >= 9) return '46' + digits.slice(1)
  return null
}

type SwishResult =
  | { ok: true }
  | { ok: false; status: number; errorCode?: string; errorMessage?: string }

function request(
  method: 'POST' | 'GET',
  path: string,
  body: string | null
): Promise<{ status: number; text: string }> {
  const cert = pemFromEnv('SWISH_TLS_CERT')
  const key = pemFromEnv('SWISH_TLS_KEY')
  const url = new URL(API_BASE + path)
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method,
        cert: cert || undefined,
        key: key || undefined,
        headers: body
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
          : undefined,
        // Swish kräver TLS 1.2 eller högre.
        minVersion: 'TLSv1.2',
      },
      (res) => {
        let text = ''
        res.on('data', (c) => (text += c))
        res.on('end', () => resolve({ status: res.statusCode || 0, text }))
      }
    )
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

export async function createSwishPayout(input: {
  instructionUuid: string
  payerPaymentReference: string
  payeeAlias: string
  payeeSSN: string
  amount: number
  message: string
  callbackUrl: string
  // Hemlig per-anrop-nyckel (32-36 alfanumeriska tecken eller bindestreck).
  // Swish returnerar den oförändrad som HTTP-huvudet callbackIdentifier, och
  // callbacken avvisas om huvudet inte matchar det vi sparat på raden.
  callbackIdentifier: string
}): Promise<SwishResult> {
  const signingCertPem = pemFromEnv('SWISH_SIGNING_CERT')
  const signingKeyPem = pemFromEnv('SWISH_SIGNING_KEY')
  const payerAlias = process.env.SWISH_PAYER_ALIAS
  if (!signingCertPem || !signingKeyPem || !payerAlias) {
    return { ok: false, status: 0, errorMessage: 'Swish-utbetalningar är inte konfigurerade.' }
  }

  // Serienumret läses ur certifikatet i stället för en egen miljövariabel:
  // ett värde som kan härledas ska inte kunna glida isär från sin källa.
  const serial = new crypto.X509Certificate(signingCertPem).serialNumber

  const payload = {
    payoutInstructionUUID: input.instructionUuid,
    payerPaymentReference: input.payerPaymentReference,
    payerAlias,
    payeeAlias: input.payeeAlias,
    payeeSSN: input.payeeSSN,
    amount: input.amount.toFixed(2),
    currency: 'SEK',
    payoutType: 'PAYOUT',
    message: input.message,
    instructionDate: new Date().toISOString(),
    signingCertificateSerialNumber: serial,
  }

  // Signaturen enligt dokumentationen: SHA-512-hash av payloadens UTF-8-bytes,
  // hashen signeras därefter med SHA512withRSA. Att signeringen digestar
  // hashen en gång till är avsiktligt och speglar Swish Java-exempel exakt.
  const payloadStr = JSON.stringify(payload)
  const hash = crypto.createHash('sha512').update(payloadStr, 'utf8').digest()
  const signature = crypto.createSign('RSA-SHA512').update(hash).sign(signingKeyPem, 'base64')

  const body = JSON.stringify({
    payload,
    callbackUrl: input.callbackUrl,
    callbackIdentifier: input.callbackIdentifier,
    signature,
  })
  const res = await request('POST', '/swish-cpcapi/api/v1/payouts', body)

  if (res.status === 201) return { ok: true }
  let errorCode: string | undefined
  let errorMessage: string | undefined
  try {
    const parsed = JSON.parse(res.text)
    const first = Array.isArray(parsed) ? parsed[0] : parsed
    errorCode = first?.errorCode
    errorMessage = first?.errorMessage
  } catch {
    errorMessage = res.text?.slice(0, 300)
  }
  return { ok: false, status: res.status, errorCode, errorMessage }
}

// Slår upp en utbetalning hos Swish. Callbacken litar aldrig på sitt eget
// innehåll utan verifierar statusen här, samma skeptiska mönster som
// betalcallbacken för kortflödet.
export async function getSwishPayout(
  instructionUuid: string
): Promise<{ status: string; datePaid?: string; errorCode?: string; errorMessage?: string } | null> {
  const res = await request(
    'GET',
    `/swish-cpcapi/api/v1/payouts/${encodeURIComponent(instructionUuid)}`,
    null
  )
  if (res.status !== 200) return null
  try {
    const p = JSON.parse(res.text)
    return { status: p?.status, datePaid: p?.datePaid, errorCode: p?.errorCode, errorMessage: p?.errorMessage }
  } catch {
    return null
  }
}
