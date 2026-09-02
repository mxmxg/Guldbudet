import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Bäst betalt för guld, vem ger mest och hur får du det? (2026)',
  description:
    'Vill du ha bäst betalt för ditt guld? Så jämför du guldköpare, undviker låga förstabud och får marknadens högsta pris genom att låta handlare buda mot varandra.',
  alternates: { canonical: '/guider/bast-betalt-for-guld' },
}

const faq = [
  {
    q: 'Vem ger bäst betalt för guld?',
    a: 'Ingen enskild aktör ger alltid bäst betalt, priset varierar från dag till dag och mellan uppköpare. Det säkraste sättet att få mest är att låta flera auktoriserade handlare buda mot varandra om samma föremål, så att marknaden sätter priset i stället för en enda köpares förstabud. Det är precis så GuldBud fungerar.',
  },
  {
    q: 'Hur mycket under guldpriset är normalt att få?',
    a: 'En seriös uppköpare betalar en bit under det rena metallvärdet, det är deras marginal. Hur stor den är skiljer sig mycket. När handlare tävlar pressas marginalen ihop och du hamnar närmare det fulla metallvärdet.',
  },
  {
    q: 'Lönar det sig att jämföra flera guldköpare?',
    a: 'Ja. Skillnaden mellan ett lågt förstabud och det högsta budet i en budgivning kan bli tusentals kronor på samma smycke. Sälj aldrig efter bara ett bud utan att jämföra.',
  },
  {
    q: 'Kostar det något att sälja på GuldBud?',
    a: 'Nej, det är kostnadsfritt för dig som säljer. Den vinnande handlaren betalar en köparprovision ovanpå sitt bud, så hela budet går till dig.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/bast-betalt-for-guld"
      eyebrow="Guide · Bäst betalt för guld"
      title="Bäst betalt för guld, så får du marknadens högsta pris"
      intro="Alla vill ha bäst betalt när de säljer guld, men hur vet du att budet du får faktiskt är bra? Här går vi igenom varför en enda uppköpare sällan ger dig mest, och hur du låter handlarna tävla i stället."
      updated="2026"
      faq={faq}
      answer={
        <>
          <p className="mb-2">
            Ta aldrig första budet. En köpare som vet att du inte har något att jämföra med har ingen
            anledning att bjuda över sig själv. Väg föremålet, ta reda på karaten och räkna ut
            metallvärdet, så vet du vad ett bud ska mätas mot.
          </p>
          <p>
            Låt sedan flera köpare buda mot varandra. På GuldBud får du hela slutbudet utan avdrag,
            och du kan tacka nej ända fram till att du accepterar.
          </p>
        </>
      }
    >
      <H2>Varför ett enda bud nästan aldrig är det bästa</H2>
      <P>
        När du går till en guldsmed eller pantbank pratar du med <em>en</em> köpare. Den köparen tjänar pengar på
        skillnaden mellan vad de betalar dig och vad guldet är värt, så deras första bud är sällan deras högsta. Och
        eftersom du bara har ett bud att gå på är det svårt att veta om det är rimligt.
      </P>
      <P>
        Det är här de flesta förlorar pengar: de tar första budet för att det känns enkelt. Skillnaden mellan ett lågt
        förstabud och marknadens högsta pris kan vara tusentals kronor på samma smycke.
      </P>

      <H2>Så får du bäst betalt: låt handlarna tävla</H2>
      <P>
        Det säkraste sättet att få mest är att låta flera <strong>auktoriserade handlare buda mot varandra</strong> om
        just ditt föremål. Då är det konkurrensen, inte en enskild uppköpare, som sätter priset, och budet klättrar tills
        ingen vill betala mer.
      </P>
      <P>
        På <A href="/">GuldBud</A> lägger du ut ditt guld gratis, handlarna tävlar i realtid, och du bestämmer själv om du
        accepterar det högsta budet. Du kan sätta ett reservationspris om du vill vara säker på en lägstanivå.
      </P>

      <H2>Checklista, så vet du att du får bra betalt</H2>
      <UL>
        <li>Jämför alltid flera bud, aldrig sälj efter ett enda muntligt förstabud.</li>
        <li>Väg guldet och kolla stämpeln, så du vet ungefär vad det borde ge.</li>
        <li>Kolla <A href="/guider/guldpris-idag">guldpriset idag</A>, ett bra bud förra månaden är inte bra idag.</li>
        <li>Räkna ut ungefärligt värde med <A href="/#estimator">värderingskalkylatorn</A> innan du säljer.</li>
        <li>Välj en köpare som äkthetskontrollerar och betalar spårbart, inte kontant i handen.</li>
      </UL>

      <H2>Vad avgör hur mycket du kan få?</H2>
      <P>
        Priset styrs av tre saker: <strong>vikten</strong> i gram, <strong>karaten</strong> (guldhalten) och{' '}
        <strong>dagens guldpris</strong>. Ett tungt 18K-smycke ger mer än ett lika tungt 9K-smycke eftersom det
        innehåller mer rent guld. Vill du förstå stämplarna, läs{' '}
        <A href="/guider/karat-18k-14k-9k">vad 18K, 14K och 9K betyder</A>.
      </P>
      <P>
        Vill du se hela processen från värdering till utbetalning? Läs{' '}
        <A href="/guider/salja-guld">så får du bäst betalt när du säljer guld</A> eller titta på{' '}
        <A href="/resultat">tidigare sålda resultat</A> för att se vad andra fått.
      </P>
    </GuideShell>
  )
}
