import Link from 'next/link'

// Shared dark shell for every /auth page so login, register, pending, verify
// and reset-password all look consistent. Card + spacing match the login form.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      <div
        className="auth-scope"
        style={{
          minHeight: '100vh',
          background: '#0f0a04',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '56px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link href="/">
              <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: '48px', color: '#D4AF37', lineHeight: 1 }}>
                GuldBud
              </span>
            </Link>
            <p style={{ color: '#8B6914', fontSize: '10px', letterSpacing: '4px', marginTop: '4px' }}>
              SVERIGES GULDAUKTION
            </p>
          </div>
          <div style={{ background: '#1a1208', border: '1px solid #3d2d0f', borderRadius: '16px', padding: '32px' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// Consistent dark input used across auth pages.
export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: '#1a1208',
        border: '1px solid #3d2d0f',
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '14px',
        color: '#f5e6c8',
        outline: 'none',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#D4AF37')}
      onBlur={(e) => (e.target.style.borderColor = '#3d2d0f')}
    />
  )
}

// Consistent primary button.
export function AuthButton({
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        background: disabled ? '#5a4020' : '#B8860B',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        width: '100%',
      }}
    >
      {children}
    </button>
  )
}
