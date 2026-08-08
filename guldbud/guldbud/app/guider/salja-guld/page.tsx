import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld – så får du bäst betalt 2026',
  description:
    'Komplett guide till att sälja guld i Sverige: så räknas guldpriset ut, vad du bör få betalt, och hur du undviker att bli lurad. Låt handlare buda mot varandra.',
  alternates: { canonical: '/guider/salja-guld' },
}

const faq = [
  {
    q: 'Vad får jag betalt när jag säljer guld?',
    a: 'Priset styrs av vikten, karaten (guldhalten) och dagens guldpris. På GuldBud budar flera auktoriserade handlare mot varandra, vilket ofta ger mer än en enskild uppköpares första bud. Använd värderingskalkylatorn för en indikation innan du lägger ut.',
  },
  {
    q: 'Är det gratis att sälja guld på GuldBud?',
    a: 'Ja. Det är kostnadsfritt för dig som säljer – du betalar ingen avgift. Den vinnande handlaren betalar en köparprovision ovanpå sitt bud, så hela budet går till dig.',
  },
  {
    q: 'Hur skickar jag in mitt guld tryggt?',
    a: 'När du accepterat ett bud packar du föremålet och skickar det som rekommenderat och försäkrat till GuldBud. Vi äkthetskontrollerar det och betalar ut till dig, normalt inom några arbetsdagar.',
  },
  {
    q: 'Behöver jag veta karaten på förhand?',
    a: 'Nej. De flesta guldsmycken är stämplade (t.ex. 750 för 18K), men vi kontrollerar alltid guldhalten när vi tagit emot föremålet. Är du osäker kan du gissa – kalkylatorn ger ändå en fingervisning.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Sälja guld"
      title="Sälja guld – så får du bäst betalt"
      intro="Ska du sälja guld men vet inte vad det är värt eller hur du undviker att bli lurad? Här är hela processen – från värdering till utbetalning – och varför konkurrens mellan handlare ger dig mest."
      updated="2026"
      faq={faq}
    >
      <H2>Vad avgör priset på ditt guld?</H2>
      <P>
        Värdet på ett guldföremål bygger på tre saker: <strong>vikten</strong> i gram, <strong>karaten</strong>{' '}
        (hur rent guldet är) och <strong>dagens guldpris</strong> på världsmarknaden. Ett tungt 18K-smycke är värt
        betydligt mer än ett lika tungt 9K-smycke, eftersom det innehåller mer rent guld.
      </P>
      <P>
        Guldpriset rör sig varje dag. Därför är ett bud som var bra förra månaden inte nödvändigtvis bra idag – kolla
        alltid <A href="/guider/guldpris-idag">guldpriset idag</A> innan du bestämmer dig.
      </P>

      <H2>Så räknar du ut ungefärligt värde</H2>
      <P>
        En enkel tumregel: multiplicera vikten med guldhalten och med dagens 24K-pris per gram. Ett exempel – 10 gram
        18K-guld (75 % rent) vid ett 24K-pris på 1 300 kr/g:
      </P>
      <UL>
        <li>10 g × 0,75 × 1 300 kr = ca 9 750 kr i rent metallvärde.</li>
        <li>Utbetalningen brukar ligga något under metallvärdet – men konkurrens mellan handlare pressar upp den.</li>
      </UL>
      <P>
        Slipp räkna för hand: <A href="/#estimator">värderingskalkylatorn</A> gör det åt dig med dagens pris. Vill du
        förstå stämplarna, läs <A href="/guider/karat-18k-14k-9k">vad 18K, 14K och 9K betyder</A>.
      </P>

      <H2>Var får du bäst betalt?</H2>
      <P>
        Guldsmeder och pantbanker ger ofta ett lågt förstabud eftersom du bara pratar med <em>en</em> köpare. Då är det
        svårt att veta om budet är rimligt. Poängen med en auktion är att flera <strong>auktoriserade handlare budar
        mot varandra</strong> om samma föremål – då är det marknaden, inte en enskild uppköpare, som sätter priset.
      </P>
      <P>
        På <A href="/">GuldBud</A> lägger du ut ditt föremål gratis, handlarna tävlar, och du bestämmer själv om du
        accepterar det högsta budet. Du kan sätta ett minimipris om du vill vara säker på en lägstanivå.
      </P>

      <H2>Så undviker du att bli lurad</H2>
      <UL>
        <li>Sälj aldrig efter ett enda muntligt bud – jämför alltid.</li>
        <li>Väg guldet och kolla stämpeln så du vet ungefär vad det borde ge.</li>
        <li>Välj en köpare som äkthetskontrollerar och betalar spårbart, inte kontant i handen.</li>
        <li>Se till att transporten är försäkrad.</li>
      </UL>

      <H2>Steg för steg på GuldBud</H2>
      <UL>
        <li>Fotografera föremålet och fyll i vikt och karat.</li>
        <li>Vi granskar och öppnar auktionen – oftast inom ett par timmar.</li>
        <li>Auktoriserade handlare budar mot varandra i realtid.</li>
        <li>Du accepterar det högsta budet och skickar in föremålet försäkrat.</li>
        <li>Vi kontrollerar äktheten och betalar ut till dig.</li>
      </UL>
      <P>
        Det är <strong>gratis och utan förpliktelser</strong>. Läs mer om <A href="/how-it-works">hur det fungerar</A>{' '}
        eller se <A href="/resultat">tidigare sålda resultat</A>.
      </P>
    </GuideShell>
  )
}
