import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Guldauktion: så säljer du guld på auktion',
  description:
    'Vad är en guldauktion och hur fungerar budgivningen? Så låter du auktoriserade guldhandlare tävla om ditt guld och får marknadens pris i stället för en enda uppköpares första bud.',
  alternates: { canonical: '/guider/guldauktion' },
}

const faq = [
  {
    q: 'Vad är en guldauktion?',
    a: 'En guldauktion är en marknadsplats där flera köpare budar mot varandra om samma guldföremål. I stället för att en enda uppköpare sätter priset låter du marknaden göra det. På GuldBud är köparna auktoriserade guldhandlare som konkurrerar om ditt guld, och du väljer själv om du accepterar det högsta budet.',
  },
  {
    q: 'Hur fungerar budgivningen?',
    a: 'Du lägger ut föremålet med bilder, vikt och karat. Vi granskar och öppnar auktionen, och godkända handlare lägger bud i realtid. Varje nytt bud måste vara högre än det förra. Du ser alla bud allt eftersom, och kan sätta ett reservationspris om du vill vara säker på en lägstanivå.',
  },
  {
    q: 'Vad kostar det att sälja på guldauktion?',
    a: 'På GuldBud är det kostnadsfritt för dig som säljer. Den vinnande handlaren betalar en köparprovision ovanpå sitt bud, så hela budet går till dig. Jämför det med traditionella auktionshus som ofta tar 15 % säljarprovision.',
  },
  {
    q: 'Är det tryggt att sälja guld på auktion online?',
    a: 'Ja. Alla handlare är manuellt verifierade med organisationsnummer och legitimation. När du accepterat ditt slutpris skickar vi ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Vi äkthetskontrollerar föremålet och betalar ut spårbart via Swish eller bank, aldrig kontant i handen.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Guldauktion"
      title="Guldauktion: låt guldköparna tävla om ditt guld"
      intro="En guldauktion vänder på maktförhållandet: i stället för att du jagar det bästa budet kommer buden till dig. Här förklarar vi vad en guldauktion är, hur budgivningen fungerar och varför den ofta slår både pantbank och guldsmed."
      updated="2026"
      faq={faq}
    >
      <H2>Vad är en guldauktion?</H2>
      <P>
        En <strong>guldauktion</strong> är en plats där flera köpare budar mot varandra om samma guldföremål. Skillnaden
        mot att gå till en guldsmed eller pantbank är enkel men avgörande: där pratar du med <em>en</em> köpare som
        sätter priset. På en auktion är det <strong>marknaden</strong> som gör det, eftersom köparna tävlar.
      </P>
      <P>
        På <A href="/">GuldBud</A> är köparna auktoriserade guldhandlare från hela Sverige. Du lägger ut ditt föremål
        gratis, handlarna budar, och du bestämmer själv om du accepterar det högsta budet.
      </P>

      <H2>Så fungerar budgivningen, steg för steg</H2>
      <UL>
        <li>Du fotograferar föremålet och fyller i vikt och karat. Osäker på karaten? Vi kontrollerar den ändå vid mottagning.</li>
        <li>Vi granskar och öppnar auktionen, oftast inom ett par timmar.</li>
        <li>Godkända handlare lägger bud i realtid. Varje nytt bud måste vara högre än det förra.</li>
        <li>Du följer buden allt eftersom och accepterar när du är nöjd. Du är aldrig tvungen att sälja.</li>
        <li>Efter accept skickar du in föremålet i vårt kostnadsfria, försäkrade rekommenderade brev, och får betalt efter äkthetskontroll.</li>
      </UL>
      <P>
        Vill du se hela flödet i detalj, läs <A href="/how-it-works">hur det fungerar</A>. Du kan också sätta ett{' '}
        <strong>reservationspris</strong>, en lägstanivå som aldrig visas för handlarna. Når inte högsta budet dit är du
        inte skyldig att sälja.
      </P>

      <H2>Guldauktion vs pantbank och guldsmed</H2>
      <P>
        En guldsmed eller pantbank ger ofta ett lågt förstabud, just för att du bara har en köpare att förhålla dig
        till. Det är svårt att veta om budet är rimligt när ingen annan budar emot. Traditionella auktionshus låter
        visserligen köpare tävla, men tar samtidigt en hög säljarprovision, ofta runt 15 %.
      </P>
      <UL>
        <li><strong>Flera köpare tävlar</strong> om ditt föremål, i stället för ett engångsbud.</li>
        <li><strong>Gratis för dig</strong> som säljer, hela budet går till dig.</li>
        <li><strong>Du ser alla bud</strong> i realtid och behåller kontrollen ända till accept.</li>
        <li><strong>Verifierade köpare</strong> och spårbar, försäkrad hantering.</li>
      </UL>
      <P>
        Läs mer om <A href="/guider/var-salja-guld">var man säljer guld bäst</A> och{' '}
        <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt för guld</A>.
      </P>

      <H2>Vad påverkar vad du får på auktionen?</H2>
      <P>
        Slutpriset styrs av <strong>vikten</strong>, <strong>karaten</strong> (guldhalten) och{' '}
        <A href="/guider/guldpris-idag">dagens guldpris</A>, men också av hur många handlare som budar. Ju mer
        konkurrens, desto närmare metallvärdet landar priset. Räkna ut en indikation med{' '}
        <A href="/#estimator">värderingskalkylatorn</A> innan du lägger ut, eller se{' '}
        <A href="/resultat">vad andra fått betalt</A>.
      </P>
    </GuideShell>
  )
}
