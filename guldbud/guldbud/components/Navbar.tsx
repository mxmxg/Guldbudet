'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import GoldTicker from '@/components/GoldTicker'
import Logo from '@/components/Logo'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [msgUnread, setMsgUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const notifRef = useRef<HTMLDivElement>(null)

  // Password-recovery links land on the Site URL (this page) with the token in
  // the URL. Forward to the reset-password page so the user can set a new one.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    const isRecovery = hash.includes('type=recovery')
    if (isRecovery && !window.location.pathname.startsWith('/auth/reset-password')) {
      window.location.replace('/auth/reset-password' + hash)
    }
  }, [])

  useEffect(() => {
    let channel: any = null
    let cancelled = false
    // getSession() förnyar en utgången token och överlever en kall sidladdning
    // (t.ex. återkomst från Stripe), till skillnad från getUser() som då kan
    // returnera null och få navbaren att felaktigt visa utloggat.
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user
      if (sessionUser) {
        setUser(sessionUser)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionUser.id)
          .single()
        setRole(profile?.role ?? null)
        setReady(true)
        loadNotifications(sessionUser.id)
        loadMsgUnread(sessionUser.id)
        // Live-uppdatera notisklockan när en ny notis kommer in.
        channel = supabase
          .channel(`notifs-${sessionUser.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${sessionUser.id}` },
            () => {
              loadNotifications(sessionUser.id)
              loadMsgUnread(sessionUser.id)
            }
          )
          .subscribe()
        // Om komponenten hann avmonteras medan getSession pågick, städa direkt
        // så prenumerationen inte läcker (cleanup hann köra med channel = null).
        if (cancelled) {
          supabase.removeChannel(channel)
          channel = null
        }
      } else {
        setReady(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && !window.location.pathname.startsWith('/auth/reset-password')) {
        window.location.replace('/auth/reset-password')
        return
      }
      if (!session) {
        setUser(null)
        setRole(null)
        setNotifications([])
        setMsgUnread(0)
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  // Lock body scroll while the mobile menu is open (so the panel can't scroll
  // away from its backdrop) and close it on Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifications(data || [])
  }

  // Antal olästa meddelande-notiser → badge på "Meddelanden".
  const loadMsgUnread = async (userId: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .ilike('title', '%meddelande%')
    setMsgUnread(count || 0)
  }

  const handleNotifClick = async (n: any) => {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setShowNotifs(false)
    const dest = n.link || (n.item_id ? `/auctions/${n.item_id}` : null)
    if (dest) router.push(dest)
  }

  const markAllAsRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    setMobileOpen(false)
    await supabase.auth.signOut()
    // Hård omladdning så alla server- och klientvyer remontas utan session –
    // router.refresh() ensam lämnar cachade klientkomponenter (t.ex. startsidan)
    // kvar i inloggat läge.
    window.location.href = '/'
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  // Klockan är en "nytt sedan sist"-yta: visa bara olästa. Lästa notiser
  // finns kvar i databasen men skräpar inte i dropdownen efter att man läst dem.
  const visibleNotifs = notifications.filter((n) => !n.read)

  const navLinks = () => {
    // Vänta tills vi vet om/vilken roll användaren har, annars blinkar
    // gäst-länkarna förbi och byts ut → hackig header vid varje sidladdning.
    if (!ready) return null
    if (!user)
      return (
        <>
          <NavItem href="/how-it-works">Så fungerar det</NavItem>
          <NavItem href="/auctions">Auktioner</NavItem>
        </>
      )
    if (role === 'customer')
      return (
        <>
          <NavItem href="/customer/my-items">Mina föremål</NavItem>
          <NavItem href="/customer/submit">Lägg ut föremål</NavItem>
          <NavItem href="/customer/profile">Min profil</NavItem>
        </>
      )
    if (role === 'dealer')
      return (
        <>
          <NavItem href="/dealer/dashboard">Auktioner</NavItem>
          <NavItem href="/dealer/profile">Min profil</NavItem>
        </>
      )
    if (role === 'admin')
      return (
        <>
          <NavItem href="/admin/orders">Affärer</NavItem>
          <NavItem href="/admin">Adminpanel</NavItem>
        </>
      )
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-50">
        <GoldTicker />
        <nav
          className={`relative transition-all duration-300 ${
            scrolled
              ? 'bg-espresso-900/90 backdrop-blur-xl border-b border-gold-500/15 shadow-lg'
              : 'bg-espresso-900 border-b border-espresso-800'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <Logo className="text-gold-300 text-[26px] leading-none transition-transform group-hover:scale-105" />
              <span className="hidden sm:block text-[9px] text-gold-500/70 tracking-[3px] uppercase border-l border-espresso-700 pl-3 leading-tight">
                Sveriges
                <br />
                Guldauktion
              </span>
            </Link>

            {/* Center links (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks()}
              {ready && user && (
                <Link
                  href="/meddelanden"
                  className="relative inline-flex items-center gap-1.5 text-sm text-gold-300/90 hover:text-gold-100 px-3 py-2 rounded-lg transition"
                >
                  Meddelanden
                  {msgUnread > 0 && (
                    <span className="bg-gold-500 text-espresso-900 text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 inline-flex items-center justify-center">
                      {msgUnread}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {!ready ? null : user ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setShowNotifs(!showNotifs)}
                      className="relative w-11 h-11 rounded-full flex items-center justify-center text-gold-300 hover:text-gold-100 hover:bg-espresso-800 transition"
                      aria-label="Notifieringar"
                    >
                      <BellIcon />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold ring-2 ring-espresso-900">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifs && (
                      <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-lift border border-espresso-100 z-50 overflow-hidden animate-scale-in origin-top-right">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-espresso-100">
                          <p className="font-semibold text-espresso-900 text-sm">Notifieringar</p>
                          {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-gold-600 hover:text-gold-700">
                              Markera alla lästa
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {visibleNotifs.length === 0 ? (
                            <div className="text-center py-10 px-4">
                              <div className="flex justify-center mb-2 text-espresso-300"><BellIcon /></div>
                              <p className="text-espresso-400 text-sm">Inga nya notifieringar</p>
                            </div>
                          ) : (
                            visibleNotifs.map((n) => (
                              <div
                                key={n.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleNotifClick(n)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleNotifClick(n)
                                  }
                                }}
                                className={`px-4 py-3 border-b border-espresso-50 cursor-pointer hover:bg-gold-50/60 focus:bg-gold-50/60 focus:outline-none transition ${
                                  !n.read ? 'bg-gold-50/40' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />}
                                  <div className={!n.read ? '' : 'pl-3.5'}>
                                    <p className={`text-sm font-medium ${!n.read ? 'text-espresso-900' : 'text-espresso-500'}`}>
                                      {n.title}
                                    </p>
                                    <p className="text-xs text-espresso-400 mt-0.5">{n.message}</p>
                                    <p className="text-[11px] text-espresso-300 mt-1">
                                      {new Date(n.created_at).toLocaleDateString('sv-SE', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="hidden sm:inline-flex text-sm text-gold-500/80 hover:text-gold-300 transition"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/auth/login" className="text-sm text-gold-300 hover:text-gold-100 px-3 py-2 transition">
                    Logga in
                  </Link>
                  <Link
                    href="/auth/login?mode=register"
                    className="bg-gold-sheen bg-[length:200%_auto] hover:bg-[right_center] text-espresso-900 font-semibold rounded-xl px-4 py-2 text-sm shadow-gold transition-all duration-300"
                  >
                    Registrera
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden w-11 h-11 rounded-full flex items-center justify-center text-gold-300 hover:bg-espresso-800 transition"
                aria-label="Meny"
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {/* Mobile menu — overlay that floats over the page instead of
              pushing the hero down. */}
          {mobileOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 top-0 z-40 bg-black/40"
                onClick={() => setMobileOpen(false)}
              />
              <div id="mobile-menu" className="md:hidden absolute top-full inset-x-0 z-50 border-t border-espresso-800 bg-espresso-900 shadow-xl px-4 py-4 flex flex-col gap-1 animate-fade-in">
                <div onClick={() => setMobileOpen(false)} className="flex flex-col gap-1">
                  {navLinks()}
                  {ready && user && (
                    <Link
                      href="/meddelanden"
                      className="relative text-sm text-gold-300/90 hover:text-gold-100 px-3 py-2 rounded-lg transition inline-flex items-center gap-2"
                    >
                      Meddelanden
                      {msgUnread > 0 && (
                        <span className="bg-gold-500 text-espresso-900 text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 inline-flex items-center justify-center">
                          {msgUnread}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
                <div className="h-px bg-espresso-800 my-2" />
                {user ? (
                  <button onClick={handleLogout} className="text-left text-sm text-gold-500/80 hover:text-gold-300 px-3 py-2">
                    Logga ut
                  </button>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link href="/auth/login" className="btn-dark flex-1 !py-2.5" onClick={() => setMobileOpen(false)}>
                      Logga in
                    </Link>
                    <Link
                      href="/auth/login?mode=register"
                      className="btn-gold flex-1 !py-2.5"
                      onClick={() => setMobileOpen(false)}
                    >
                      Registrera
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </header>
    </>
  )
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative text-sm text-gold-300/90 hover:text-gold-100 px-3 py-2 rounded-lg transition group"
    >
      {children}
      <span className="absolute left-3 right-3 -bottom-0.5 h-px bg-gold-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </Link>
  )
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
