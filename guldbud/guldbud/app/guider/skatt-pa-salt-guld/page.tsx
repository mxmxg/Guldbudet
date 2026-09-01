import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Skatt på sålt guld, måste man skatta?',
  description:
    'Måste man betala skatt när man säljer guld i Sverige? Så fungerar reglerna för personligt lösöre (smycken) kontra investeringsguld, och den skattefria gränsen. Allmän info, inte skatterådgivning.',
  alternates: { canonical: '/guider/skatt-pa-salt-guld' },
}

const faq = [
  {
    q: 'Måste man betala skatt när man säljer guld?',
    a: 'Det beror på vad det är och hur stor vinsten blir. Säljer du personliga smycken (personligt lösöre) är vinsten normalt skattefri upp till 50 000 kr per år sammanlagt. Investeringsguld som tackor och mynt köpta som placering beskattas i stället fullt ut. Det här är allmän information, kontrollera alltid med Skatteverket för din situation.',
  },
  {
    q: 'Vad räknas som personligt lösöre?',
    a: 'Smycken och guld du haft för eget bruk, till exempel ärvda ringar eller en gammal kedja, räknas normalt som personligt lösöre. Då gäller den skattefria gränsen på 50 000 kr i vinst per år. Guld köpt som ren investering räknas oftast inte hit.',
  },
  {
    q: 'Vad gör jag om jag inte vet vad guldet kostade från början?',
    a: 'För personligt lösöre får du normalt använda en schablon: anskaffningsvärdet räknas som 25 % av försäljningspriset om du inte kan visa det verkliga inköpspriset. Vinsten blir då 75 % av vad du fått. Kontrollera med Skatteverket hur det ska deklareras.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/skatt-pa-salt-guld"
      eyebrow="Guide · Skatt"
      title="Skatt på sålt guld, det här gäller (i korthet)"
      intro="Måste man skatta när man säljer guld? För de flesta som säljer gamla eller ärvda smycken blir svaret ofta nej, men det finns gränser och undantag. Här är principerna, med reservationen att detta är allmän information och inte skatterådgivning."
      updated="2026"
      faq={faq}
    >
      <div className="rounded-xl border border-gold-200/70 bg-gold-50/40 p-4 mb-6 text-sm text-espresso-600">
        Detta är en allmän förklaring, inte skatterådgivning. Reglerna kan ändras och din situation kan skilja sig,
        kontrollera alltid med <A href="https://www.skatteverket.se">Skatteverket</A>.
      </div>

      <H2>Två sorters guld i skattereglerna</H2>
      <P>
        Skatten beror på <strong>vad</strong> du säljer. Skatteverket skiljer på personligt lösöre och investeringsguld,
        och de behandlas olika.
      </P>
      <UL>
        <li>
          <strong>Personligt lösöre</strong>, smycken och guld du haft för eget bruk (ärvda ringar, en gammal kedja).
          Vinsten är normalt <strong>skattefri upp till 50 000 kr per år</strong> sammanlagt. Vinst över det beskattas
          som kapital.
        </li>
        <li>
          <strong>Investeringsguld</strong>, tackor och mynt du köpt som ren placering. Räknas oftast inte som
          personligt lösöre, och vinsten är då skattepliktig fullt ut.
        </li>
      </UL>

      <H2>Så räknas vinsten för smycken</H2>
      <P>
        Vinsten är försäljningspriset minus vad du en gång betalade. Vet du inte inköpspriset, till exempel på ett ärvt
        smycke, får du för personligt lösöre normalt använda en <strong>schablon</strong>: anskaffningsvärdet sätts till
        25 % av försäljningspriset. Då blir den beräknade vinsten 75 % av vad du fått. Först när din sammanlagda vinst på
        personligt lösöre överstiger 50 000 kr under året blir det aktuellt med skatt.
      </P>

      <H2>Vad betyder det i praktiken?</H2>
      <P>
        För de allra flesta som säljer några gamla smycken landar vinsten under 50 000 kr per år, och då blir det ingen
        skatt. Säljer du för större belopp, eller säljer investeringsguld, kan skatt bli aktuell, och då deklareras det i
        inkomstslaget kapital. Är du osäker, fråga <A href="https://www.skatteverket.se">Skatteverket</A>.
      </P>

      <H2>Sälja tryggt och spårbart</H2>
      <P>
        Oavsett skattefrågan är det en fördel att sälja spårbart. GuldBud är kontantfritt, du får betalt via Swish eller
        bank, vilket gör det enkelt att hålla ordning. Läs mer om <A href="/how-it-works">hur det fungerar</A> eller om{' '}
        <A href="/guider/salja-arvguld">att sälja arvguld</A>.
      </P>
    </GuideShell>
  )
}
