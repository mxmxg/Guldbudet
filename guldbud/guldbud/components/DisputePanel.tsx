'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  DISPUTE_STATUS_LABEL,
  DISPUTE_STATUS_STYLE,
  DisputeParty,
  DisputeStatus,
  reasonsFor,
  reasonLabel,
} from '@/lib/disputes'

type Dispute = {
  id: string
  reason: string
  description: string
  status: DisputeStatus
  resolution: string | null
  created_at: string
}

function date(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Låter en part (säljare/handlare) anmäla ett problem i sin affär och följa
// ärendets status. Admin avgör i admin-vyn. Formuläret är dolt bakom en knapp
// så det inte stör det normala flödet.
export default function DisputePanel({
  orderId,
  party,
  meId,
}: {
  orderId: string
  party: DisputeParty
  meId: string
}) {
  const supabase = createClient()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('disputes')
      .select('id, reason, description, status, resolution, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    setDisputes((data as Dispute[]) || [])
    setLoaded(true)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const submit = async () => {
    setError('')
    if (!reason) {
      setError('Välj vad ärendet gäller.')
      return
    }
    if (description.trim().length < 10) {
      setError('Beskriv gärna vad som hänt lite mer utförligt.')
      return
    }
    setSending(true)
    const { error: err } = await supabase.from('disputes').insert({
      order_id: orderId,
      raised_by: meId,
      party,
      reason,
      description: description.trim(),
    })
    setSending(false)
    if (err) {
      setError('Kunde inte skicka ärendet just nu. Försök igen om en stund.')
      return
    }
    setReason('')
    setDescription('')
    setOpen(false)
    load()
  }

  if (!loaded) return null

  const active = disputes.find((d) => d.status === 'open' || d.status === 'under_review')

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg text-espresso-900 mb-1">Något som inte stämmer?</h2>
      <p className="text-sm text-espresso-500 leading-relaxed">
        Har du ett problem med affären som meddelandena inte löser? Anmäl ett ärende så tittar vi på det och
        återkommer.
      </p>

      {/* Befintliga ärenden */}
      {disputes.length > 0 && (
        <div className="mt-5 grid gap-3">
          {disputes.map((d) => (
            <div key={d.id} className="rounded-xl border border-espresso-100 p-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-sm font-medium text-espresso-800">{reasonLabel(d.reason)}</p>
                <span className={`chip text-xs ${DISPUTE_STATUS_STYLE[d.status]}`}>
                  {DISPUTE_STATUS_LABEL[d.status]}
                </span>
              </div>
              <p className="text-xs text-espresso-400 mb-2">Anmält {date(d.created_at)}</p>
              <p className="text-sm text-espresso-600 whitespace-pre-wrap break-words">{d.description}</p>
              {d.resolution && (
                <div className="mt-3 rounded-lg bg-espresso-50 p-3">
                  <p className="text-xs font-medium text-espresso-500 mb-0.5">Svar från GuldBud</p>
                  <p className="text-sm text-espresso-700 whitespace-pre-wrap break-words">{d.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nytt ärende */}
      {active ? (
        <p className="mt-4 text-xs text-espresso-400">
          Ditt ärende är registrerat och vi hör av oss. Vill du lägga till något, skriv i meddelandena ovan.
        </p>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className="btn-ghost-gold !py-2 mt-5">
          Rapportera ett problem
        </button>
      ) : (
        <div className="mt-5 grid gap-3">
          <div>
            <label className="text-sm text-espresso-600 mb-1 block">Vad gäller det?</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full text-sm">
              <option value="">Välj...</option>
              {reasonsFor(party).map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-espresso-600 mb-1 block">Beskriv vad som hänt</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Berätta så utförligt du kan så hjälper det oss att lösa det snabbare."
              className="w-full text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={sending} className="btn-gold !py-2">
              {sending ? 'Skickar...' : 'Skicka ärende'}
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setError('')
              }}
              className="text-sm text-espresso-500 px-3 py-2"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
