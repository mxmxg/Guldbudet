import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja arvguld och gamla smycken – så gör du',
  description:
    'Har du ärvt guld eller gamla smycken du inte använder? Så värderar och säljer du arvguld tryggt och får marknadens bästa pris.',
  alternates: { canonical: '/guider/salja-arvguld' },
}

const faq = [
  {
    q: 'Kan jag sälja trasiga eller omoderna smycken?',
    a: 'Ja. Guldvärdet finns kvar även om smycket är trasigt, omodernt eller saknar en sten. Det är guldhalten och vikten som räknas.',
  },
  {
    q: 'Måste alla arvingar vara med och sälja?',
    a: 'Äger ni guldet gemensamt bör ni vara överens innan försäljning. Själva utläggningen och utbetalningen görs av den som lägger ut föremålet.',
  },
  {
    q: 'Vad är gammalt arvguld värt?',
    a: 'Det beror på vikt och karat, inte på ålder eller modell. Äldre smycken är ofta 18K eller 23K och kan därför ha ett högt guldvärde. Räkna med kalkylatorn.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Arvguld"
      title="Sälja arvguld och gamla smycken"
      intro="Ligger det ärvda smycken i byrålådan som ingen använder? Guldvärdet finns kvar oavsett ålder och skick. Så värderar och säljer du arvguld tryggt."
      faq={faq}
    >
      <H2>Gammalt guld har ofta ett högt värde</H2>
      <P>
        Många äldre smycken är tillverkade i hög karat – 18K eller till och med 23K – och kan därför vara värda mer än
        man tror, även om de är omoderna eller trasiga. Det är <strong>guldhalten och vikten</strong> som avgör
        värdet, inte modellen. En sten som lossnat eller en trasig lås spelar liten roll för guldvärdet.
      </P>

      <H2>Så gör du med arvguld</H2>
      <UL>
        <li>Samla ihop smyckena och väg dem grovt på en köksvåg.</li>
        <li>Titta efter stämplar (750, 585, 375) för att gissa karaten.</li>
        <li>Räkna ut ett riktvärde med <A href="/#estimator">värderingskalkylatorn</A>.</li>
        <li>Lägg ut på GuldBud och låt handlare buda mot varandra.</li>
      </UL>

      <H2>Varför auktion passar arvguld</H2>
      <P>
        Arvguld är ofta en blandning av olika smycken och karat. På <A href="/guider/salja-guld">en auktion där
        handlare tävlar</A> får varje del sitt marknadsvärde, i stället för ett samlat lågt bud från en enda
        uppköpare. Du bestämmer själv om du accepterar – och det är{' '}
        <strong>gratis och utan förpliktelser</strong>.
      </P>
      <P>
        Osäker på stämplarna? Läs <A href="/guider/karat-18k-14k-9k">vad 18K, 14K och 9K betyder</A>.
      </P>
    </GuideShell>
  )
}
