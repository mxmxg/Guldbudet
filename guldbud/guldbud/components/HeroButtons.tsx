'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function HeroButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
  }, [])

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      <Link href="/customer/submit" className="bg-gold-400 hover:bg-gold-500 text-white font-medium rounded-lg px-6 py-3 transition">
        Lägg ut ett föremål
      </Link>
      {!isLoggedIn && (
        <Link href="/auth/login?role=dealer" className="border border-gold-400 text-gold-100 hover:bg-gold-800 font-medium rounded-lg px-6 py-3 transition">
          Logga in som handlare
        </Link>
      )}
    </div>
  )
}
