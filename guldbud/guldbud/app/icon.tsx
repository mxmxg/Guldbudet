import { ImageResponse } from 'next/og'

// App-router favicon. Rendered to PNG at build time. Full-bleed dark
// background so Google's circular crop shows a dark disc with a gold "G".
export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
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
          color: '#D4AF37',
          fontSize: 34,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontWeight: 700,
        }}
      >
        G
      </div>
    ),
    { ...size }
  )
}
