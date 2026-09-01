import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld i Malmö, bäst betalt utan resa',
  description:
    'Sälja guld i Malmö? Slipp gå från butik till butik i Skåne. Lägg ut hemifrån och låt auktoriserade handlare buda mot varandra om ditt guld. Gratis, tryggt och med försäkrad frakt.',
  alternates: { canonical: '/guider/salja-guld-malmo' },
}

const faq = [
  {
    q: 'Var säljer man guld bäst i Malmö?',
    a: 'I Malmö finns både guldsmeder och pantbanker, men hos var och en får du bara ett bud. På GuldBud budar flera auktoriserade handlare mot varandra om ditt guld, så du får marknadens pris. Allt görs hemifrån, oavsett om du bor i centrum, i Limhamn eller Rosengård.',
  },
  {
    q: 'Fungerar det i hela Skåne?',
    a: 'Ja. Processen är online och det försäkrade kuvertet vi skickar når hela Skåne, från Malmö och Lund till Helsingborg och Trelleborg. Du behöver aldrig ta dig någonstans.',
  },
  {
    q: 'Vad kostar det?',
    a: 'Det är kostnadsfritt för dig som säljer, du betalar ingen avgift. Den vinnande handlaren betalar en köparprovision ovanpå sitt bud, så hela budet går till dig.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/salja-guld-malmo"
      eyebrow="Sälja guld · Malmö"
      title="Sälja guld i Malmö, låt köparna tävla om ditt guld"
      intro="I Malmö och övriga Skåne finns gott om guldköpare, men det bästa priset får du sällan hos den första du frågar. I stället för att jämföra butik för butik kan du låta flera handlare buda mot varandra, hemifrån."
      updated="2026"
      faq={faq}
    >
      <H2>Därför räcker inte ett bud i Malmö</H2>
      <P>
        En guldsmed eller pantbank i Malmö ger dig ett förstabud, men bara ett. Utan konkurrens är det svårt att veta om
        budet är bra eller om du lämnar pengar på bordet. Det säkra sättet att veta vad ditt guld är värt är att låta
        flera köpare tävla om det.
      </P>

      <H2>Så säljer du smart, konkurrensen jobbar för dig</H2>
      <P>
        På <A href="/">GuldBud</A> lägger du ut ditt guld en gång, och auktoriserade handlare budar mot varandra om det.
        Var du bor i Malmö spelar ingen roll, i Limhamn, på Möllan eller i Hyllie, allt sker online:
      </P>
      <UL>
        <li>Fota föremålet och fyll i vikt och karat.</li>
        <li>Vi granskar och öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Handlarna budar i realtid och du ser varje bud.</li>
        <li>Du accepterar det bud du är nöjd med, utan förpliktelser.</li>
      </UL>

      <H2>Försäkrad frakt i hela Skåne</H2>
      <P>
        Efter godkänt slutpris skickar vi ett kostnadsfritt rekommenderat brev med förbetalt porto, försäkrat upp till
        100 000 kr. Du lämnar det på närmaste ombud, i Malmö, Lund, Helsingborg eller var du än bor i Skåne. Ingen resa,
        ingen parkering.
      </P>

      <H2>Vad är ditt guld värt?</H2>
      <P>
        Värdet avgörs av vikt, karat och <A href="/guider/guldpris-idag">dagens guldpris</A>. Räkna ut en indikation med{' '}
        <A href="/#estimator">värderingskalkylatorn</A>, läs om{' '}
        <A href="/guider/var-salja-guld">var man säljer guld bäst</A>, eller se{' '}
        <A href="/resultat">vad andra fått betalt</A>.
      </P>
    </GuideShell>
  )
}
