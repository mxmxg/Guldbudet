import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Karat på guld: vad betyder 24K, 18K, 14K och 9K?',
  description:
    'Vad betyder karat och stämplarna 999, 750, 585 och 375? Så mycket rent guld innehåller 24K, 18K, 14K och 9K, och vad det betyder för värdet.',
  alternates: { canonical: '/guider/karat-18k-14k-9k' },
}

const faq = [
  {
    q: 'Vad betyder 750 som stämpel?',
    a: '750 betyder att guldet är 75 % rent, alltså 18 karat (18K). Stämpeln anger tusendelar rent guld.',
  },
  {
    q: 'Vilken karat är bäst att sälja?',
    a: 'Ju högre karat, desto mer rent guld och desto högre värde per gram. Men även lägre karat som 9K har ett verkligt guldvärde, så det mesta går att sälja.',
  },
  {
    q: 'Är 18K bättre än 14K?',
    a: '18K innehåller mer rent guld (75 % mot 58,5 %) och är därför värt mer per gram. 14K är samtidigt hårdare och tål slitage bättre.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Karat"
      title="Vad betyder 18K, 14K och 9K?"
      intro="Karat anger hur mycket rent guld ett föremål innehåller. Här är vad stämplarna betyder och hur de påverkar värdet när du säljer."
      faq={faq}
    >
      <H2>Karat = renhet</H2>
      <P>
        Rent guld är för mjukt för smycken, så det legeras (blandas) med andra metaller. Karat anger hur stor del som
        är rent guld. Ofta står renheten som ett tresiffrigt tal, tusendelar rent guld, instämplat i föremålet.
      </P>

      <H2>Vanliga karat och stämplar</H2>
      <UL>
        <li><strong>24K (999)</strong>, rent guld, 99,9 %. Mjukt, mest i mynt och tackor.</li>
        <li><strong>22K (916)</strong>, 91,6 % guld. Vanligt i mynt och en del smycken.</li>
        <li><strong>18K (750)</strong>, 75 % guld. Klassiskt för kvalitetssmycken.</li>
        <li><strong>14K (585)</strong>, 58,5 % guld. Hårdare, tål slitage.</li>
        <li><strong>9K (375)</strong>, 37,5 % guld. Vanligt i äldre och brittiska smycken.</li>
      </UL>

      <H2>Vad betyder det för värdet?</H2>
      <P>
        Värdet per gram följer guldhalten. Ett 18K-smycke innehåller dubbelt så mycket rent guld som ett lika tungt
        9K-smycke, och är därför värt ungefär dubbelt så mycket i metall. Räkna på ditt föremål med{' '}
        <A href="/#estimator">värderingskalkylatorn</A> vid <A href="/guider/guldpris-idag">dagens guldpris</A>.
      </P>
      <P>
        När du vet karaten är du redo att <A href="/guider/salja-guld">sälja guld och få bäst betalt</A>.
      </P>
    </GuideShell>
  )
}
