'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

// Laddar ner affärens underlag/faktura som riktig PDF. Går via en autentiserad
// fetch (Bearer-token) i stället för en vanlig länk, eftersom routen kräver
// Authorization-header och svarar med en fil bakom inloggning.
export default function DownloadInvoiceButton({
  orderId,
  label = 'Ladda ner underlag',
  className,
}: {
  orderId: string
  label?: string
  className?: string
}) {
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)

  const download = async () => {
    setBusy(true)
    setErr(false)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setErr(true)
        setBusy(false)
        return
      }
      const res = await fetch(`/api/orders/${orderId}/invoice-pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        setErr(true)
        setBusy(false)
        return
      }
      const blob = await res.blob()
      const dispo = res.headers.get('content-disposition') || ''
      const match = dispo.match(/filename="?([^"]+)"?/i)
      const filename = match?.[1] || `GuldBud-underlag-${orderId}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setErr(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className={className || 'text-sm text-gold-600 hover:text-gold-700 disabled:opacity-50'}
    >
      {busy ? 'Hämtar…' : err ? 'Försök igen' : label}
    </button>
  )
}
