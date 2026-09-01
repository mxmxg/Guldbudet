import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Var säljer man guld bäst? Pantbank, guldsmed eller auktion (2026)',
  description:
    'Var ska man sälja guld för att få mest? Vi jämför pantbank, guldsmed, guldköpare på nätet och auktion, och förklarar varför budgivning oftast ger dig bäst betalt.',
  alternates: { canonical: '/guider/var-salja-guld' },
}

const faq = [
  {
    q: 'Var får man mest betalt för guld?',
    a: 'Du får normalt mest där flera köpare konkurrerar om ditt guld. En pantbank eller guldsmed ger ett enda bud, medan en auktion låter flera auktoriserade handlare buda mot varandra, vilket driver upp priset. Därför ger budgivning oftast bäst betalt.',
  },
  {
    q: 'Är det bättre att sälja guld på nätet eller i butik?',
    a: 'Online kan du nå fler köpare och låta dem tävla, vilket ofta ger ett högre pris än en enskild butik. I butik får du snabb kontant betalning men bara ett bud. Vill du ha mest betalt är budgivning online oftast bäst.',
  },
  {
    q: 'Kan jag sälja guld nära mig?',
    a: 'Du behöver inte längre leta efter en guldköpare nära dig, det räcker med en dator eller mobil. På GuldBud lägger du ut ditt guld hemifrån, får det budgivet av handlare i hela Sverige och skickar in det i ett försäkrat, förbetalt brev.',
  },
  {
    q: 'Vad ska jag tänka på oavsett var jag säljer?',
    a: 'Jämför alltid flera bud, kolla dagens guldpris, väg guldet och kontrollera stämpeln, och välj en köpare som äkthetskontrollerar och betalar spårbart.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/var-salja-guld"
      eyebrow="Guide · Var sälja guld"
      title="Var säljer man guld bäst? En ärlig jämförelse"
      intro="Pantbank, guldsmed, guldköpare på nätet eller auktion, alternativen är många och priset kan skilja tusenlappar. Här jämför vi dem så att du vet var du får mest för ditt guld."
      updated="2026"
      faq={faq}
    >
      <H2>Dina alternativ, kort och ärligt</H2>
      <P>
        <strong>Guldsmed eller lokal butik.</strong> Snabbt och du får pengar direkt, men du pratar med en enda köpare
        och får ett enda bud. Svårt att veta om det är rimligt.
      </P>
      <P>
        <strong>Pantbank.</strong> Trygg och etablerad, men gör ofta ett låst uppköpspris per gram. Ingen budgivning som
        pressar priset uppåt.
      </P>
      <P>
        <strong>Guldköpare på nätet (guldkuvert).</strong> Smidigt hemifrån, men många ger dig ett fast pris utan att
        flera köpare tävlar, och du binder dig ibland innan du sett budet.
      </P>
      <P>
        <strong>Auktion med budgivning.</strong> Flera auktoriserade handlare budar mot varandra om just ditt föremål.
        Konkurrensen sätter priset, och du bestämmer själv om du accepterar. Det är oftast här du får mest.
      </P>

      <H2>Varför budgivning oftast ger mest</H2>
      <P>
        En enskild köpare tjänar på skillnaden mellan vad de betalar dig och vad guldet är värt, så deras första bud är
        sällan deras högsta. När flera handlare i stället tävlar om samma föremål pressas den marginalen ihop och du
        hamnar närmare det fulla värdet. Läs mer om{' '}
        <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt för guld</A>.
      </P>

      <H2>Måste jag hitta en guldköpare nära mig?</H2>
      <P>
        Nej. Du behöver inte längre åka runt och jämföra butiker. På <A href="/">GuldBud</A> lägger du ut ditt guld
        hemifrån, handlare i hela Sverige budar, och du skickar in föremålet i ett kostnadsfritt, rekommenderat brev med
        förbetalt porto, försäkrat upp till 100 000 kr. Se hur det fungerar med att{' '}
        <A href="/guider/salja-guld-online">sälja guld online</A>.
      </P>

      <H2>Oavsett var du säljer, gör så här</H2>
      <UL>
        <li>Jämför alltid flera bud, aldrig sälj efter ett enda.</li>
        <li>Kolla <A href="/guider/guldpris-idag">guldpriset idag</A> innan du bestämmer dig.</li>
        <li>Väg guldet och kontrollera stämpeln, se <A href="/guider/karat-18k-14k-9k">vad 18K, 14K och 9K betyder</A>.</li>
        <li>Räkna ut ungefärligt värde med <A href="/#estimator">värderingskalkylatorn</A>.</li>
        <li>Välj en köpare som äkthetskontrollerar och betalar spårbart.</li>
      </UL>
    </GuideShell>
  )
}
