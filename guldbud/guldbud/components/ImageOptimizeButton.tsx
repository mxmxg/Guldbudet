'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

// Engångsverktyg i adminpanelen: krymper gamla, stora bilder i lagringen.
// Autentiserar med adminens egen session (access_token), ingen nyckel i URL.
export default function ImageOptimizeButton() {
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  const call = async (run: boolean) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setStatus('Du måste vara inloggad som admin.')
      return null
    }
    const res = await fetch(`/api/admin/optimize-images${run ? '?run=1' : ''}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    })
    const body = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, body }
  }

  const analyze = async () => {
    setBusy(true)
    setStatus('Analyserar bilderna...')
    const r = await call(false)
    const j = r?.body
    if (!r || !r.ok || !j || j.error) {
      setStatus(`Fel (${r?.status ?? '?'}): ${j?.error ?? 'inget svar'}`)
    } else if (j.stora_bilder === 0) {
      setStatus('Inga stora bilder att krympa. Allt är redan optimerat.')
    } else {
      setStatus(`${j.stora_bilder} stora bilder (${j.total_mb} MB). Krympning sparar ca ${j.sparat_mb} MB.`)
    }
    setBusy(false)
  }

  const optimize = async () => {
    setBusy(true)
    let saved = 0
    let guard = 0
    // Endpoint:en tar en bunt per anrop (tidsbudget) – loopa tills done.
    while (guard++ < 200) {
      setStatus(`Krymper bilder... (${Math.round(saved)} MB sparat hittills)`)
      const r = await call(true)
      const j = r?.body
      if (!r || !r.ok || !j || j.error) {
        setStatus(`Fel (${r?.status ?? '?'}): ${j?.error ?? 'inget svar'}. Klicka igen för att fortsätta.`)
        break
      }
      saved += j.sparat_mb || 0
      if (j.done) {
        setStatus(
          saved > 0
            ? `Klart! Bilderna är krympta och sparade ca ${Math.round(saved)} MB. Kör om PageSpeed.`
            : 'Klart! Inga bilder behövde krympas.'
        )
        break
      }
    }
    setBusy(false)
  }

  return (
    <section className="card p-6">
      <h2 className="font-display text-lg text-espresso-900 mb-1">Optimera bilder (engång)</h2>
      <p className="text-sm text-espresso-500 mb-4 leading-relaxed">
        Krymper gamla, stora annonsbilder i lagringen till webbvänlig storlek. Bilderna behåller sina adresser, så
        inga annonser påverkas. Kan köras om när som helst.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={analyze} disabled={busy} className="btn-ghost-gold !py-2">
          Analysera först
        </button>
        <button onClick={optimize} disabled={busy} className="btn-gold !py-2">
          {busy ? 'Arbetar...' : 'Krymp bilderna'}
        </button>
        {status && <span className="text-sm text-espresso-600">{status}</span>}
      </div>
    </section>
  )
}
