import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja vitguld och rödguld, påverkar färgen värdet?',
  description:
    'Spelar det roll om guldet är vitt, rött eller gult när du säljer? Så fungerar färgat guld, vad som avgör värdet (karaten, inte färgen) och hur du får bäst betalt.',
  alternates: { canonical: '/guider/salja-vitguld-rodguld' },
}

const faq = [
  {
    q: 'Är vitguld värt mer än gult guld?',
    a: 'Nej, inte på grund av färgen. Värdet styrs av guldhalten (karaten) och vikten, inte av tonen. 18K vitguld och 18K gult guld innehåller lika mycket rent guld och är värda ungefär lika mycket i metall. Vitguld kan ibland innehålla lite legeringsmetaller som palladium, men det är karaten som räknas.',
  },
  {
    q: 'Vad är rödguld och rosaguld?',
    a: 'Rödguld och rosaguld är guld legerat med en högre andel koppar, vilket ger den varma tonen. Det är fortfarande riktigt guld, en 18K rödguldsring innehåller lika mycket rent guld (75 %) som en 18K gul ring. Färgen kommer från legeringen, inte från guldmängden.',
  },
  {
    q: 'Är vitguld samma sak som platina eller silver?',
    a: 'Nej. Vitguld är guld som fått en vit ton via legering och ofta en tunn rodinering på ytan. Platina och silver är helt andra metaller med egna priser. Kolla stämpeln: 750 betyder 18K guld, medan platina är stämplat till exempel 950.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Färgat guld"
      title="Sälja vitguld och rödguld: färgen spelar mindre roll än du tror"
      intro="Vitguld, rödguld, rosaguld eller klassiskt gult, färgen känns viktig men avgör sällan värdet. Här förklarar vi vad som faktiskt styr priset på färgat guld och hur du får rätt betalt."
      updated="2026"
      faq={faq}
    >
      <H2>Färgen kommer från legeringen, inte guldet</H2>
      <P>
        Rent guld är alltid gult. De färger du ser i smycken skapas genom att guldet <strong>legeras</strong> med andra
        metaller. Vitguld blandas med vita metaller (som palladium eller nickel) och rodineras ofta för en blank vit yta.
        Rödguld och rosaguld får sin varma ton av <strong>koppar</strong>. I samtliga fall är det fortfarande äkta guld.
      </P>

      <H2>Karaten avgör, inte färgen</H2>
      <P>
        Det som bestämmer hur mycket rent guld ett smycke innehåller är <strong>karaten</strong>, inte färgen. En 18K-bit
        innehåller 75 % guld oavsett om den är vit, röd eller gul. Därför är 18K vitguld och 18K rödguld värda ungefär
        lika mycket i metall vid samma vikt. Vill du förstå stämplarna, läs{' '}
        <A href="/guider/karat-18k-14k-9k">vad 18K, 14K och 9K betyder</A>.
      </P>
      <UL>
        <li><strong>Vitguld</strong> – guld + vita legeringsmetaller, ofta rodinerat. Samma guldhalt som gult vid samma karat.</li>
        <li><strong>Rödguld / rosaguld</strong> – guld + mer koppar. Populärt i äldre svenska smycken, samma guldvärde.</li>
        <li><strong>Gult guld</strong> – guld + silver och koppar i balans. Den klassiska tonen.</li>
      </UL>

      <H2>Så får du bäst betalt oavsett färg</H2>
      <P>
        Eftersom färgen inte styr metallvärdet ska du aldrig nöja dig med ett lågt bud bara för att ett smycke är "omodernt"
        i färgen. Låt i stället flera handlare tävla. På <A href="/">GuldBud</A> budar auktoriserade handlare mot
        varandra, så priset sätts av guldhalten och marknaden, inte av en enskild uppköpares tycke om vitt eller rött.
      </P>
      <P>
        Räkna ut ett ungefärligt värde med <A href="/#estimator">värderingskalkylatorn</A> (ange bara vikt och karat), och
        läs mer om <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt för guld</A>.
      </P>
    </GuideShell>
  )
}
