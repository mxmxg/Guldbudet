import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'
import ValueEstimator from '@/components/ValueEstimator'

export const metadata: Metadata = {
  title: 'Vad är mitt guld värt? Räkna ut värdet på sekunder',
  description:
    'Räkna ut vad ditt guld är värt utifrån vikt, karat och dagens guldpris. Gratis värderingskalkylator för smycken, mynt och tandguld.',
  alternates: { canonical: '/guider/vad-ar-mitt-guld-vart' },
}

const faq = [
  {
    q: 'Hur vet jag vad mitt guld är värt?',
    a: 'Värdet beror på vikten i gram, karaten (guldhalten) och dagens guldpris. Fyll i vikt och karat i kalkylatorn ovan så får du ett indikativt värde direkt.',
  },
  {
    q: 'Hur vet jag karaten på mitt smycke?',
    a: 'De flesta smycken har en stämpel: 750 betyder 18K, 585 betyder 14K och 375 betyder 9K. Hittar du ingen stämpel kontrollerar vi guldhalten när vi tagit emot föremålet.',
  },
  {
    q: 'Väger jag guldet själv?',
    a: 'En vanlig köksvåg som visar gram räcker för en uppskattning. Vi väger och kontrollerar allt exakt vid mottagandet.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/vad-ar-mitt-guld-vart"
      eyebrow="Värdering"
      title="Vad är mitt guld värt?"
      intro="Fyll i vikt och karat så räknar vi ut ett indikativt värde utifrån dagens guldpris. Gratis, direkt och utan att du behöver skapa konto."
      faq={faq}
    >
      <div className="mb-10">
        <ValueEstimator loggedIn={false} />
      </div>

      <H2>Så fungerar värderingen</H2>
      <P>
        Kalkylatorn tar vikten du fyller i, multiplicerar med guldhalten för din karat och med dagens guldpris. Det
        ger ett <strong>indikativt metallvärde</strong>, ett riktmärke för vad föremålet borde vara värt.
      </P>
      <P>Uträkningen är alltså inte magi, den ser ut så här:</P>
      <UL>
        <li>
          <strong>Vikten i gram</strong>, hela föremålet som det ligger på vågen.
        </li>
        <li>
          <strong>Gånger guldhalten.</strong> 18 karat är 75 procent guld, 14 karat 58,5 procent och 9 karat 37,5
          procent. Resten är andra metaller som gör smycket hållbart.
        </li>
        <li>
          <strong>Gånger dagens pris</strong> på ett gram rent guld.
        </li>
      </UL>

      <H2>Ett räkneexempel</H2>
      <P>
        Säg att du har en ring i 18 karat som väger 6,4 gram, och att ett gram rent guld den dagen kostar 1 200 kr.
        Kursen rör sig varje dag, så siffran här är bara ett exempel, det aktuella priset ser du på{' '}
        <A href="/guider/guldpris-idag">guldpriset idag</A>.
      </P>
      <UL>
        <li>6,4 gram gånger 0,75 ger 4,8 gram rent guld.</li>
        <li>4,8 gånger 1 200 kr ger ett metallvärde på 5 760 kr.</li>
        <li>Kalkylatorn visar då ett spann på ungefär 4 610 till 5 300 kr.</li>
      </UL>

      <H2>Varför spannet ligger under metallvärdet</H2>
      <P>
        En handlare som köper ditt guld ska smälta om det, betala för analys och ta en risk på en kurs som rör sig. Ett
        bud landar därför under metallvärdet, och det gäller överallt, inte bara här. Spannet i kalkylatorn ligger på
        cirka 80 till 92 procent av metallvärdet, alltså ett försiktigt golv och ett tak som förutsätter att flera
        handlare vill ha föremålet.
      </P>
      <P>
        Skillnaden mellan golvet och taket är precis det konkurrensen handlar om. Ett enda bud hamnar nära golvet.
        Flera handlare som budar mot varandra pressar upp priset mot taket.
      </P>

      <H2>Vad kalkylatorn inte kan veta</H2>
      <P>
        Den räknar på guldet, ingenting annat. Det som ligger utanför uträkningen är bland annat:
      </P>
      <UL>
        <li>
          <strong>Stenar.</strong> Diamanter och färgade stenar kan vara värda mer än guldet de sitter i, men de går
          inte att uppskatta utan att se dem.
        </li>
        <li>
          <strong>Märke och hantverk.</strong> Ett signerat smycke kan vara värt mer än sin metall, och då är det inte
          en fråga om vikt.
        </li>
        <li>
          <strong>Platina.</strong> Den har en egen marknad och prissätts inte via guldkursen, så platinaföremål
          värderas vid mottagningen i stället.
        </li>
      </UL>
      <P>
        Ligger något av det här i ditt föremål ska du inte lita på metallvärdet. Lägg ut det ändå och låt handlarna
        bedöma helheten, det är just det de är till för.
      </P>

      <H2>Så väger du hemma</H2>
      <P>
        En vanlig köksvåg som visar hela gram räcker för en uppskattning. Väg föremålet som det är, med stenar och lås,
        och notera vad stämpeln säger. Stämpeln sitter oftast på insidan av en ring, vid låset på en kedja eller på
        stiftet till ett örhänge. 750 betyder 18 karat, 585 betyder 14 karat och 375 betyder 9 karat.
      </P>
      <P>
        Hittar du ingen stämpel alls är det inget hinder. Vi kontrollerar guldhalten när föremålet kommit fram, och du
        ser resultatet innan något är bindande.
      </P>

      <H2>Vem bestämmer slutpriset</H2>
      <P>
        Inte vi. GuldBud fastställer aldrig ett pris och köper inte ditt guld. Handlarna lägger sina bud, och du
        accepterar det högsta eller tackar nej. Kalkylatorn är alltså ett riktmärke att gå till budgivningen med, inte
        ett erbjudande.
      </P>

      <H2>Vad kan jag värdera?</H2>
      <UL>
        <li>Guldsmycken, ringar, halsband, armband, örhängen</li>
        <li>Trasiga eller omoderna smycken (guldvärdet finns kvar ändå)</li>
        <li>Guldmynt och tackor</li>
        <li>Tandguld och arvegods</li>
      </UL>
      <P>
        Osäker på karaten? Läs <A href="/guider/karat-18k-14k-9k">guiden om 18K, 14K och 9K</A>. Vill du se dagens
        kurs? Kolla <A href="/guider/guldpris-idag">guldpriset idag</A>.
      </P>
    </GuideShell>
  )
}
