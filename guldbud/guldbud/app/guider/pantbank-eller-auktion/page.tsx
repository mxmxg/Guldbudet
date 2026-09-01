import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Pantbank eller auktion, var får du mest för guldet?',
  description:
    'Ska du sälja guld till pantbanken eller på auktion? Så skiljer sig pris, avgifter och trygghet, och därför ger konkurrens mellan flera köpare oftast mer än ett enda uppköpsbud.',
  alternates: { canonical: '/guider/pantbank-eller-auktion' },
}

const faq = [
  {
    q: 'Är det bättre att sälja guld på auktion än till pantbank?',
    a: 'Oftast ja, om målet är högsta pris. På en auktion budar flera köpare mot varandra, så priset sätts av marknaden i stället för ett enda uppköpsbud. Pantbank kan vara smidigt om du vill ha ett lån med guldet som pant i stället för att sälja, men för ren försäljning ger konkurrens normalt mer.',
  },
  {
    q: 'Vad tar en pantbank i avgift?',
    a: 'Vid försäljning på pantbankens auktion tillkommer normalt en köparprovision (ofta runt 15 %). Lånar du med pant tillkommer ränta och avgifter. På GuldBud är det kostnadsfritt för dig som säljer, den vinnande handlaren betalar provisionen ovanpå sitt bud.',
  },
  {
    q: 'Vad är skillnaden på att panta och att sälja?',
    a: 'Att panta betyder att du lånar pengar med guldet som säkerhet och kan lösa tillbaka det. Att sälja betyder att du får betalt och lämnar ifrån dig föremålet. Vill du bli av med guldet till bästa pris är försäljning via auktion oftast bäst, vill du ha tillbaka det senare passar pant.',
  },
]

export default function Page() {
  return (
    <GuideShell
      slug="/guider/pantbank-eller-auktion"
      eyebrow="Guide · Jämförelse"
      title="Pantbank eller auktion, var får du mest för guldet?"
      intro="Pantbank, guldsmed eller auktion, valet avgör hur mycket du får. Här jämför vi vägarna ärligt, och förklarar varför konkurrens mellan flera köpare oftast slår ett enda uppköpsbud."
      updated="2026"
      faq={faq}
    >
      <H2>Panta eller sälja, först det viktiga valet</H2>
      <P>
        En pantbank erbjuder två saker: du kan <strong>panta</strong> guldet (låna pengar med det som säkerhet och lösa
        tillbaka det senare) eller <strong>sälja</strong> det. Vill du bara ha ut pengar och bli av med föremålet är det
        försäljning som gäller, och då är frågan var du får mest.
      </P>

      <H2>Så skiljer sig vägarna</H2>
      <UL>
        <li>
          <strong>Guldsmed / lokal uppköpare:</strong> snabbt, men du får ett enda bud från en enda köpare. Svårt att
          veta om det är rimligt när ingen budar emot.
        </li>
        <li>
          <strong>Pantbank:</strong> trygg och etablerad. Säljer du på deras auktion tillkommer normalt en
          köparprovision runt 15 %, och du konkurrerar med deras egna objekt.
        </li>
        <li>
          <strong>Guldauktion (GuldBud):</strong> flera auktoriserade handlare budar mot varandra om just ditt föremål.
          Gratis för dig som säljer, hela budet går till dig, och du bestämmer själv om du accepterar.
        </li>
      </UL>

      <H2>Varför konkurrens ger mer</H2>
      <P>
        När du bara har en köpare sätter köparen priset. När flera budar mot varandra sätter <strong>marknaden</strong>{' '}
        priset, och det pressas uppåt så länge någon är beredd att betala mer. Det är hela poängen med en{' '}
        <A href="/guider/guldauktion">guldauktion</A>: du behöver inte gissa vilken uppköpare som är ärligast, du låter
        dem tävla.
      </P>
      <P>
        Vill du se vad andra fått betalt? Kolla <A href="/resultat">sålda resultat</A>, eller läs mer om{' '}
        <A href="/guider/var-salja-guld">var man säljer guld bäst</A> och{' '}
        <A href="/guider/bast-betalt-for-guld">hur du får bäst betalt</A>.
      </P>

      <H2>När passar pantbank ändå?</H2>
      <P>
        Pantbank är ett bra val om du <strong>inte vill sälja</strong>, utan behöver pengar tillfälligt och vill ha
        möjlighet att lösa tillbaka guldet. Då slipper du göra dig av med något du vill behålla. Men för ren försäljning
        till högsta pris vinner konkurrensen mellan flera köpare nästan alltid.
      </P>
    </GuideShell>
  )
}
