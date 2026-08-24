import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld i Stockholm, få bäst betalt hemifrån',
  description:
    'Sälja guld i Stockholm? Slipp springa mellan guldsmeder på Drottninggatan. Lägg ut hemifrån och låt auktoriserade handlare buda mot varandra om ditt guld. Gratis, tryggt och försäkrat.',
  alternates: { canonical: '/guider/salja-guld-stockholm' },
}

const faq = [
  {
    q: 'Var säljer jag guld bäst i Stockholm?',
    a: 'Stockholm har gott om guldsmeder och pantbanker, men hos var och en får du bara ett enda bud. På GuldBud budar flera auktoriserade handlare mot varandra om ditt guld, så priset sätts av marknaden i stället för en enskild uppköpare. Du gör allt hemifrån, oavsett om du bor på Södermalm, i Vasastan eller ute i Nacka.',
  },
  {
    q: 'Måste jag åka in till stan för att sälja?',
    a: 'Nej. Du fotograferar föremålet, lägger ut det och får bud, allt hemifrån. När du accepterat skickar vi ett kostnadsfritt, försäkrat rekommenderat brev med förbetalt porto. Du postar det på närmaste ombud, ingen resa in till city, ingen parkering.',
  },
  {
    q: 'Hur snabbt får jag betalt?',
    a: 'När vi tagit emot och äkthetskontrollerat föremålet betalar vi ut omgående via Swish eller bankkonto. Att sälja är kostnadsfritt för dig.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Sälja guld · Stockholm"
      title="Sälja guld i Stockholm utan att lämna hemmet"
      intro="I Stockholm är det aldrig långt till en guldsmed, men det betyder inte att du får bäst betalt. I stället för att gå från butik till butik på Drottninggatan kan du låta handlarna komma till dig och tävla om ditt guld."
      updated="2026"
      faq={faq}
    >
      <H2>Problemet med att sälja guld i Stockholm</H2>
      <P>
        Stockholm har många guldköpare, från etablerade guldsmeder i city till pantbanker och kontantbutiker. Men det
        stora utbudet hjälper dig inte automatiskt: hos varje enskild butik pratar du med <em>en</em> köpare som sätter
        priset. Vill du jämföra måste du fysiskt bära runt smyckena i stan, och även då vet du inte om något bud är
        rimligt.
      </P>

      <H2>Så gör du i stället, marknaden budar</H2>
      <P>
        På <A href="/">GuldBud</A> lägger du ut ditt guld en gång, och flera auktoriserade handlare budar mot varandra i
        realtid. Det spelar ingen roll om du bor i innerstan eller i förorterna runt Stockholm, hela processen sker
        online:
      </P>
      <UL>
        <li>Fota föremålet och fyll i vikt och karat, hemma vid köksbordet.</li>
        <li>Vi granskar och öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Handlarna tävlar om ditt guld, och du ser alla bud i realtid.</li>
        <li>Du accepterar när du är nöjd, och skickar in föremålet i vårt kostnadsfria, försäkrade kuvert.</li>
      </UL>

      <H2>Slipp resan in till stan</H2>
      <P>
        Ingen trängselskatt, ingen jakt på parkering, ingen kö. Efter godkänt slutpris får du ett rekommenderat brev med
        förbetalt porto, försäkrat upp till 100 000 kr. Du lämnar det på närmaste postombud, oavsett om det är i
        Bromma, på Kungsholmen eller i Täby.
      </P>

      <H2>Vad är ditt guld värt?</H2>
      <P>
        Värdet styrs av vikt, karat och <A href="/guider/guldpris-idag">dagens guldpris</A>, inte av vilken stadsdel du
        bor i. Räkna ut en indikation med <A href="/#estimator">värderingskalkylatorn</A>, läs om{' '}
        <A href="/guider/guldauktion">hur en guldauktion fungerar</A>, eller se{' '}
        <A href="/resultat">vad andra fått betalt</A>.
      </P>
    </GuideShell>
  )
}
