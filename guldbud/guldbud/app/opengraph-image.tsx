import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GuldBud · Sveriges guldauktion'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Branded share image used for link previews (Google, social, chat apps).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0a04',
          backgroundImage: 'radial-gradient(circle at 50% 15%, #2a1e0c 0%, #0f0a04 60%)',
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 10, color: '#8B6914', display: 'flex' }}>
          SVERIGES GULDAUKTION
        </div>
        <div style={{ fontSize: 150, fontStyle: 'italic', color: '#D4AF37', fontFamily: 'serif', marginTop: 6, display: 'flex' }}>
          GuldBud
        </div>
        <div style={{ fontSize: 38, color: '#c9a84c', marginTop: 30, maxWidth: 880, textAlign: 'center', display: 'flex' }}>
          Låt auktoriserade guldhandlare buda mot varandra om ditt guld
        </div>
      </div>
    ),
    { ...size }
  )
}
