'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

function LoginForm() {
  const params = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'customer' | 'dealer'>(
    params.get('role') === 'dealer' ? 'dealer' : 'customer'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (mode === 'login') {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Fel: ' + error.message)
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
        email, password,
        options: { data: { full_name: fullName, role, company_name: company } }
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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
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
              <div>
                <label className="block text-sm text-stone-600 mb-1">Namn</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Anna Andersson" className="w-full" />
              </div>
            )}
            {mode === 'register' && role === 'dealer' && (
              <div>
                <label className="block text-sm text-stone-600 mb-1">Företagsnamn</label>
                <input type="text" required value={company} onChange={e => setCompany(e.target.value)} placeholder="Stockholms Guldhandel AB" className="w-full" />
              </div>
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
              <p className="text-xs text-stone-400 bg-stone-50 p-3 rounded-lg">Handlarkonton granskas manuellt. Du får ett e-postmeddelande när ditt konto är godkänt.</p>
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
