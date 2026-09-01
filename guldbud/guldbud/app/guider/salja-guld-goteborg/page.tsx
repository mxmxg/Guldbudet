import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld i Göteborg, låt handlarna tävla',
  description:
    'Sälja guld i Göteborg? I stället för ett enda bud hos en guldsmed på Avenyn låter du auktoriserade handlare buda mot varandra om ditt guld. Hemifrån, gratis och med försäkrad frakt.',
  alternates: { canonical: '/guider/salja-guld-goteborg' },
}

const faq = [
  {
    q: 'Var får jag mest för mitt guld i Göteborg?',
    a: 'Hos en enskild guldsmed eller pantbank i Göteborg får du ett bud från en köpare. På GuldBud budar flera auktoriserade handlare mot varandra, så konkurrensen driver priset. Du säljer hemifrån, oavsett om du bor i centrum, på Hisingen eller i Mölndal.',
  },
  {
    q: 'Fungerar det om jag bor utanför Göteborg?',
    a: 'Ja. Allt sker online och det försäkrade kuvertet vi skickar når hela Västsverige, från Kungälv och Partille till Kungsbacka. Du behöver aldrig ta dig in till stan.',
  },
  {
    q: 'Är det tryggt?',
    a: 'Alla handlare är manuellt verifierade med organisationsnummer och legitimation. Efter accept skickas ditt föremål i ett rekommenderat, försäkrat brev, och du får betalt via Swish eller bank efter äkthetskontroll.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/salja-guld-goteborg"
      eyebrow="Sälja guld · Göteborg"
      title="Sälja guld i Göteborg, marknaden sätter priset"
      intro="Från Avenyns guldsmeder till pantbanker på Hisingen, Göteborg har många guldköpare. Men i stället för att nöja dig med ett bud kan du låta flera handlare tävla om ditt guld, utan att lämna hemmet."
      updated="2026"
      faq={faq}
    >
      <H2>Ett bud räcker inte i Göteborg</H2>
      <P>
        Går du till en guldsmed på Avenyn eller en pantbank i centrum får du ett förstabud från en enda köpare. Det kan
        vara rimligt, eller inte, men du har inget att jämföra med. För att verkligen veta vad ditt guld är värt behöver
        du flera köpare som konkurrerar.
      </P>

      <H2>Låt handlarna komma till dig</H2>
      <P>
        På <A href="/">GuldBud</A> lägger du ut föremålet en gång, och auktoriserade guldhandlare från hela landet budar
        mot varandra om det. Bor du i Göteborg spelar det ingen roll om du är i Majorna, på Hisingen eller ute i Mölndal,
        allt sker online:
      </P>
      <UL>
        <li>Fota guldet och ange vikt och karat.</li>
        <li>Vi öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Handlarna budar i realtid och du följer varje bud.</li>
        <li>Du accepterar det högsta budet, helt utan förpliktelser.</li>
      </UL>

      <H2>Försäkrad frakt i hela Västsverige</H2>
      <P>
        När du godkänt ditt slutpris skickar vi ett kostnadsfritt rekommenderat brev med förbetalt porto, försäkrat upp
        till 100 000 kr. Du lämnar det på närmaste ombud, vare sig du bor i Göteborg, Partille, Kungälv eller Kungsbacka.
        Ingen bilresa in till city, ingen parkering vid Nordstan.
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
