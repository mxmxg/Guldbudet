import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld i Helsingborg, marknaden sätter priset',
  description:
    'Sälja guld i Helsingborg? I stället för ett enda bud hos en guldsmed låter du auktoriserade handlare buda mot varandra om ditt guld. Hemifrån, gratis och med försäkrad frakt i hela nordvästra Skåne.',
  alternates: { canonical: '/guider/salja-guld-helsingborg' },
}

const faq = [
  {
    q: 'Var får jag mest för mitt guld i Helsingborg?',
    a: 'Hos en enskild guldsmed eller pantbank i Helsingborg får du ett bud från en köpare. På GuldBud budar flera auktoriserade handlare mot varandra, så konkurrensen driver priset. Du säljer hemifrån, oavsett om du bor på Söder, Tågaborg eller i Råå.',
  },
  {
    q: 'Fungerar det i hela nordvästra Skåne?',
    a: 'Ja. Allt sker online och det försäkrade kuvertet vi skickar når hela regionen, från Helsingborg och Höganäs till Landskrona och Ängelholm. Du behöver aldrig ta dig in till city.',
  },
  {
    q: 'Är det tryggt?',
    a: 'Alla handlare är manuellt verifierade med organisationsnummer och legitimation. Efter accept skickas ditt föremål i ett rekommenderat, försäkrat brev, och du får betalt via Swish eller bank efter äkthetskontroll.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Sälja guld · Helsingborg"
      title="Sälja guld i Helsingborg utan att lämna hemmet"
      intro="I Helsingborg och nordvästra Skåne finns gott om guldköpare, men det bästa priset får du sällan hos den första du frågar. I stället för att jämföra butik för butik längs Kullagatan kan du låta flera handlare tävla om ditt guld."
      updated="2026"
      faq={faq}
    >
      <H2>Därför räcker inte ett bud i Helsingborg</H2>
      <P>
        En guldsmed på Kullagatan eller en pantbank i centrum ger dig ett förstabud, men bara ett. Utan konkurrens är det
        svårt att veta om budet är bra eller om du lämnar pengar på bordet. Det säkra sättet att veta vad ditt guld är
        värt är att låta flera köpare tävla om det.
      </P>

      <H2>Låt köparna komma till dig</H2>
      <P>
        På <A href="/">GuldBud</A> lägger du ut ditt guld en gång, och auktoriserade handlare budar mot varandra om det.
        Var du bor i Helsingborg spelar ingen roll, på Söder, Tågaborg eller nere vid Råå, allt sker online:
      </P>
      <UL>
        <li>Fota föremålet och ange vikt och karat.</li>
        <li>Vi öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Handlarna budar i realtid och du följer varje bud.</li>
        <li>Du accepterar det högsta budet, helt utan förpliktelser.</li>
      </UL>

      <H2>Försäkrad frakt i hela regionen</H2>
      <P>
        När du godkänt ditt slutpris skickar vi ett kostnadsfritt rekommenderat brev med förbetalt porto, försäkrat upp
        till 100 000 kr. Du lämnar det på närmaste ombud, i Helsingborg, Höganäs, Landskrona eller Ängelholm. Ingen resa
        in till centrum, ingen jakt på parkering.
      </P>

      <H2>Räkna ut värdet först</H2>
      <P>
        Vikt, karat och <A href="/guider/guldpris-idag">dagens guldpris</A> avgör värdet. Testa{' '}
        <A href="/#estimator">värderingskalkylatorn</A>, läs om{' '}
        <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt för guld</A>, eller jämför{' '}
        <A href="/guider/pantbank-eller-auktion">pantbank och auktion</A>.
      </P>
    </GuideShell>
  )
}
