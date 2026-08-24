import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guldmynt: så får du rätt betalt',
  description:
    'Ska du sälja guldmynt som Krugerrand, dukater eller sovereigns? Så värderas mynt på både guldvikt och samlarvärde, och så låter du handlare buda mot varandra för bäst pris.',
  alternates: { canonical: '/guider/salja-guldmynt' },
}

const faq = [
  {
    q: 'Vad är ett guldmynt värt?',
    a: 'Grundvärdet är myntets guldvikt gånger dagens guldpris. Ovanpå det kan komma ett samlarvärde (numismatiskt värde) för sällsynta eller välbevarade mynt. Vanliga bullionmynt som Krugerrand följer i stort sett guldpriset, medan äldre eller ovanliga mynt kan vara värda mer än sin metall.',
  },
  {
    q: 'Hur vet jag hur mycket guld ett mynt innehåller?',
    a: 'De flesta guldmynt har en känd finvikt. En Krugerrand innehåller till exempel exakt ett troy ounce (31,1 gram) rent guld, en brittisk sovereign cirka 7,32 gram. Ange myntets typ och antal när du lägger ut, så räknar vi på rätt guldhalt.',
  },
  {
    q: 'Får jag mer om jag säljer mynt på auktion?',
    a: 'Ofta ja. När flera handlare budar mot varandra prissätts både guldet och ett eventuellt samlarvärde av marknaden, i stället för att en enda uppköpare bara betalar smältvärdet. Det är särskilt värdefullt för mynt som kan ha ett samlarvärde.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Guldmynt"
      title="Sälja guldmynt: guldvikt plus samlarvärde"
      intro="Guldmynt är en egen värld, värdet sitter inte bara i guldet utan ibland också i myntet självt. Här går vi igenom hur guldmynt värderas och hur du får betalt för både metallen och ett eventuellt samlarvärde."
      updated="2026"
      faq={faq}
    >
      <H2>Två sorters värde i ett mynt</H2>
      <P>
        Ett guldmynt har oftast <strong>två</strong> värden. Det ena är <strong>guldvärdet</strong>: myntets finvikt
        gånger <A href="/guider/guldpris-idag">dagens guldpris</A>. Det andra är ett eventuellt{' '}
        <strong>samlarvärde</strong>, det numismatiska värdet för sällsynta, gamla eller särskilt välbevarade mynt.
      </P>
      <P>
        Bullionmynt som präglats för att spegla guldpriset, till exempel Krugerrand, Wiener Philharmoniker och Canadian
        Maple Leaf, ligger nära sitt guldvärde. Äldre kurantmynt och ovanliga årgångar kan däremot vara värda betydligt
        mer än metallen.
      </P>

      <H2>Vanliga guldmynt och deras guldinnehåll</H2>
      <UL>
        <li><strong>Krugerrand</strong> – 1 troy ounce (31,1 g) rent guld.</li>
        <li><strong>Brittisk sovereign</strong> – ca 7,32 g rent guld.</li>
        <li><strong>Svensk dukat</strong> – ca 3,44 g guld (23,75 karat).</li>
        <li><strong>20 franc (Napoleon)</strong> – ca 5,81 g rent guld.</li>
        <li><strong>10 kr / 20 kr guldmynt (Sverige/Skandinavien)</strong> – ca 4,03 g respektive 8,06 g rent guld.</li>
      </UL>
      <P>
        Är du osäker på myntet? Fota det tydligt och beskriv vad du vet, handlarna känner igen de flesta mynt och vi
        kontrollerar alltid vikt och halt vid mottagning.
      </P>

      <H2>Så säljer du guldmynt tryggt</H2>
      <P>
        Sälj aldrig ett samlarmynt till första bästa smältpris, då riskerar du att missa samlarvärdet. Poängen med en{' '}
        <A href="/guider/guldauktion">guldauktion</A> är att flera auktoriserade handlare budar mot varandra, så att både
        guldet och ett eventuellt samlarvärde prissätts av marknaden.
      </P>
      <UL>
        <li>Lägg ut myntet med tydliga bilder på båda sidor.</li>
        <li>Ange typ, årtal och antal om du vet, det hjälper handlarna att buda rätt.</li>
        <li>Handlarna tävlar, och du accepterar det högsta budet, helt utan förpliktelser.</li>
        <li>Efter accept skickar du in myntet i vårt kostnadsfria, försäkrade rekommenderade brev.</li>
      </UL>
      <P>
        Läs mer om <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt för guld</A> eller{' '}
        <A href="/#estimator">räkna ut ett ungefärligt värde</A> utifrån vikt och halt.
      </P>
    </GuideShell>
  )
}
