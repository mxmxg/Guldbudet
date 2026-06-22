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

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
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
    <nav className="bg-gold-900 border-b border-gold-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-gold-100 font-medium text-lg">
        <span className="text-gold-300">◆</span> GuldBud
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
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
            {role === 'dealer' && (
              <>
                <Link href="/dealer/dashboard" className="text-gold-200 hover:text-gold-100 transition">
                  Auktioner
                </Link>
                <Link href="/dealer/my-bids" className="text-gold-200 hover:text-gold-100 transition">
                  Mina bud
                </Link>
              </>
            )}
            {role === 'admin' && (
              <>
                <Link href="/customer/my-items" className="text-gold-200 hover:text-gold-100 transition">
                  Föremål
                </Link>
                <Link href="/admin" className="text-gold-200 hover:text-gold-100 transition">
                  Adminpanel
                </Link>
              </>
            )}

            {/* Notifikationsklockka */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative text-gold-200 hover:text-gold-100 transition p-1"
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
                      <button onClick={markAllAsRead} className="text-xs text-gold-600 hover:text-gold-700">
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
                          onClick={() => markAsRead(n.id)}
                          className={`px-4 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition ${!n.read ? 'bg-gold-50' : ''}`}
                        >
                          <p className={`text-sm font-medium ${!n.read ? 'text-stone-900' : 'text-stone-500'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">{n.message}</p>
                          <p className="text-xs text-stone-300 mt-1">
                            {new Date(n.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
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
              className="text-gold-400 hover:text-gold-200 transition cursor-pointer"
            >
              Logga ut
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-gold-200 hover:text-gold-100 transition">
              Logga in
            </Link>
            <Link href="/auth/login?mode=register" className="bg-gold-400 hover:bg-gold-500 text-white rounded-lg px-4 py-1.5 transition">
              Registrera
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
