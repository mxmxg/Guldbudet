import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Dynamisk delningsbild i Instagram-format (1080×1350, 4:5 porträtt).
// Föremålets foto överst, med en "Såld på GuldBud"-ruta under.
// Query-parametrar: ?amount=14200&title=Guldring&meta=18K · 6 g&img=<url>
// Bilden ligger på en publik URL, redo att laddas ner, delas, och senare
// matas rakt in i Instagram Graph API för automatisk postning.

function groupSek(n: number): string {
  // Manuell tusentalsgruppering (edge-runtime saknar full sv-SE locale).
  const s = Math.round(n).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'
}

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const amount = Number(searchParams.get('amount') || 0)
  const title = (searchParams.get('title') || 'Guldföremål').slice(0, 60)
  const meta = (searchParams.get('meta') || '').slice(0, 80)
  const img = searchParams.get('img') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f0a04',
          backgroundImage: 'radial-gradient(circle at 50% 20%, #241a0a 0%, #0f0a04 60%)',
        }}
      >
        {img ? (
          <div style={{ display: 'flex', position: 'relative', width: '100%', height: 660 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} width={1080} height={660} style={{ objectFit: 'cover' }} alt="" />
            {/* Mjuk toning så fotot smälter in i bakgrunden */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                backgroundImage: 'linear-gradient(to bottom, rgba(15,10,4,0) 55%, #0f0a04 100%)',
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            padding: '30px 80px',
          }}
        >
          <div style={{ fontSize: 27, letterSpacing: 11, color: '#8B6914', display: 'flex' }}>
            SÅLD PÅ GULDBUD
          </div>
          <div style={{ fontSize: 30, color: '#c9a84c', marginTop: 26, display: 'flex' }}>slutpris</div>
          <div
            style={{
              fontSize: 148,
              fontWeight: 600,
              letterSpacing: -3,
              color: '#D4AF37',
              lineHeight: 1,
              marginTop: 8,
              display: 'flex',
            }}
          >
            {groupSek(amount)}
          </div>
          <div style={{ fontSize: 48, color: '#f4ead2', textAlign: 'center', marginTop: 34, display: 'flex' }}>
            {title}
          </div>
          {meta ? (
            <div style={{ fontSize: 31, color: '#9c8149', marginTop: 14, display: 'flex' }}>{meta}</div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: 54,
          }}
        >
          <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: -0.5, color: '#D4AF37', display: 'flex' }}>
            guldbud.com
          </div>
          <div style={{ fontSize: 23, letterSpacing: 5, color: '#6b5a33', marginTop: 8, display: 'flex' }}>
            SVERIGES GULDAUKTION
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
