'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import AuthShell, { AuthInput, AuthButton } from '@/components/AuthShell'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // The browser client processes the recovery token in the URL automatically
  // (detectSessionInUrl). Give it a moment, then confirm a session exists.
  useEffect(() => {
    let active = true
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (active) setReady(!!data.session)
    }
    check()
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (active && session) setReady(true)
    })
    const t = setTimeout(check, 1200)
    return () => {
      active = false
      clearTimeout(t)
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Lösenorden matchar inte'); return }
    if (password.length < 6) { setError('Lösenordet måste vara minst 6 tecken'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(
        error.message.toLowerCase().includes('session')
          ? 'Länken har gått ut eller är ogiltig. Begär en ny återställningslänk från inloggningssidan.'
          : error.message
      )
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 2000)
  }

  return (
    <AuthShell>
      <h1 style={{ color: '#D4AF37', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
        Välj nytt lösenord
      </h1>
      {ready === false && (
        <div
          style={{
            marginBottom: '16px',
            fontSize: '13px',
            background: '#2a1f0a',
            border: '1px solid #7a5a1a',
            color: '#d9b45a',
            padding: '10px 12px',
            borderRadius: '8px',
            lineHeight: 1.5,
          }}
        >
          Vi hittar ingen aktiv återställningslänk. Öppna länken från mejlet igen, eller begär en ny via{' '}
          <Link href="/auth/login" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Glömt lösenord?
          </Link>{' '}
          på inloggningssidan.
        </div>
      )}
      {success ? (
        <p style={{ color: '#34d399', textAlign: 'center', fontSize: '14px' }}>
          Lösenordet är uppdaterat! Omdirigerar...
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#c9a84c', marginBottom: '4px' }}>
              Nytt lösenord
            </label>
            <AuthInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minst 6 tecken" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#c9a84c', marginBottom: '4px' }}>
              Bekräfta lösenord
            </label>
            <AuthInput type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Upprepa lösenordet" />
          </div>
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', background: '#2a0a0a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #7f1d1d' }}>
              {error}
            </p>
          )}
          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Sparar...' : 'Spara nytt lösenord'}
          </AuthButton>
        </form>
      )}
    </AuthShell>
  )
}
