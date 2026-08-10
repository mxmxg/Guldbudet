import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Kvadratisk profilbild (1080×1080) i GuldBuds stil. Designad för att sitta
// centrerad i Instagrams runda beskärning: ringen och texten ligger väl
// innanför den inskrivna cirkeln så inget viktigt beskärs bort.

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0a04',
          backgroundImage: 'radial-gradient(circle at 50% 42%, #2a1e0c 0%, #0f0a04 62%)',
        }}
      >
        <div
          style={{
            width: 900,
            height: 900,
            borderRadius: 9999,
            border: '2px solid rgba(212,175,55,0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 14, color: '#8B6914', display: 'flex' }}>
            SEDAN 2026
          </div>
          <div
            style={{
              fontSize: 170,
              fontStyle: 'italic',
              fontFamily: 'serif',
              color: '#D4AF37',
              lineHeight: 1,
              marginTop: 18,
              marginBottom: 18,
              display: 'flex',
            }}
          >
            GuldBud
          </div>
          <div style={{ fontSize: 30, letterSpacing: 8, color: '#9c8149', display: 'flex' }}>
            SVERIGES GULDAUKTION
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
