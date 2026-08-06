'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

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
    <>
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: "'Great Vibes', cursive", fontSize: '40px' }} className="text-gold-700">
            GuldBud
          </Link>
        </div>
        <div className="card p-8">
          <h1 className="font-display text-xl text-espresso-900 mb-6">Välj nytt lösenord</h1>
          {ready === false && (
            <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl">
              Vi hittar ingen aktiv återställningslänk. Öppna länken från mejlet igen, eller begär en ny via{' '}
              <Link href="/auth/login" className="underline font-medium">Glömt lösenord?</Link> på inloggningssidan.
            </div>
          )}
          {success ? (
            <p className="text-green-600 text-center">Lösenordet är uppdaterat! Omdirigerar...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-stone-600 mb-1">Nytt lösenord</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minst 6 tecken" className="w-full" />
              </div>
              <div>
                <label className="block text-sm text-stone-600 mb-1">Bekräfta lösenord</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Upprepa lösenordet" className="w-full" />
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold mt-1">
                {loading ? 'Sparar...' : 'Spara nytt lösenord'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
