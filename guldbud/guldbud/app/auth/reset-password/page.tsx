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
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Lösenorden matchar inte'); return }
    if (password.length < 6) { setError('Lösenordet måste vara minst 6 tecken'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-medium text-gold-900">◆ GuldBud</Link>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h1 className="text-lg font-medium text-stone-900 mb-6">Välj nytt lösenord</h1>
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
  )
}
