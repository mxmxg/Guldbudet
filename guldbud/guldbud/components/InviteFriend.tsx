'use client'
import { useState } from 'react'

// Lättviktig "tipsa en vän"-delning. Använder mobilens inbyggda delningsmeny
// (Web Share API) när den finns, annars kopieras länken till urklipp.
// Ingen databas, ingen inloggning, bara spridning.
const SITE = 'https://guldbud.com'
const SHARE_TEXT =
  'Jag säljer mitt guld via GuldBud, auktoriserade guldköpare budar mot varandra så priset drivs upp. Kostnadsfritt att lägga ut. Kolla:'

export default function InviteFriend({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null
    if (nav?.share) {
      try {
        await nav.share({ title: 'GuldBud', text: SHARE_TEXT, url: SITE })
        return
      } catch {
        /* användaren avbröt delningen, fall igenom till kopiering */
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SITE}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* urklipp otillgängligt, tyst */
    }
  }

  if (compact) {
    return (
      <button
        onClick={share}
        className="inline-flex items-center gap-1.5 text-sm text-gold-700 hover:text-gold-800 font-medium"
      >
        <ShareIcon />
        {copied ? 'Länk kopierad!' : 'Tipsa en vän'}
      </button>
    )
  }

  return (
    <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-gradient-to-br from-gold-50 to-white border-gold-200">
      <div>
        <p className="font-display text-lg text-espresso-900">Känner du någon som har guld liggande?</p>
        <p className="text-sm text-espresso-500 mt-0.5">
          Tipsa en vän, de får handlare att buda mot varandra, precis som du.
        </p>
      </div>
      <button onClick={share} className="btn-gold whitespace-nowrap inline-flex items-center gap-2 self-start sm:self-auto">
        <ShareIcon />
        {copied ? 'Länk kopierad!' : 'Tipsa en vän'}
      </button>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
