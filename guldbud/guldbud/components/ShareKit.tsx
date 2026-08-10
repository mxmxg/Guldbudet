'use client'
import { useState } from 'react'

// Delningskit för admins affärssida: en dynamiskt genererad Instagram-bild
// plus en färdig, kopierbar bildtext. Halvautomatisk delning – admin
// granskar och postar själv (steg 2 mot full auto-postning).

function groupSek(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'
}

const HASHTAGS = '#guld #säljaguld #guldpris #arvsilver #guldsmycken #guldbud #sverige'

export default function ShareKit({
  amount,
  title,
  meta,
}: {
  amount: number
  title: string
  meta: string
}) {
  const [copied, setCopied] = useState(false)

  const imageUrl = `/api/share-image?amount=${amount}&title=${encodeURIComponent(
    title || 'Guldföremål'
  )}&meta=${encodeURIComponent(meta)}`

  const caption =
    `✨ Nyss såld på GuldBud: ${title}${meta ? ` (${meta})` : ''} — slutpris ${groupSek(amount)}.\n\n` +
    `Auktoriserade guldköpare budar mot varandra, så priset drivs upp. ` +
    `Lägg ut ditt guld helt gratis på guldbud.com 🔗\n\n` +
    HASHTAGS

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* urklipp otillgängligt */
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-gold-200 bg-gold-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-gold-700">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
        </svg>
        <p className="text-sm font-semibold text-espresso-800">Dela på Instagram</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800 border border-gold-300 hover:border-gold-400 bg-white rounded-lg px-3 py-2 transition"
        >
          Öppna bild →
        </a>
        <button
          onClick={copyCaption}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-espresso-700 hover:text-espresso-900 border border-espresso-200 hover:border-espresso-300 bg-white rounded-lg px-3 py-2 transition"
        >
          {copied ? '✓ Bildtext kopierad!' : 'Kopiera bildtext'}
        </button>
      </div>

      <p className="text-xs text-espresso-400 mb-1">Förhandsvisning av bildtext:</p>
      <pre className="text-xs text-espresso-600 whitespace-pre-wrap font-sans bg-white rounded-lg border border-espresso-100 p-3 leading-relaxed">
        {caption}
      </pre>
      <p className="text-[11px] text-espresso-400 mt-2">
        Spara bilden, klistra in bildtexten. Säljarens namn visas aldrig.
      </p>
    </div>
  )
}
