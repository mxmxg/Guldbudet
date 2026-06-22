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
      <label className="block text-sm mb-1" style={{ color: '#c9a84c' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: error ? '#2a1a0a' : '#1a1208',
          border: `1px solid ${error ? '#ef4444' : '#3d2d0f'}`,
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '14px',
          color: '#f5e6c8',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#D4AF37'}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', background: '#0f0a04', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link href="/">
              <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: '48px', color: '#D4AF37', lineHeight: 1 }}>
                GuldBud
              </span>
            </Link>
            <p style={{ color: '#8B6914', fontSize: '10px', letterSpacing: '4px', marginTop: '4px' }}>SVERIGES GULDAUKTION</p>
          </div>

          {/* Kort */}
          <div style={{ background: '#1a1208', border: '1px solid #3d2d0f', borderRadius: '16px', padding: '32px' }}>

            {/* Flikar */}
            <div style={{ display: 'flex', background: '#0f0a04', borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: mode === m ? '#B8860B' : 'transparent',
                  color: mode === m ? 'white' : '#8B6914',
                  borderRadius: mode === m ? '6px' : '0',
                }}>
                  {m === 'login' ? 'Logga in' : 'Registrera'}
                </button>
              ))}
            </div>

            {/* Roll-väljare */}
            {mode === 'register' && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                {(['customer', 'dealer'] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)} style={{
                    flex: 1, padding: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s',
                    background: role === r ? '#2d1f0a' : 'transparent',
                    border: `1px solid ${role === r ? '#B8860B' : '#3d2d0f'}`,
                    color: role === r ? '#D4AF37' : '#8B6914',
                  }}>
                    {r === 'customer' ? '🏠 Privatperson' : '🏪 Guldhandlare'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'register' && (
                <>
                  <Field label="Namn" name="fullName" value={fields.fullName} onChange={set('fullName')} onBlur={blur('fullName')} error={err('fullName')} placeholder="Anna Andersson" />
                  <Field label="Telefon" name="phone" type="tel" value={fields.phone} onChange={set('phone')} onBlur={blur('phone')} error={err('phone')} placeholder="0701234567" />
                  <Field label="Personnummer" name="personalNumber" value={fields.personalNumber} onChange={set('personalNumber')} onBlur={blur('personalNumber')} error={err('personalNumber')} placeholder="ÅÅMMDD-XXXX" />
                  <Field label="Adress" name="address" value={fields.address} onChange={set('address')} onBlur={blur('address')} error={err('address')} placeholder="Storgatan 1" />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '35%' }}>
                      <Field label="Postnummer" name="postalCode" value={fields.postalCode} onChange={set('postalCode')} onBlur={blur('postalCode')} error={err('postalCode')} placeholder="123 45" />
                    </div>
                    <div style={{ flex: 1 }}>
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

              <Field label="E-post" name="email" type="email" value={fields.email} onChange={set('email')} onBlur={blur('email')} error="" placeholder="namn@exempel.se" />
              <Field label="Lösenord" name="password" type="password" value={fields.password} onChange={set('password')} onBlur={blur('password')} error="" placeholder="Minst 6 tecken" />

              {submitError && (
                <p style={{ color: '#ef4444', fontSize: '13px', background: '#2a0a0a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #7f1d1d' }}>
                  {submitError}
                </p>
              )}

              {mode === 'register' && role === 'dealer' && (
                <p style={{ color: '#8B6914', fontSize: '12px', background: '#0f0a04', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3d2d0f' }}>
                  Handlarkonton granskas manuellt. Du får ett e-postmeddelande när ditt konto är godkänt.
                </p>
              )}

              {mode === 'register' && (
                <p style={{ color: '#5a4020', fontSize: '11px' }}>
                  Dina personuppgifter hanteras säkert och delas aldrig med tredje part.{' '}
                  <Link href="/privacy" style={{ color: '#B8860B' }}>Integritetspolicy</Link>
                </p>
              )}

              <button type="submit" disabled={loading} style={{
                background: loading ? '#5a4020' : '#B8860B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                transition: 'background 0.2s',
              }}>
                {loading ? 'Väntar...' : mode === 'login' ? 'Logga in' : 'Skapa konto'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0f0a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: '48px', color: '#D4AF37' }}>GuldBud</span>
    </div>}>
      <LoginForm />
    </Suspense>
  )
}
