import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld i Helsingborg, så går budgivningen till',
  description:
    'Sälja guld i Helsingborg? Så fungerar budgivningen steg för steg: 48 timmar, minsta höjning 100 kr, förlängning vid sena bud, och hela slutpriset till dig. Försäkrad frakt i hela nordvästra Skåne.',
  alternates: { canonical: '/guider/salja-guld-helsingborg' },
}

const faq = [
  {
    q: 'Hur lång tid tar en auktion?',
    a: 'Auktionen är öppen i 48 timmar från att vi godkänt föremålet. Kommer ett bud under de sista två minuterna förlängs tiden med två minuter, så budgivningen hinner alltid avslutas i lugn och ro.',
  },
  {
    q: 'Kostar det mig något?',
    a: 'Nej. Du får hela slutbudet utan avdrag. Handlaren betalar provision och frakt ovanpå budet, och den förbetalda försändelsen kostar dig ingenting.',
  },
  {
    q: 'Måste jag acceptera det högsta budet?',
    a: 'Nej. Budgivningen är ett erbjudande till dig, inte ett avtal. Du kan tacka nej och få tillbaka föremålet, eller låta bli att lägga ut det igen.',
  },
  {
    q: 'Kan jag sälja om jag bor utanför Helsingborg?',
    a: 'Ja. Allt sker online, och den försäkrade försändelsen lämnas hos närmaste postombud. Det fungerar lika bra i Höganäs, Landskrona och Ängelholm som mitt i stan.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/salja-guld-helsingborg"
      eyebrow="Sälja guld · Helsingborg"
      title="Sälja guld i Helsingborg, så går budgivningen till"
      intro="I Helsingborg är det lätt att få ett bud på sitt guld. Det svåra är att veta om budet var bra. Den här guiden går igenom exakt hur budgivningen fungerar hos GuldBud, från att du fotar smycket till att pengarna är på kontot."
      updated="2026"
      faq={faq}
    >
      <H2>Problemet med ett enda bud</H2>
      <P>
        En guldsmed på Kullagatan, en pantbank i centrum eller en snabb tur över sundet ger dig alla samma sak: ett
        förstabud från en köpare. Budet kan vara bra. Du har bara inget att jämföra det med, och köparen har ingen
        anledning att bjuda över sig själv.
      </P>
      <P>
        En auktion vänder på det. I stället för att du letar upp köpare kommer köparna till ditt föremål och tävlar om
        det. Det är samma mekanism som gör att ett konstverk får sitt pris på auktion i stället för i en prislista.
      </P>

      <H2>Så fungerar budgivningen, steg för steg</H2>
      <P>
        Reglerna är fasta och lika för alla. Det är värt att känna till dem innan du lägger ut, så du vet vad du tittar
        på när buden börjar ticka in:
      </P>
      <UL>
        <li>
          <strong>48 timmar.</strong> Auktionen öppnar när vi godkänt föremålet och stänger två dygn senare.
        </li>
        <li>
          <strong>Minst 100 kr i höjning.</strong> Varje nytt bud måste överstiga det förra med hundra kronor, oavsett
          om föremålet ligger på 3 000 eller 60 000.
        </li>
        <li>
          <strong>Sena bud förlänger.</strong> Kommer ett bud under de sista två minuterna flyttas sluttiden fram två
          minuter. Ingen kan alltså vinna genom att lägga sitt bud i sista sekunden.
        </li>
        <li>
          <strong>Handlarna kan lägga ett hemligt maxbud.</strong> Systemet budar då åt dem automatiskt, men bara så
          högt som krävs för att leda med hundra kronor. Det gynnar dig: två handlare med höga maxbud driver upp priset
          mot varandra utan att någon behöver sitta vid skärmen.
        </li>
      </UL>

      <H2>Vilka är det som budar</H2>
      <P>
        Bara företag vi godkänt manuellt. Vi kontrollerar organisationsnummer, och handlaren legitimerar sig med BankID
        innan hen får lägga sitt första bud. En privatperson kan alltså inte buda på ditt guld, och en handlare som inte
        sköter sig stängs av.
      </P>
      <P>
        Du ser buden i realtid men aldrig vem som lagt dem. Handlarna ser inte heller varandras identiteter, bara
        beloppen. Det är avsiktligt: budgivningen ska avgöras av vad föremålet är värt, inte av vem som bjuder.
      </P>

      <H2>Vad du får, och vad det kostar</H2>
      <P>
        Du får <strong>hela slutbudet</strong>, utan avdrag. Vinner ett bud på 18 400 kr är det 18 400 kr som betalas ut
        till dig. GuldBuds ersättning betalas av handlaren ovanpå budet, tillsammans med frakten, och den är helt skild
        från din köpeskilling.
      </P>
      <P>
        Att lägga ut kostar ingenting, och du binder dig inte. Tackar du nej till det vinnande budet skickas föremålet
        tillbaka till dig kostnadsfritt.
      </P>

      <H2>Frakten, praktiskt i nordvästra Skåne</H2>
      <P>
        När du accepterat budet skickar vi ett rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Du
        lägger i föremålet och lämnar brevet hos ditt postombud. Vi kontrollerar äktheten när det kommit fram, och sedan
        betalas pengarna ut via Swish eller bank.
      </P>
      <P>
        Eftersom allt sker per post spelar det ingen roll var i regionen du bor. Höganäs, Landskrona och Ängelholm
        fungerar exakt som Helsingborgs centrum, och du behöver aldrig ta dig någonstans med ett smycke i fickan.
      </P>

      <H2>Innan du lägger ut</H2>
      <P>
        Väg föremålet och leta efter stämpeln, oftast 750 för 18 karat eller 585 för 14 karat. Vikten och karaten
        tillsammans med <A href="/guider/guldpris-idag">dagens guldpris</A> ger dig en rimlig förväntan innan första
        budet kommer. Är du osäker på stämpeln, läs om{' '}
        <A href="/guider/karat-18k-14k-9k">skillnaden mellan 18k, 14k och 9k</A>, och testa{' '}
        <A href="/#estimator">värderingskalkylatorn</A> för ett riktvärde.
      </P>
      <P>
        Vill du jämföra med alternativen först, läs{' '}
        <A href="/guider/pantbank-eller-auktion">pantbank eller auktion</A>.
      </P>
    </GuideShell>
  )
}
