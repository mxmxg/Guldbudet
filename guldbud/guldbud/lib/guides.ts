import type { Guide } from './guides.types'

// Alla guider på ett ställe. Låg tidigare bara i app/guider/page.tsx, men
// GuideShell behöver samma lista för att kunna länka guiderna till varandra,
// och två kopior av en lista med tjugo poster glider isär.
//
// Ordningen är innehållslig: besläktade guider ligger intill varandra, först de
// breda säljguiderna, sedan värde och karat, sedan de specifika föremålen, och
// sist orterna. Det är den ordningen relatedGuides() bygger på.
export const GUIDES: Guide[] = [
  {
    href: '/guider/salja-guld',
    title: 'Så får du bäst betalt när du säljer guld',
    desc: 'Hela processen från värdering till utbetalning, och hur du undviker att bli lurad.',
  },
  {
    href: '/guider/guldauktion',
    title: 'Guldauktion: så säljer du guld på auktion',
    desc: 'Vad en guldauktion är, hur budgivningen fungerar och varför den slår pantbank och guldsmed.',
  },
  {
    href: '/guider/bast-betalt-for-guld',
    title: 'Bäst betalt för guld',
    desc: 'Vem ger mest, och hur du låter handlarna tävla i stället för att ta första budet.',
  },
  {
    href: '/guider/vad-ar-mitt-guld-vart',
    title: 'Vad är mitt guld värt?',
    desc: 'Räkna ut värdet på sekunder utifrån vikt, karat och dagens guldpris.',
  },
  {
    href: '/guider/guldpris-idag',
    title: 'Guldpris idag',
    desc: 'Aktuellt pris per gram för 24K, 18K, 14K och 9K, och vad som styr det.',
  },
  {
    href: '/guider/var-salja-guld',
    title: 'Var säljer man guld bäst?',
    desc: 'Pantbank, guldsmed, nätet eller auktion, en ärlig jämförelse av var du får mest.',
  },
  {
    href: '/guider/salja-guld-online',
    title: 'Sälja guld online',
    desc: 'Så säljer du guld på nätet tryggt, och ofta mer lönsamt än i butik.',
  },
  {
    href: '/guider/karat-18k-14k-9k',
    title: 'Vad betyder 18K, 14K och 9K?',
    desc: 'Karat och stämplar förklarade, och hur guldhalten påverkar värdet.',
  },
  {
    href: '/guider/salja-arvguld',
    title: 'Sälja arvguld och gamla smycken',
    desc: 'Så värderar och säljer du ärvda eller omoderna smycken tryggt.',
  },
  {
    href: '/guider/salja-trasigt-guld',
    title: 'Sälja trasigt guld och tandguld',
    desc: 'Trasigt, ostämplat eller tandguld, värdet sitter i metallen, inte i skicket.',
  },
  {
    href: '/guider/salja-guldmynt',
    title: 'Sälja guldmynt',
    desc: 'Krugerrand, dukater och sovereigns, värdet sitter i både guldvikt och samlarvärde.',
  },
  {
    href: '/guider/pantbank-eller-auktion',
    title: 'Pantbank eller auktion?',
    desc: 'Var får du mest för guldet? En ärlig jämförelse av pris, avgifter och trygghet.',
  },
  {
    href: '/guider/salja-guld-stockholm',
    title: 'Sälja guld i Stockholm',
    desc: 'Slipp springa mellan guldsmeder i city, låt handlarna tävla hemifrån.',
  },
  {
    href: '/guider/salja-guld-goteborg',
    title: 'Sälja guld i Göteborg',
    desc: 'Från Avenyn till Hisingen, låt flera handlare buda om ditt guld online.',
  },
  {
    href: '/guider/salja-guld-malmo',
    title: 'Sälja guld i Malmö',
    desc: 'Bäst betalt i hela Skåne utan att lämna hemmet, marknaden sätter priset.',
  },
  {
    href: '/guider/salja-vitguld-rodguld',
    title: 'Sälja vitguld och rödguld',
    desc: 'Påverkar färgen värdet? Nej, det är karaten som räknas, inte tonen.',
  },
  {
    href: '/guider/salja-guld-utan-kvitto',
    title: 'Sälja guld utan kvitto',
    desc: 'Saknar du kvittot på ärvda eller gamla smycken? Det går alldeles utmärkt.',
  },
  {
    href: '/guider/skatt-pa-salt-guld',
    title: 'Skatt på sålt guld',
    desc: 'Måste man skatta? Så gäller reglerna för smycken kontra investeringsguld.',
  },
  {
    href: '/guider/salja-guld-uppsala',
    title: 'Sälja guld i Uppsala',
    desc: 'Från Luthagen till Sävja, låt handlarna tävla om ditt guld hemifrån.',
  },
  {
    href: '/guider/salja-guld-helsingborg',
    title: 'Sälja guld i Helsingborg',
    desc: 'Bäst betalt i hela nordvästra Skåne, marknaden sätter priset.',
  },
]

// Tre guider att läsa vidare, för sidan med den här sökvägen.
//
// Väljs som de tre nästkommande i listan, cirkulärt. Det ger två saker som en
// ämnesbaserad gissning inte ger: varje guide får exakt tre inkommande länkar,
// så ingen blir föräldralös, och urvalet är deterministiskt, alltså samma på
// servern och i webbläsaren och samma vid varje genomsökning.
//
// Skälet är konkret. Den 1 september 2026 låg 18 adresser i Search Console som
// "upptäckt, inte indexerad" med tom kolumn för senaste genomsökning. Enda
// vägen in till en guide var sidfotens länk till /guider. Fler interna vägar
// är den spak vi själva kontrollerar.
export function relatedGuides(href: string, count = 3): Guide[] {
  const i = GUIDES.findIndex((g) => g.href === href)
  if (i < 0) return GUIDES.slice(0, count)
  return Array.from({ length: count }, (_, n) => GUIDES[(i + 1 + n) % GUIDES.length])
}
