'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        setRole(profile?.role ?? null)
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-gold-900 border-b border-gold-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-gold-100 font-medium text-lg">
        <span className="text-gold-300">◆</span> GuldBud
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            {role === 'dealer' && (
              <Link href="/dealer/dashboard" className="text-gold-200 hover:text-gold-100 transition">
                Dashboard
              </Link>
            )}
            {role === 'customer' && (
              <>
                <Link href="/customer/my-items" className="text-gold-200 hover:text-gold-100 transition">
                  Mina föremål
                </Link>
                <Link href="/customer/submit" className="text-gold-200 hover:text-gold-100 transition">
                  Lägg ut föremål
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="text-gold-400 hover:text-gold-200 transition">
              Logga ut
            </button>
          </>
        ) : (
          <>
            <Link href="/customer/submit" className="text-gold-200 hover:text-gold-100 transition">
              Sälja guld
            </Link>
            <Link href="/auth/login" className="bg-gold-400 hover:bg-gold-500 text-white rounded-lg px-4 py-1.5 transition">
              Logga in
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
