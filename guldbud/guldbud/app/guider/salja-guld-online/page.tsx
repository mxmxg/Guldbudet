import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld online, så gör du det tryggt och får bra betalt (2026)',
  description:
    'Sälja guld online är ofta både tryggare och mer lönsamt än i butik. Så fungerar det, så skickar du guldet säkert, och så ser du till att du får marknadens bästa pris.',
  alternates: { canonical: '/guider/salja-guld-online' },
}

const faq = [
  {
    q: 'Är det tryggt att sälja guld online?',
    a: 'Ja, om du väljer en seriös tjänst. Titta efter att köparen är en auktoriserad handlare, att transporten är försäkrad, att guldet äkthetskontrolleras och att betalningen sker spårbart till ditt konto, inte kontant. På GuldBud är alla handlare auktoriserade och försändelsen är försäkrad.',
  },
  {
    q: 'Hur skickar jag guldet säkert?',
    a: 'När du godkänt ditt slutpris skickar vi dig ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Du lägger föremålet i det och postar det rekommenderat, porto och adress är redan klara.',
  },
  {
    q: 'Får jag mer betalt online än i butik?',
    a: 'Ofta ja. Online kan flera handlare buda mot varandra om ditt guld, vilket pressar upp priset. En fysisk butik ger dig bara ett enda bud att ta eller lämna.',
  },
  {
    q: 'När får jag pengarna?',
    a: 'När vi tagit emot föremålet och kontrollerat äktheten betalar vi ut till dig omgående via Swish eller bankkonto.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Sälja guld online"
      title="Sälja guld online, tryggt, enkelt och ofta mer lönsamt"
      intro="Att sälja guld på nätet känns nytt för många, men gjort rätt är det både tryggare och mer lönsamt än att gå till en butik. Här går vi igenom hur det fungerar, hur du skickar guldet säkert och hur du får bäst betalt."
      updated="2026"
      faq={faq}
    >
      <H2>Varför sälja guld online?</H2>
      <P>
        I en fysisk butik pratar du med en enda köpare och får ett enda bud. Online kan flera{' '}
        <strong>auktoriserade handlare buda mot varandra</strong> om ditt guld, och konkurrensen driver upp priset. Du
        slipper också prutning öga mot öga och kan i lugn och ro jämföra innan du bestämmer dig.
      </P>

      <H2>Så går det till, steg för steg</H2>
      <UL>
        <li>Fotografera föremålet och fyll i vikt och karat (står ofta som en stämpel, t.ex. 750 för 18K).</li>
        <li>Vi granskar och öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Handlarna budar mot varandra i realtid, du följer det live.</li>
        <li>Du accepterar det högsta budet, helt utan förpliktelser.</li>
        <li>Vi skickar dig ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr.</li>
        <li>Vi äkthetskontrollerar och betalar ut omgående via Swish eller bankkonto.</li>
      </UL>

      <H2>Så säljer du guld online tryggt</H2>
      <P>
        Skillnaden mellan en seriös och en oseriös tjänst syns på några punkter. Se till att:
      </P>
      <UL>
        <li>Köparna är auktoriserade handlare, inte anonyma privatpersoner.</li>
        <li>Transporten är försäkrad, så du är skyddad om något händer på vägen.</li>
        <li>Guldet äkthetskontrolleras innan pengarna betalas ut.</li>
        <li>Betalningen sker spårbart till ditt bankkonto, aldrig kontant i handen.</li>
        <li>Du ser vad tjänsten kostar dig. På GuldBud är det gratis att sälja.</li>
      </UL>

      <H2>Så får du bäst betalt online</H2>
      <P>
        Kolla <A href="/guider/guldpris-idag">guldpriset idag</A> och räkna ut ett ungefärligt värde med{' '}
        <A href="/#estimator">värderingskalkylatorn</A> innan du lägger ut. Då vet du direkt om buden ligger rätt. Läs
        också <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt för guld</A> och{' '}
        <A href="/guider/salja-guld">hela guiden om att sälja guld</A>.
      </P>
      <P>
        På <A href="/">GuldBud</A> lägger du ut ditt guld gratis och låter Sveriges auktoriserade guldhandlare tävla om
        att ge dig mest. Se <A href="/resultat">tidigare sålda resultat</A> för vad andra fått.
      </P>
    </GuideShell>
  )
}
