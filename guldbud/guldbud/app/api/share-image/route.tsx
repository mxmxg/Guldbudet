import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Dynamisk delningsbild i Instagram-format (1080×1350, 4:5 porträtt).
// Query-parametrar: ?amount=14200&title=Guldring&meta=18K · 6 g&img=<url>
// Bilden ligger på en publik URL, redo att laddas ner, delas, och senare
// matas rakt in i Instagram Graph API för automatisk postning.
//
// Layouten är byggd kring två beskärningar, båda lärda 2026-09-08:
//
// 1. Instagrams webbuppladdning beskär till kvadrat (1:1) som standard och
//    tar då bort 135 px upptill och 135 px nedtill ur en 4:5-bild. Därför
//    ligger allt som bär budskapet, fotot, priset och titeln, inom den
//    kvadratsäkra mittzonen 135 till 1215 px. Topp- och bottenremsan bär
//    bara varumärket och får försvinna utan att bilden blir fel.
// 2. Fotot visas med objectFit contain, inte cover. Ett cover-foto i ett
//    brett band klippte ringar och kedjor i topp och botten redan innan
//    Instagram fått röra bilden. Contain visar hela föremålet, och den
//    mörka bakgrunden gör eventuella kanter till en del av designen.

function groupSek(n: number): string {
  // Manuell tusentalsgruppering (edge-runtime saknar full sv-SE locale).
  const s = Math.round(n).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'
}

// Kvadratsäker zon: 135 till 1215 px av 1350.
const SAFE_TOP = 135
const SAFE_BOTTOM = 135
const PHOTO_HEIGHT = 760

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const amount = Number(searchParams.get('amount') || 0)
  const title = (searchParams.get('title') || 'Guldföremål').slice(0, 60)
  const meta = (searchParams.get('meta') || '').slice(0, 80)
  const img = searchParams.get('img') || ''

  const res = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f0a04',
          backgroundImage: 'radial-gradient(circle at 50% 35%, #241a0a 0%, #0f0a04 65%)',
        }}
      >
        {/* Toppremsa, utanför den kvadratsäkra zonen: får klippas bort. */}
        <div
          style={{
            height: SAFE_TOP,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            letterSpacing: 9,
            color: '#6b5a33',
          }}
        >
          SVERIGES GULDAUKTION
        </div>

        {/* Fotot, helt synligt med contain, inom den säkra zonen. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: PHOTO_HEIGHT,
            padding: '0 60px',
          }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              width={960}
              height={PHOTO_HEIGHT}
              style={{ objectFit: 'contain', borderRadius: 28 }}
              alt=""
            />
          ) : null}
        </div>

        {/* Pris och titel, fortfarande inom den säkra zonen. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            padding: '0 80px',
          }}
        >
          {/* Varumärket ligger här, inom den kvadratsäkra zonen, så en
              beskuren bild aldrig saknar avsändare. */}
          <div style={{ fontSize: 26, letterSpacing: 7, color: '#c9a84c', display: 'flex' }}>
            SÅLD PÅ GULDBUD · SLUTPRIS
          </div>
          <div
            style={{
              fontSize: 128,
              fontWeight: 600,
              letterSpacing: -3,
              color: '#D4AF37',
              lineHeight: 1,
              marginTop: 6,
              display: 'flex',
            }}
          >
            {groupSek(amount)}
          </div>
          <div style={{ fontSize: 42, color: '#f4ead2', textAlign: 'center', marginTop: 22, display: 'flex' }}>
            {title}
          </div>
          {meta ? (
            <div style={{ fontSize: 28, color: '#9c8149', marginTop: 10, display: 'flex' }}>{meta}</div>
          ) : null}
        </div>

        {/* Bottenremsa, utanför den kvadratsäkra zonen: adressen. */}
        <div
          style={{
            height: SAFE_BOTTOM,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.5, color: '#D4AF37', display: 'flex' }}>
            guldbud.com
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  )
  // ImageResponse sätter en ettårig immutable-cache per adress, vilket gjorde
  // att redan genererade bilder behöll den gamla layouten efter rättningen
  // 2026-09-08. headers-optionen räcker inte: den läggs TILL standardvärdet
  // och gav "max-age=31536000, public, max-age=60" i samma huvud. Därför
  // set() på svaret, som ersätter. En timme i CDN räcker: bilden är billig
  // att rita om, och en layoutändring ska nå alla affärer samma dag.
  res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=3600')
  return res
}
