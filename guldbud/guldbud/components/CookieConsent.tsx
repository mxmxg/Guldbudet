'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Lightweight cookie notice. We only use necessary cookies (login/session),
// so this is an informational acknowledgement stored in localStorage.
export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('gb-cookie-consent')) setShow(true)
    } catch {
      // localStorage unavailable — don't block the page.
    }
  }, [])

  if (!show) return null

  const accept = () => {
    try {
      localStorage.setItem('gb-cookie-consent', '1')
    } catch {}
    setShow(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto max-w-3xl mx-auto rounded-2xl bg-espresso-900 border border-gold-500/20 shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-gold-100/80 flex-1 leading-relaxed">
          Vi använder nödvändiga cookies för att du ska kunna logga in och för att sidan ska fungera.{' '}
          <Link href="/privacy" className="text-gold-300 underline hover:text-gold-200">
            Läs mer
          </Link>
          .
        </p>
        <button onClick={accept} className="btn-gold shrink-0 !py-2.5 whitespace-nowrap">
          Jag förstår
        </button>
      </div>
    </div>
  )
}
