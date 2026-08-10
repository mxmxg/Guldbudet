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
  image,
}: {
  amount: number
  title: string
  meta: string
  image?: string | null
}) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'' | 'share' | 'download'>('')
  const [err, setErr] = useState('')

  const imageUrl =
    `/api/share-image?amount=${amount}&title=${encodeURIComponent(title || 'Guldföremål')}` +
    `&meta=${encodeURIComponent(meta)}` +
    (image ? `&img=${encodeURIComponent(image)}` : '')

  const fileName = `guldbud-${groupSek(amount).replace(/\D/g, '')}.png`

  const caption =
    `✨ Nyss såld på GuldBud: ${title}${meta ? ` (${meta})` : ''}. Slutpris ${groupSek(amount)}.\n\n` +
    `Auktoriserade guldköpare budar mot varandra, så priset drivs upp. ` +
    `Lägg ut ditt guld helt gratis på guldbud.com 🔗\n\n` +
    HASHTAGS

  const fetchBlob = async () => {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error('Kunde inte hämta bilden')
    return res.blob()
  }

  // Öppnar mobilens delningsmeny med bilden bifogad (Web Share API nivå 2).
  const shareImage = async () => {
    setErr('')
    setBusy('share')
    try {
      const blob = await fetchBlob()
      const file = new File([blob], fileName, { type: 'image/png' })
      const nav = navigator as any
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: caption })
      } else {
        // Delning av filer stöds inte (t.ex. desktop) – ladda ner i stället.
        triggerDownload(blob)
        setErr('Fildelning stöds inte här – bilden laddades ner i stället.')
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setErr('Delning misslyckades. Prova Ladda ner i stället.')
    }
    setBusy('')
  }

  const triggerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadImage = async () => {
    setErr('')
    setBusy('download')
    try {
      triggerDownload(await fetchBlob())
    } catch {
      setErr('Nedladdning misslyckades. Prova Öppna bild och spara manuellt.')
    }
    setBusy('')
  }

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
        <button
          onClick={shareImage}
          disabled={busy !== ''}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 rounded-lg px-3.5 py-2 transition disabled:opacity-60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {busy === 'share' ? 'Öppnar…' : 'Dela'}
        </button>

        <button
          onClick={downloadImage}
          disabled={busy !== ''}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800 border border-gold-300 hover:border-gold-400 bg-white rounded-lg px-3 py-2 transition disabled:opacity-60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {busy === 'download' ? 'Laddar ner…' : 'Ladda ner'}
        </button>

        <button
          onClick={copyCaption}
          disabled={busy !== ''}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-espresso-700 hover:text-espresso-900 border border-espresso-200 hover:border-espresso-300 bg-white rounded-lg px-3 py-2 transition disabled:opacity-60"
        >
          {copied ? '✓ Bildtext kopierad!' : 'Kopiera bildtext'}
        </button>
      </div>

      {err && <p className="text-xs text-red-500 mb-2">{err}</p>}

      <p className="text-xs text-espresso-400 mb-1">Förhandsvisning av bildtext:</p>
      <pre className="text-xs text-espresso-600 whitespace-pre-wrap font-sans bg-white rounded-lg border border-espresso-100 p-3 leading-relaxed">
        {caption}
      </pre>
      <p className="text-[11px] text-espresso-400 mt-2">
        Tryck Dela för att skicka bilden direkt, eller Ladda ner och posta i Instagram. Säljarens namn visas aldrig.
      </p>
    </div>
  )
}
