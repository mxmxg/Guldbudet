import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { MailIcon } from '@/components/Icons'

export default function VerifyPage() {
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
        <p style={{ color: '#8B6914', fontSize: '14px', lineHeight: 1.6, marginBottom: '12px' }}>
          Vi har skickat ett bekräftelsemejl till din e-postadress. Klicka på länken i mejlet för att aktivera
          ditt konto.
        </p>
        <p style={{ color: '#5a4020', fontSize: '12px', marginBottom: '24px' }}>
          Hittar du inte mejlet? Kolla skräpposten.
        </p>
        <Link href="/" style={{ color: '#B8860B', fontSize: '14px', fontWeight: 500 }}>
          Tillbaka till startsidan
        </Link>
      </div>
    </AuthShell>
  )
}
