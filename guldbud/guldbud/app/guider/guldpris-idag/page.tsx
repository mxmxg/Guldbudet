import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'
import LiveGoldPrice from '@/components/LiveGoldPrice'

export const metadata: Metadata = {
  title: 'Guldpris idag: aktuellt pris per gram (24K, 18K, 14K, 9K)',
  description:
    'Se guldpriset idag per gram för 24K, 18K, 14K och 9K. Förstå vad som styr guldpriset och vad ditt guld är värt vid dagens kurs.',
  alternates: { canonical: '/guider/guldpris-idag' },
}

const faq = [
  {
    q: 'Vad är guldpriset idag?',
    a: 'Guldpriset ändras löpande under dygnet. Ovan ser du dagens ungefärliga pris per gram för 24K, samt vad det motsvarar för 18K, 14K och 9K. Använd värderingskalkylatorn för att räkna på just ditt föremål.',
  },
  {
    q: 'Varför ändras guldpriset hela tiden?',
    a: 'Guld handlas på världsmarknaden och priset påverkas av utbud och efterfrågan, dollarkurs, räntor och oro i ekonomin. Därför kan priset röra sig både under dagen och mellan dagar.',
  },
  {
    q: 'Får jag hela guldpriset när jag säljer?',
    a: 'Utbetalningen ligger normalt något under det rena metallvärdet, men på en auktion där handlare budar mot varandra pressas priset uppåt mot marknadsvärdet.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guldpris"
      title="Guldpris idag"
      intro="Aktuellt guldpris per gram, uppdaterat löpande. Se vad 24K, 18K, 14K och 9K är värt vid dagens kurs, och räkna ut vad just ditt guld skulle ge."
    >
      <div className="mb-8">
        <LiveGoldPrice variant="card" className="max-w-md" />
      </div>

      <H2>Vad styr guldpriset?</H2>
      <P>
        Guld handlas på en global marknad och priset sätts i realtid. Det påverkas av efterfrågan på guld, den
        amerikanska dollarns kurs, ränteläget och hur orolig omvärlden är, guld ses som en trygg tillgång när
        ekonomin skakar. Därför kan priset röra sig både under dagen och mellan veckor.
      </P>

      <H2>Så räknar du om priset till ditt guld</H2>
      <P>
        Priset ovan är för rent guld (24K). Dina smycken är oftast legerade, alltså blandade med andra metaller. Du
        räknar om genom att multiplicera med guldhalten:
      </P>
      <UL>
        <li>18K = 75 % av 24K-priset</li>
        <li>14K = 58,5 % av 24K-priset</li>
        <li>9K = 37,5 % av 24K-priset</li>
      </UL>
      <P>
        Vill du slippa räkna? <A href="/#estimator">Värderingskalkylatorn</A> gör det åt dig utifrån dagens pris. Läs
        mer om <A href="/guider/karat-18k-14k-9k">vad karaten betyder</A> eller om{' '}
        <A href="/guider/salja-guld">hur du får bäst betalt när du säljer</A>.
      </P>
    </GuideShell>
  )
}
