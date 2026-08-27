'use client'
import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { TRUSTPILOT_BUSINESS_UNIT_ID, TRUSTPILOT_PROFILE_URL } from '@/components/TrustpilotInvite'

// Officiell Trustpilot TrustBox (Micro Combo: stjärnor + betyg + antal omdömen).
// Renderas av Trustpilots skript utifrån vår businessunit-id. Visar det RIKTIGA
// betyget, ingen påhittad siffra. Om planen/omdömena inte finns lämnar Trustpilot
// rutan tom, och sektionen runt omkring (rubrik, text, länk) står ändå kvar.
declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement, forceReload?: boolean) => void }
  }
}

export default function TrustpilotWidget() {
  const ref = useRef<HTMLDivElement>(null)

  const render = () => {
    if (window.Trustpilot && ref.current) window.Trustpilot.loadFromElement(ref.current, true)
  }

  useEffect(() => {
    render()
  }, [])

  return (
    <>
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={render}
      />
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale="sv-SE"
        data-template-id="5419b6ffb0d04a076446a9af"
        data-businessunit-id={TRUSTPILOT_BUSINESS_UNIT_ID}
        data-style-height="24px"
        data-style-width="100%"
        data-theme="light"
      >
        <a href={TRUSTPILOT_PROFILE_URL} target="_blank" rel="noopener noreferrer">
          Trustpilot
        </a>
      </div>
    </>
  )
}
