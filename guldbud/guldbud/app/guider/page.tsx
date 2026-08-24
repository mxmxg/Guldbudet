import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Guider för dig som ska sälja guld',
  description:
    'Guider om att sälja guld: räkna ut vad ditt guld är värt, förstå karat och stämplar, se guldpriset idag och sälj arvguld tryggt.',
  alternates: { canonical: '/guider' },
}

const GUIDES = [
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
]

export default function GuidesIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <h1 className="font-display text-3xl sm:text-4xl text-gold-100 leading-tight">Allt om att sälja guld</h1>
          <p className="mt-4 text-gold-200/75 leading-relaxed max-w-2xl">
            Lär dig vad ditt guld är värt, förstå karat och stämplar, och sälj tryggt till marknadens bästa pris.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-4">
          {GUIDES.map((g) => (
            <Link key={g.href} href={g.href} className="card card-hover p-6 group">
              <p className="font-display text-lg text-espresso-900 group-hover:text-gold-700 transition">{g.title}</p>
              <p className="text-sm text-espresso-500 mt-1.5 leading-relaxed">{g.desc}</p>
              <span className="inline-block mt-3 text-sm text-gold-600">Läs guiden →</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
