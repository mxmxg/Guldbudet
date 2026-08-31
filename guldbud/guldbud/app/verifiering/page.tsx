'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ShieldIcon } from '@/components/Icons'
import VerifiedBadge from '@/components/VerifiedBadge'

const ERROR_TEXT: Record<string, string> = {
  ej_konfigurerad: 'BankID är inte aktiverat än. Vi öppnar det inom kort.',
  avbruten: 'Verifieringen avbröts. Klicka på knappen för att försöka igen.',
  ogiltig_session: 'Det tog för lång tid. Klicka på knappen och försök igen.',
  verifiering_misslyckades: 'Verifieringen kunde inte slutföras. Försök igen.',
  serverkonfig: 'Ett tekniskt fel uppstod hos oss. Försök igen om en liten stund.',
  kunde_ej_spara: 'Vi kunde inte spara verifieringen just nu. Försök igen.',
  personnummer_upptaget:
    'Det här personnumret är redan kopplat till ett annat konto hos oss. Logga in på det kontot, eller kontakta info@guldbud.com så hjälper vi dig.',
}

export default function VerifieringPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [name, setName] = useState<string>('')
  // Rollen styr texten och vart knappen leder. Sidan talade tidigare bara till
  // säljaren ("du kan lägga ut föremål"), vilket blev fel så fort handlare
  // också måste legitimera sig.
  const [role, setRole] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [starting, setStarting] = useState(false)

  // Skickar klientens access_token till start-routen (pålitligare än att servern
  // läser sessionen ur cookies) och skickar sedan vidare till BankID.
  const startBankId = async () => {
    setStarting(true)
    setBanner(null)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/auth/login'
      return
    }
    try {
      const res = await fetch('/api/bankid/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
        return
      }
      if (json.error === 'not_authenticated') {
        window.location.href = '/auth/login'
        return
      }
      setBanner({ kind: 'error', text: ERROR_TEXT[json.error] || 'Kunde inte starta BankID. Försök igen.' })
    } catch {
      setBanner({ kind: 'error', text: 'Kunde inte starta BankID. Försök igen.' })
    }
    setStarting(false)
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get('ok')) setBanner({ kind: 'ok', text: 'Din identitet är nu verifierad med BankID.' })
    const err = q.get('error')
    if (err)
      setBanner({
        kind: 'error',
        text: ERROR_TEXT[err] || 'Verifieringen kunde inte slutföras. Klicka på knappen för att försöka igen.',
      })

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('identity_verified, verified_name, role')
          .eq('id', user.id)
          .single()
        setVerified(!!p?.identity_verified)
        setName(p?.verified_name || '')
        setRole(p?.role ?? null)
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDealer = role === 'dealer'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-14">
        {banner && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm border ${
              banner.kind === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {banner.text}
          </div>
        )}

        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-4">
            <ShieldIcon size={26} strokeWidth={1.4} />
          </div>

          {loading ? (
            <div className="h-24 rounded-xl skeleton" />
          ) : verified ? (
            <>
              <div className="flex justify-center mb-3">
                <VerifiedBadge verified />
              </div>
              <h1 className="font-display text-2xl text-espresso-900 mb-1">Du är verifierad</h1>
              <p className="text-sm text-espresso-500">
                {name ? `Verifierad som ${name}.` : 'Din identitet är bekräftad med BankID.'}{' '}
                {isDealer
                  ? 'Du kan lägga bud på auktionerna.'
                  : 'Du kan lägga ut föremål och ta emot utbetalning.'}
              </p>
              <p className="text-xs text-espresso-400 mt-3">
                Det här behöver bara göras en gång. Märket följer med kontot.
              </p>
              <Link href={isDealer ? '/dealer/dashboard' : '/customer/submit'} className="btn-gold mt-6 inline-flex">
                {isDealer ? 'Till handlarpanelen' : 'Lägg ut ett föremål'}
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl text-espresso-900 mb-1">Verifiera dig med BankID</h1>
              <p className="text-sm text-espresso-500 mb-6 leading-relaxed">
                {isDealer
                  ? 'Säljarna hos oss är privatpersoner, och vi lovar dem att varje handlare är legitimerad. Därför legitimerar du dig med BankID innan du lägger bud.'
                  : 'För din och köparnas trygghet verifierar vi din identitet med BankID innan du lägger ut föremål och innan utbetalning.'}{' '}
                Det tar några sekunder och <strong>görs bara en gång</strong>.
              </p>
              <button onClick={startBankId} disabled={starting} className="btn-gold inline-flex">
                {starting ? 'Startar...' : 'Verifiera med BankID'}
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-espresso-400 text-center mt-4">
          Vi sparar din verifierade identitet säkert och delar den aldrig med andra användare.
        </p>
      </div>
      <Footer />
    </div>
  )
}
