'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

function validateField(name: string, value: string, role: string): string {
  switch (name) {
    case 'fullName': {
      const parts = value.trim().split(' ').filter(Boolean)
      if (parts.length < 2) return 'Ange både förnamn och efternamn.'
      if (/\d/.test(value)) return 'Namnet får inte innehålla siffror.'
      return ''
    }
    case 'phone': {
      const clean = value.replace(/[\s-]/g, '')
      if (!/^07\d{8}$/.test(clean)) return 'Måste börja med 07 och ha 10 siffror.'
      return ''
    }
    case 'personalNumber': {
      const clean = value.replace('-', '')
      if (!/^\d{10}$/.test(clean)) return 'Format: ÅÅMMDD-XXXX.'
      return ''
    }
    case 'address':
      if (value.trim().length < 5) return 'Ange en giltig gatuadress.'
      return ''
    case 'postalCode':
      if (!/^\d{3}\s?\d{2}$/.test(value.trim())) return 'Format: 123 45.'
      return ''
    case 'city':
      if (value.trim().length < 2) return 'Ange en giltig stad.'
      return ''
    case 'company':
      if (role === 'dealer' && value.trim().length < 2) return 'Ange ett giltigt företagsnamn.'
      return ''
    case 'orgNumber': {
      if (role !== 'dealer') return ''
      const clean = value.replace('-', '')
      if (!/^\d{10}$/.test(clean)) return 'Format: 556789-1234.'
      return ''
    }
    default:
      return ''
  }
}

function Field({ label, name, type = 'text', value, onChange, onBlur, error, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm text-stone-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition ${error ? 'border-red-400 bg-red-50 focus:border-red-400' : 'border-stone-200 focus:border-gold-400'}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function LoginForm() {
  const params = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'customer' | 'dealer'>(
    params.get('role') === 'dealer' ? 'dealer' : 'customer'
  )
  const [fields, setFields] = useState({
    fullName: '', phone: '', personalNumber: '', address: '',
    postalCode: '', city: '', company: '', orgNumber: '', email: '', password: ''
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (params.get('mode') === 'register') setMode('register')
  }, [])

  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [name]: e.target.value }))

  const blur = (name: string) => () =>
    setTouched(t => ({ ...t, [name]: true }))

  const err = (name: string) =>
    touched[name] ? validateField(name, fields[name], role) : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError('')

    if (mode === 'register') {
      const registerFields = ['fullName', 'phone', 'personalNumber', 'address', 'postalCode', 'city']
      if (role === 'dealer') registerFields.push('company', 'orgNumber')

      const allTouched = Object.fromEntries(registerFields.map(f => [f, true]))
      setTouched(t => ({ ...t, ...allTouched }))

      const hasErrors = registerFields.some(f => validateField(f, fields[f], role))
      if (hasErrors) {
        setSubmitError('Kontrollera fälten ovan.')
        setLoading(false)
        return
      }
    }

    if (mode === 'login') {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: fields.email, password: fields.password
      })
      if (error) {
        setSubmitError('Fel e-post eller lösenord.')
        setLoading(false)
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      window.location.href = profile?.role === 'dealer' ? '/dealer/dashboard' : '/'
    } else {
      const { error } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.password,
        options: {
          data: {
            full_name: fields.fullName,
            role,
            phone: fields.phone,
            personal_number: fields.personalNumber,
            address: fields.address,
            postal_code: fields.postalCode,
            city: fields.city,
            company_name: fields.company,
            org_number: fields.orgNumber,
          }
        }
      })
      if (error) {
        setSubmitError('Fel: ' + error.message)
        setLoading(false)
        return
      }
      window.location.href = role === 'dealer' ? '/auth/pending' : '/auth/verify'
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
                <Field label="Namn" name="fullName" value={fields.fullName} onChange={set('fullName')} onBlur={blur('fullName')} error={err('fullName')} placeholder="Anna Andersson" />
                <Field label="Telefon" name="phone" type="tel" value={fields.phone} onChange={set('phone')} onBlur={blur('phone')} error={err('phone')} placeholder="0701234567" />
                <Field label="Personnummer" name="personalNumber" value={fields.personalNumber} onChange={set('personalNumber')} onBlur={blur('personalNumber')} error={err('personalNumber')} placeholder="ÅÅMMDD-XXXX" />
                <Field label="Adress" name="address" value={fields.address} onChange={set('address')} onBlur={blur('address')} error={err('address')} placeholder="Storgatan 1" />
                <div className="flex gap-3">
                  <div className="w-1/3">
                    <Field label="Postnummer" name="postalCode" value={fields.postalCode} onChange={set('postalCode')} onBlur={blur('postalCode')} error={err('postalCode')} placeholder="123 45" />
                  </div>
                  <div className="flex-1">
                    <Field label="Stad" name="city" value={fields.city} onChange={set('city')} onBlur={blur('city')} error={err('city')} placeholder="Stockholm" />
                  </div>
                </div>
                {role === 'dealer' && (
                  <>
                    <Field label="Företagsnamn" name="company" value={fields.company} onChange={set('company')} onBlur={blur('company')} error={err('company')} placeholder="Stockholms Guldhandel AB" />
                    <Field label="Organisationsnummer" name="orgNumber" value={fields.orgNumber} onChange={set('orgNumber')} onBlur={blur('orgNumber')} error={err('orgNumber')} placeholder="556789-1234" />
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-sm text-stone-600 mb-1">E-post</label>
              <input type="email" required value={fields.email} onChange={set('email')} placeholder="namn@exempel.se"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-400 transition" />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">Lösenord</label>
              <input type="password" required minLength={6} value={fields.password} onChange={set('password')} placeholder="Minst 6 tecken"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-400 transition" />
            </div>

            {submitError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{submitError}</p>}

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
