'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const supabase = createClient()
  const notifRef = useRef<HTMLDivElement>(null)

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
        loadNotifications(data.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null)
        setRole(null)
        setNotifications([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifications(data || [])
  }

  const handleNotifClick = async (n: any) => {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    setShowNotifs(false)
    if (n.item_id) window.location.href = `/auctions/${n.item_id}`
  }

  const markAllAsRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <nav className="bg-[#1a1208] border-b border-[#2d1f0a] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: '32px', color: '#D4AF37', lineHeight: 1 }}>
            GuldBud
          </span>
          <span className="hidden sm:block text-[9px] text-[#8B6914] tracking-[3px] uppercase border-l border-[#3d2d0f] pl-3 leading-tight">
            Sveriges<br/>Guldauktion
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              {role === 'customer' && (
                <>
                  <Link href="/customer/my-items" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                    Mina föremål
                  </Link>
                  <Link href="/customer/submit" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                    Lägg ut föremål
                  </Link>
                </>
              )}
              {role === 'dealer' && (
                <Link href="/dealer/dashboard" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                  Auktioner
                </Link>
              )}
              {role === 'admin' && (
                <>
                  <Link href="/customer/my-items" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                    Föremål
                  </Link>
                  <Link href="/admin" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                    Adminpanel
                  </Link>
                </>
              )}

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative text-[#c9a84c] hover:text-[#D4AF37] transition p-1"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-8 w-80 bg-white rounded-xl shadow-lg border border-stone-200 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                      <p className="font-medium text-stone-900 text-sm">Notifieringar</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-[#B8860B] hover:text-[#8B6914]">
                          Markera alla som lästa
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-stone-400 text-sm text-center py-6">Inga notifieringar</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`px-4 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition ${!n.read ? 'bg-amber-50' : ''}`}
                          >
                            <p className={`text-sm font-medium ${!n.read ? 'text-stone-900' : 'text-stone-500'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5">{n.message}</p>
                            <p className="text-xs text-stone-300 mt-1">
                              {new Date(n.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {n.item_id && (
                              <p className="text-xs text-[#B8860B] mt-1">Klicka för att se auktionen →</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-[#8B6914] hover:text-[#c9a84c] transition cursor-pointer"
              >
                Logga ut
              </button>
            </>
          ) : (
            <>
              <Link href="/how-it-works" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                Så fungerar det
              </Link>
              <Link href="/auth/login" className="text-[#c9a84c] hover:text-[#D4AF37] transition">
                Logga in
              </Link>
              <Link href="/auth/login?mode=register" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white rounded-lg px-4 py-1.5 transition text-sm">
                Registrera
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
