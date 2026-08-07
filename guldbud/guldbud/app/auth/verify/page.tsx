'use client'
import { useState } from 'react'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { MailIcon } from '@/components/Icons'
import { createClient } from '@/lib/supabase-browser'

export default function VerifyPage() {
  const supabase = createClient()
  const [email] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('email') || ''
  })
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const resend = async () => {
    if (!email) {
      setNote({ ok: false, text: 'Vi saknar din e-postadress här. Logga in så skickar vi en ny länk.' })
      return
    }
    setSending(true)
    setNote(null)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) setNote({ ok: false, text: 'Kunde inte skicka igen: ' + error.message })
    else setNote({ ok: true, text: 'Ett nytt bekräftelsemejl är på väg. Kolla din inkorg (och skräpposten).' })
    setSending(false)
  }

  return (
    <AuthShell>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '9999px',
            background: '#2d1f0a',
            color: '#D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <MailIcon size={28} />
        </div>
        <h1 style={{ color: '#f5e6c8', fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>
          Bekräfta din e-post
        </h1>
        <p style={{ color: '#8B6914', fontSize: '14px', lineHeight: 1.6, marginBottom: '6px' }}>
          Vi har skickat ett bekräftelsemejl{email ? ' till ' : ''}
          {email && <span style={{ color: '#f5e6c8', fontWeight: 600 }}>{email}</span>}. Klicka på länken i mejlet
          för att aktivera ditt konto.
        </p>
        <p
          style={{
            color: '#c9a84c',
            fontSize: '13px',
            lineHeight: 1.55,
            marginBottom: '20px',
            background: '#2d1f0a',
            border: '1px solid #3d2d0f',
            borderRadius: '10px',
            padding: '11px 14px',
          }}
        >
          📬 Ser du inget mejl? Kolla <strong style={{ color: '#f5e6c8' }}>skräpposten</strong> — bekräftelsemejl
          hamnar ofta där.
        </p>

        <button
          onClick={resend}
          disabled={sending}
          style={{
            display: 'inline-block',
            background: '#B8860B',
            color: '#fff',
            border: 'none',
            padding: '11px 22px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? 'Skickar…' : 'Skicka mejlet igen'}
        </button>

        {note && (
          <p style={{ color: note.ok ? '#7bc47f' : '#e57373', fontSize: '13px', marginTop: '14px' }}>{note.text}</p>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link href="/auth/login" style={{ color: '#B8860B', fontSize: '14px', fontWeight: 500 }}>
            Till inloggningen
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
