import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Dynamisk delningsbild i Instagram-format (1080×1350, 4:5 porträtt).
// Genererar en snygg "Såld på GuldBud"-ruta av en avslutad affär.
// Anropas med query-parametrar: ?amount=14200&title=Guldring&meta=18K · 6 g
// Bilden ligger på en publik URL – redo att laddas ner, delas, och senare
// matas rakt in i Instagram Graph API för automatisk postning.

function groupSek(n: number): string {
  // Manuell tusentalsgruppering (edge-runtime saknar full sv-SE locale).
  const s = Math.round(n).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'
}

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const amount = Number(searchParams.get('amount') || 0)
  const title = (searchParams.get('title') || 'Guldföremål').slice(0, 60)
  const meta = (searchParams.get('meta') || '').slice(0, 80)

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
          backgroundImage: 'radial-gradient(circle at 50% 22%, #2a1e0c 0%, #0f0a04 62%)',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 12, color: '#8B6914', display: 'flex' }}>
          SÅLD PÅ GULDBUD
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 70,
            marginBottom: 70,
          }}
        >
          <div style={{ fontSize: 34, color: '#c9a84c', display: 'flex' }}>slutpris</div>
          <div
            style={{
              fontSize: 168,
              fontStyle: 'italic',
              fontFamily: 'serif',
              color: '#D4AF37',
              lineHeight: 1,
              marginTop: 10,
              display: 'flex',
            }}
          >
            {groupSek(amount)}
          </div>
        </div>

        <div style={{ fontSize: 52, color: '#f4ead2', textAlign: 'center', maxWidth: 900, display: 'flex' }}>
          {title}
        </div>
        {meta ? (
          <div style={{ fontSize: 34, color: '#9c8149', marginTop: 18, display: 'flex' }}>{meta}</div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            bottom: 70,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 40, fontStyle: 'italic', fontFamily: 'serif', color: '#D4AF37', display: 'flex' }}>
            guldbud.com
          </div>
          <div style={{ fontSize: 26, letterSpacing: 6, color: '#6b5a33', marginTop: 8, display: 'flex' }}>
            SVERIGES GULDAUKTION
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
