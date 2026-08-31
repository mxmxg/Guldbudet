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
    let consecTimeouts = 0
    let noProgress = 0
    let initial = 0
    setStatus('Krymper bilder... 0%')
    // Endpoint:en tar en liten bunt per anrop (tidsbudget), loopa tills done.
    while (guard++ < 400) {
      const r = await call(true)
      const j = r?.body
      if (r && r.ok && j && !j.error) {
        consecTimeouts = 0
        saved += j.sparat_mb || 0
        if (initial === 0) initial = j.stora_bilder || 0
        // Avsluta även om inget faktiskt krympts på några varv, då är allt
        // redan optimerat (skydd mot att loopa på bilder som ligger på gränsen).
        noProgress = (j.krympta || 0) === 0 ? noProgress + 1 : 0
        if (j.done || noProgress >= 3) {
          setStatus(
            saved > 0
              ? `Klart! 100%, bilderna är krympta, ca ${Math.round(saved)} MB sparat. Kör om PageSpeed.`
              : 'Klart! Allt är redan optimerat.'
          )
          break
        }
        const remaining = j.stora_bilder || 0
        const pct = initial > 0 ? Math.min(99, Math.round(((initial - remaining) / initial) * 100)) : 0
        setStatus(`Krymper bilder... ${pct}% (${Math.round(saved)} MB sparat)`)
        continue
      }
      // Timeout (504) betyder bara att bunten tog slut på tid, redan klara
      // bilder är sparade, så vi fortsätter automatiskt.
      if (r?.status === 504) {
        if (++consecTimeouts > 10) {
          setStatus('Många timeouts i rad. Klicka "Krymp bilderna" igen för att fortsätta.')
          break
        }
        continue
      }
      setStatus(`Fel (${r?.status ?? '?'}): ${j?.error ?? 'inget svar'}. Klicka igen för att fortsätta.`)
      break
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
