import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja trasigt guld, tandguld och guld utan stämpel (2026)',
  description:
    'Trasiga smycken, ensamma örhängen, tandguld eller guld utan stämpel, allt går att sälja. Guldvärdet sitter i metallen, inte skicket. Så får du betalt för guld i vilket skick som helst.',
  alternates: { canonical: '/guider/salja-trasigt-guld' },
}

const faq = [
  {
    q: 'Kan man sälja trasigt guld?',
    a: 'Ja. Värdet på guld sitter i själva metallen, inte i om smycket är helt. Trasiga kedjor, ensamma örhängen, böjda ringar och delar utan lås är fullt säljbara, du får betalt för guldhalten och vikten precis som för hela smycken.',
  },
  {
    q: 'Kan jag sälja guld utan stämpel?',
    a: 'Ja. Alla guldföremål är inte stämplade, särskilt äldre eller utländska. Vi kontrollerar alltid guldhalten när vi tagit emot föremålet, så du behöver inte veta karaten på förhand. Är du osäker kan du gissa i kalkylatorn.',
  },
  {
    q: 'Går det att sälja tandguld?',
    a: 'Ja. Tandguld (guldkronor och broar) innehåller ofta hög guldhalt och är värt att sälja. Du behöver inte rengöra eller ta bort porslin eller tandmaterial, guldhalten bestäms vid mottagandet.',
  },
  {
    q: 'Behöver jag sortera eller laga guldet först?',
    a: 'Nej. Du behöver inte laga, polera eller sortera. Väg gärna och notera eventuella stämplar för en indikation, men vi kontrollerar allt när föremålet kommit fram.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Trasigt guld & tandguld"
      title="Sälja trasigt guld, tandguld och guld utan stämpel"
      intro="Trasiga kedjor, ensamma örhängen, gamla tandkronor eller smycken utan stämpel, mycket som ligger i byrålådan är värt mer än man tror. Guldvärdet sitter i metallen, inte i skicket. Här är vad du behöver veta."
      updated="2026"
      faq={faq}
    >
      <H2>Trasigt guld är fortfarande värt fullt pris</H2>
      <P>
        En vanlig missuppfattning är att ett smycke måste vara helt för att vara värt något. Så är det inte. Guldvärdet
        bestäms av <strong>vikten</strong> och <strong>guldhalten</strong>, inte av om låset fungerar eller om kedjan är
        av. En trasig 18K-kedja är värd lika mycket som en hel 18K-kedja med samma vikt.
      </P>
      <P>
        Det betyder att böjda ringar, ensamma örhängen, kedjor utan lås och delar av smycken alla är fullt säljbara. Samla
        ihop det som ligger och glöms bort, det blir ofta mer än man tror tillsammans.
      </P>

      <H2>Guld utan stämpel, går det att sälja?</H2>
      <P>
        Ja. Alla guldföremål är inte stämplade, särskilt äldre eller utländska smycken. Du behöver inte veta karaten på
        förhand, vi kontrollerar alltid guldhalten när vi tagit emot föremålet. Vill du förstå stämplarna som ändå
        finns, läs <A href="/guider/karat-18k-14k-9k">vad 18K, 14K och 9K betyder</A>.
      </P>

      <H2>Sälja tandguld</H2>
      <P>
        Gamla guldkronor och broar innehåller ofta hög guldhalt och kan vara förvånansvärt värdefulla. Du behöver inte
        rengöra dem eller försöka ta bort porslin, tandmaterial eller annat, guldhalten bestäms vid mottagandet och du
        får betalt för guldet.
      </P>

      <H2>Så får du betalt, oavsett skick</H2>
      <UL>
        <li>Samla ihop allt guld, även trasigt, ostämplat och tandguld.</li>
        <li>Väg gärna och notera stämplar om det finns, för en indikation.</li>
        <li>Räkna ut ungefärligt värde med <A href="/#estimator">värderingskalkylatorn</A>.</li>
        <li>Lägg ut det på <A href="/">GuldBud</A> och låt handlarna buda mot varandra.</li>
        <li>Vi kontrollerar guldhalten, äkthetskontrollerar och betalar ut inom 24 timmar via Swish eller bankkonto.</li>
      </UL>
      <P>
        Vill du veta mer? Läs <A href="/guider/salja-guld">hela guiden om att sälja guld</A> eller{' '}
        <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt</A>. Har du ärvda smycken, se{' '}
        <A href="/guider/salja-arvguld">sälja arvguld</A>.
      </P>
    </GuideShell>
  )
}
