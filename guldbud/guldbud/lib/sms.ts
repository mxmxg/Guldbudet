// Sms via 46elks. Beslutat av användaren 2026-09-15, för exakt en händelse:
// handlaren får ett sms i samma sekund som föremålet markeras som mottaget
// och kontrollerat, så betalningen till säljaren kommer igång direkt.
//
// Sms:et innehåller ALDRIG kontonumret, på användarens beslut. Ett sms från
// "GuldBud" med "betala X kr till konto Y" är exakt formen ett bluff-sms har,
// och säljarens kontouppgifter ska inte ligga i en textkanal. Sms:et säger
// bara att föremålet är kontrollerat och pekar in i affären, bakom inloggning.
//
// Tre miljövariabler, alla i Vercel: ELKS_API_USERNAME, ELKS_API_PASSWORD
// och SMS_SENDER (avsändarnamn, 3 till 11 tecken A-Z, a-z, 0-9, inte
// inledande siffra; standard GuldBud). Saknas de två första skickas inget
// sms, tyst. Sms:et får aldrig stoppa mejlet: anroparen ignorerar utfallet
// utöver loggning.
//
// API-kontraktet är kontrollerat mot 46elks dokumentation "Send an SMS",
// som användaren klistrade in 2026-09-15: POST till adressen nedan, basic
// auth, formulärfälten from, to (E.164) och message som URL-kodad UTF-8.
// Svaret är JSON med status, id, parts och cost, där cost anges i
// tiotusendelar av kontots valuta (3500 = 0,35 kr).
//
// Längd: högst 160 tecken i en del om texten håller sig inom GSM 03.38, som
// innehåller å, ä och ö. Därutöver 153 tecken per del. Texten i mejlrutten
// är uppmätt till exakt 160 tecken med en 63 tecken lång affärslänk, så
// varje ändring av den ska räknas om. Emoji ger UTF-16 och 70 tecken per
// del, använd aldrig sådana.

const ELKS_SMS_URL = 'https://api.46elks.com/a1/sms'

export type SmsResult = { ok: true; id?: string; parts?: number; cost?: number } | { ok: false; detail: string }

export function smsConfigured(): boolean {
  return !!(process.env.ELKS_API_USERNAME && process.env.ELKS_API_PASSWORD)
}

// Svenskt mobilnummer till E.164. Profilens telefonfält är fritext, så
// mellanslag, bindestreck och parenteser tas bort, inledande 0 blir +46, och
// 0046 blir +46. Allt annat än ett svenskt mobilnummer (+467...) avvisas,
// eftersom det är det enda vi har anledning att skicka till.
export function normalizeSwedishMobile(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = String(raw).replace(/[\s\-()]/g, '')
  if (d.startsWith('00')) d = '+' + d.slice(2)
  if (d.startsWith('0')) d = '+46' + d.slice(1)
  if (!/^\+467\d{8}$/.test(d)) return null
  return d
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const user = process.env.ELKS_API_USERNAME
  const pass = process.env.ELKS_API_PASSWORD
  if (!user || !pass) return { ok: false, detail: 'not_configured' }
  const from = (process.env.SMS_SENDER || 'GuldBud').trim()
  const body = new URLSearchParams({ from, to, message })
  try {
    const res = await fetch(ELKS_SMS_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, detail: `${res.status} ${await res.text().catch(() => '')}` }
    const j: any = await res.json().catch(() => null)
    return { ok: true, id: j?.id, parts: j?.parts, cost: j?.cost }
  } catch (e: any) {
    return { ok: false, detail: String(e?.message || e) }
  }
}
