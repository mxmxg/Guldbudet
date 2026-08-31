'use client'
import { useEffect, useState } from 'react'

// Lightweight, reassuring cookie notice. We only use necessary cookies
// (login/session), so this is a simple acknowledgement: accept and it's gone.
export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('gb-cookie-consent')) setShow(true)
    } catch {
      // localStorage unavailable, don't block the page.
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
      <div className="pointer-events-auto max-w-2xl mx-auto rounded-2xl bg-espresso-900 border border-gold-500/20 shadow-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-gold-100/80 flex-1 leading-relaxed">
          Vi använder bara nödvändiga cookies för att sidan ska fungera, inga spårnings- eller reklamkakor.
        </p>
        <button onClick={accept} className="btn-gold shrink-0 !py-2.5 whitespace-nowrap">
          Okej
        </button>
      </div>
    </div>
  )
}
