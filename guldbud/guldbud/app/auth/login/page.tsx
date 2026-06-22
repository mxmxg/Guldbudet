'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

function validateForm(fields: any, role: string): string | null {
  const { fullName, phone, personalNumber, address, postalCode, city, company, orgNumber } = fields

  const nameParts = fullName.trim().split(' ').filter(Boolean)
  if (nameParts.length < 2) return 'Ange både förnamn och efternamn.'
  if (/\d/.test(fullName)) return 'Namnet får inte innehålla siffror.'

  const phoneClean = phone.replace(/[\s-]/g, '')
  if (!/^07\d{8}$/.test(phoneClean)) return 'Telefonnummer måste börja med 07 och ha 10 siffror, t.ex. 0701234567.'

  const pnClean = personalNumber.replace('-', '')
  if (!/^\d{6}\d{4}$/.test(pnClean)) return 'Personnummer måste ha formatet ÅÅMMDD-XXXX.'

  if (address.trim().length < 5) return 'Ange en giltig gatuadress.'

  if (!/^\d{3}\s?\d{2}$/.test(postalCode.trim())) return 'Postnummer måste ha formatet 123 45.'

  if (city.trim().length < 2) return 'Ange en giltig stad.'

  if (role === 'dealer') {
    if (company.trim().length < 2) return 'Ange ett giltigt företagsnamn.'
    const orgClean = orgNumber.replace('-', '')
    if (!/^\d{6}\d{4}$/.test(orgClean)) return 'Organisationsnummer måste ha formatet 556789-1234.'
  }

  return null
}

function LoginForm() {
  const params = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'customer' | 'dealer'>(
    params.get('role') === 'dealer' ? 'dealer' : 'customer'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [personalNumber, setPersonalNumber] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [company, setCompany] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (params.get('mode') === 'register') setMode('register')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'register') {
      const validationError = validateForm(
        { fullName, phone, personalNumber, address, postalCode, city, company, orgNumber },
        role
      )
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }
    }

    if (mode === 'login') {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Fel e-post eller lösenord.')
        setLoading(false)
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role === 'dealer') {
        window.location.href = '/dealer/dashboard'
      } else {
        window.location.href = '/'
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone,
            personal_number: personalNumber,
            address,
            postal_code: postalCode,
            city,
            company_name: company,
            org_number: orgNumber,
          }
        }
      })
      if (error) {
        setError('Fel: ' + error.message)
        setLoading(false)
        return
      }
      window.location.href = role === 'dealer' ? '/auth/pending' : '/customer/submit'
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-medium text-gold-900">◆ GuldBud</Link>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <div className="flex rounded-lg overflow-hidden border border-stone-200 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition ${mode === m ? 'bg-gold-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
                {m === 'login' ? 'Logga in' : 'Registrera'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <div className="flex gap-3 mb-5">
              {(['customer', 'dealer'] as const).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-lg border text-sm font-medium transition ${role === r ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                  {r === 'customer' ? '🏠 Privatperson' : '🏪 Guldhandlare'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Namn</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Anna Andersson" className="w-full" />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Telefon</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="0701234567" className="w-full" />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Personnummer</label>
                  <input type="text" required value={personalNumber} onChange={e => setPersonalNumber(e.target.value)} placeholder="ÅÅMMDD-XXXX" className="w-full" />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Adress</label>
                  <input type="text" required value={address} onChange={e => setAddress(e.target.value)} placeholder="Storgatan 1" className="w-full" />
                </div>
                <div className="flex gap-3">
                  <div className="w-1/3">
                    <label className="block text-sm text-stone-600 mb-1">Postnummer</label>
                    <input type="text" required value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="123 45" className="w-full" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-stone-600 mb-1">Stad</label>
                    <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Stockholm" className="w-full" />
                  </div>
                </div>
                {role === 'dealer' && (
                  <>
                    <div>
                      <label className="block text-sm text-stone-600 mb-1">Företagsnamn</label>
                      <input type="text" required value={company} onChange={e => setCompany(e.target.value)} placeholder="Stockholms Guldhandel AB" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-1">Organisationsnummer</label>
                      <input type="text" required value={orgNumber} onChange={e => setOrgNumber(e.target.value)} placeholder="556789-1234" className="w-full" />
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-sm text-stone-600 mb-1">E-post</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="namn@exempel.se" className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">Lösenord</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minst 6 tecken" className="w-full" />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

            {mode === 'register' && role === 'dealer' && (
              <p className="text-xs text-stone-400 bg-stone-50 p-3 rounded-lg">
                Handlarkonton granskas manuellt. Du får ett e-postmeddelande när ditt konto är godkänt.
              </p>
            )}

            {mode === 'register' && (
              <p className="text-xs text-stone-400">
                Dina personuppgifter hanteras säkert och delas aldrig med tredje part.{' '}
                <Link href="/privacy" className="underline">Integritetspolicy</Link>
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-gold mt-1">
              {loading ? 'Väntar...' : mode === 'login' ? 'Logga in' : 'Skapa konto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laddar...</div>}>
      <LoginForm />
    </Suspense>
  )
}
