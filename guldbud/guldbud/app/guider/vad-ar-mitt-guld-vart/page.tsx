import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'
import ValueEstimator from '@/components/ValueEstimator'

export const metadata: Metadata = {
  title: 'Vad är mitt guld värt? Räkna ut värdet på sekunder',
  description:
    'Räkna ut vad ditt guld är värt utifrån vikt, karat och dagens guldpris. Gratis värderingskalkylator för smycken, mynt och tandguld.',
  alternates: { canonical: '/guider/vad-ar-mitt-guld-vart' },
}

const faq = [
  {
    q: 'Hur vet jag vad mitt guld är värt?',
    a: 'Värdet beror på vikten i gram, karaten (guldhalten) och dagens guldpris. Fyll i vikt och karat i kalkylatorn ovan så får du ett indikativt värde direkt.',
  },
  {
    q: 'Hur vet jag karaten på mitt smycke?',
    a: 'De flesta smycken har en stämpel: 750 betyder 18K, 585 betyder 14K och 375 betyder 9K. Hittar du ingen stämpel kontrollerar vi guldhalten när vi tagit emot föremålet.',
  },
  {
    q: 'Väger jag guldet själv?',
    a: 'En vanlig köksvåg som visar gram räcker för en uppskattning. Vi väger och kontrollerar allt exakt vid mottagandet.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Värdering"
      title="Vad är mitt guld värt?"
      intro="Fyll i vikt och karat så räknar vi ut ett indikativt värde utifrån dagens guldpris. Gratis, direkt och utan att du behöver skapa konto."
      faq={faq}
    >
      <div className="mb-10">
        <ValueEstimator loggedIn={false} />
      </div>

      <H2>Så fungerar värderingen</H2>
      <P>
        Kalkylatorn tar vikten du fyller i, multiplicerar med guldhalten för din karat och med dagens guldpris. Det
        ger ett <strong>indikativt metallvärde</strong> – ett riktmärke för vad föremålet borde vara värt.
      </P>
      <P>
        Det verkliga slutpriset avgörs sedan av <strong>konkurrensen mellan handlare</strong>. På{' '}
        <A href="/guider/salja-guld">en auktion budar flera uppköpare mot varandra</A>, vilket ofta ger mer än en
        enskild guldsmeds förstabud.
      </P>

      <H2>Vad kan jag värdera?</H2>
      <UL>
        <li>Guldsmycken – ringar, halsband, armband, örhängen</li>
        <li>Trasiga eller omoderna smycken (guldvärdet finns kvar ändå)</li>
        <li>Guldmynt och tackor</li>
        <li>Tandguld och arvegods</li>
      </UL>
      <P>
        Osäker på karaten? Läs <A href="/guider/karat-18k-14k-9k">guiden om 18K, 14K och 9K</A>. Vill du se dagens
        kurs? Kolla <A href="/guider/guldpris-idag">guldpriset idag</A>.
      </P>
    </GuideShell>
  )
}
