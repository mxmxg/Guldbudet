import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { HourglassIcon } from '@/components/Icons'

export default function PendingPage() {
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
          <HourglassIcon size={26} />
        </div>
        <h1 style={{ color: '#f5e6c8', fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>
          Tack för din registrering!
        </h1>
        <p style={{ color: '#8B6914', fontSize: '14px', lineHeight: 1.6, marginBottom: '14px' }}>
          Ditt handlarkonto granskas av vårt team. Du får ett e-postmeddelande inom 1-2 arbetsdagar när du är
          godkänd att börja buda.
        </p>
        <p
          style={{
            color: '#c9a84c',
            fontSize: '13px',
            lineHeight: 1.6,
            marginBottom: '24px',
            background: '#2d1f0a',
            border: '1px solid #3d2d0f',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          Bekräfta först din e-post via länken vi just mejlade dig. Det behövs för att kunna logga in.
        </p>
        <p
          style={{
            color: '#c9a84c',
            fontSize: '13px',
            lineHeight: 1.6,
            marginBottom: '24px',
            background: '#2d1f0a',
            border: '1px solid #3d2d0f',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          Du behöver också legitimera dig med BankID innan du kan lägga bud. Säljarna hos oss är
          privatpersoner, och vi lovar dem att varje handlare är legitimerad. Det gör du under{' '}
          <Link href="/verifiering" style={{ color: '#D4AF37', fontWeight: 500 }}>
            Verifiering
          </Link>{' '}
          när du loggat in.
        </p>
        <Link href="/" style={{ color: '#B8860B', fontSize: '14px', fontWeight: 500 }}>
          Tillbaka till startsidan
        </Link>
      </div>
    </AuthShell>
  )
}
