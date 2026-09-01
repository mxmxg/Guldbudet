import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld i Uppsala, bäst betalt hemifrån',
  description:
    'Sälja guld i Uppsala? Slipp jämföra guldsmeder i centrum en efter en. Lägg ut hemifrån och låt auktoriserade handlare buda mot varandra om ditt guld. Gratis, tryggt och försäkrat.',
  alternates: { canonical: '/guider/salja-guld-uppsala' },
}

const faq = [
  {
    q: 'Var säljer jag guld bäst i Uppsala?',
    a: 'I Uppsala finns guldsmeder och pantbanker, men hos var och en får du bara ett bud. På GuldBud budar flera auktoriserade handlare mot varandra om ditt guld, så du får marknadens pris. Allt sker hemifrån, oavsett om du bor i Luthagen, Fålhagen eller ute i Sävja.',
  },
  {
    q: 'Fungerar det även utanför stan?',
    a: 'Ja. Processen är online och det försäkrade kuvertet vi skickar når hela Uppland, från Uppsala och Knivsta till Enköping och Bålsta. Du behöver aldrig ta dig in till centrum.',
  },
  {
    q: 'Hur snabbt får jag betalt?',
    a: 'När vi tagit emot och äkthetskontrollerat föremålet betalar vi ut inom 24 timmar via Swish eller bankkonto. Det är kostnadsfritt för dig som säljer.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/salja-guld-uppsala"
      eyebrow="Sälja guld · Uppsala"
      title="Sälja guld i Uppsala, låt handlarna tävla om ditt guld"
      intro="Uppsala är en stad där mycket byter ägare, inte minst bland studenter och i gamla familjehem. Men det bästa priset på ditt guld får du sällan hos den första guldsmeden du besöker. Låt köparna komma till dig i stället."
      updated="2026"
      faq={faq}
    >
      <H2>Ett bud säger inte om det är bra</H2>
      <P>
        Går du till en guldsmed i Uppsala centrum eller en pantbank får du ett förstabud från en enda köpare. Utan något
        att jämföra med är det svårt att veta om budet är rimligt. Det säkra sättet att veta vad ditt guld är värt är att
        låta flera köpare konkurrera.
      </P>

      <H2>Så gör du hemifrån</H2>
      <P>
        På <A href="/">GuldBud</A> lägger du ut föremålet en gång, och auktoriserade handlare budar mot varandra om det.
        Bor du i Uppsala spelar det ingen roll om du är i Gamla Uppsala, på Luthagen eller i studentkorridoren, hela
        processen sker online:
      </P>
      <UL>
        <li>Fota guldet och fyll i vikt och karat.</li>
        <li>Vi granskar och öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Handlarna budar i realtid och du ser varje bud.</li>
        <li>Du accepterar det bud du är nöjd med, helt utan förpliktelser.</li>
      </UL>

      <H2>Försäkrad frakt i hela Uppland</H2>
      <P>
        Efter godkänt slutpris skickar vi ett kostnadsfritt rekommenderat brev med förbetalt porto, försäkrat upp till
        100 000 kr. Du lämnar det på närmaste ombud, i Uppsala, Knivsta, Enköping eller var du än bor i Uppland. Ingen
        cykeltur in till centrum, ingen kö.
      </P>

      <H2>Vad är ditt guld värt?</H2>
      <P>
        Värdet avgörs av vikt, karat och <A href="/guider/guldpris-idag">dagens guldpris</A>, inte av var i Uppsala du
        bor. Räkna ut en indikation med <A href="/#estimator">värderingskalkylatorn</A>, läs om{' '}
        <A href="/guider/guldauktion">hur en guldauktion fungerar</A>, eller om{' '}
        <A href="/guider/salja-arvguld">att sälja arvguld</A>.
      </P>
    </GuideShell>
  )
}
