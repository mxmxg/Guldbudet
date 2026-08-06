import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata = { title: 'Så fungerar budgivningen · GuldBud' }

const STEPS = [
  {
    n: '1',
    title: 'Bli godkänd handlare',
    desc: 'När du registrerat dig granskar vårt team dina företagsuppgifter och organisationsnummer manuellt. Så fort du är godkänd får du ett mejl och kan börja buda.',
  },
  {
    n: '2',
    title: 'Buda i realtid',
    desc: 'Du ser alla aktiva auktioner med bilder, vikt, karat och metallvärde. Buden uppdateras live och du budar anonymt – för säljaren och övriga handlare syns du bara som ett kundnummer. Ett lagt bud är bindande.',
  },
  {
    n: '3',
    title: 'Håll ledningen',
    desc: 'Du får en notis (i appen och via mejl) så fort någon överbjuder dig, med en direktlänk för att höja ditt bud. Bevaka auktioner du är intresserad av så påminner vi dig innan de avslutas.',
  },
  {
    n: '4',
    title: 'Vinn budgivningen',
    desc: 'När auktionen avslutas har den med högsta budet vunnit. Säljaren bekräftar ditt bud, och en affär skapas som du följer under "Mina affärer". Du får besked direkt.',
  },
  {
    n: '5',
    title: 'Vi tar emot och kontrollerar',
    desc: 'Säljaren skickar föremålet försäkrat till GuldBud. Vi kontrollerar äkthet, vikt och karat innan något går vidare – du behöver aldrig lita blint på en okänd motpart.',
  },
  {
    n: '6',
    title: 'Föremålet skickas till dig',
    desc: 'När kontrollen är godkänd och säljaren är utbetald skickar vi föremålet försäkrat till dig med spårningsnummer. Du bekräftar mottagandet och affären är slutförd.',
  },
]

export default function DealerGuidePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="relative overflow-hidden bg-espresso-900 px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative">
          <p className="eyebrow text-gold-500/80 mb-3">För handlare</p>
          <h1 className="font-display text-4xl text-gold-100 mb-4">Så fungerar budgivningen</h1>
          <p className="text-gold-200/70 max-w-xl mx-auto text-sm leading-relaxed">
            Från ditt första bud till att det vunna föremålet ligger i din hand. GuldBud sitter mellan dig
            och säljaren och sköter kontroll, betalning och frakt – tryggt hela vägen.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <div className="flex flex-col gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6 flex gap-5">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-gold-sheen text-espresso-900 font-display text-lg flex items-center justify-center shadow-gold">
                {s.n}
              </span>
              <div>
                <h2 className="font-display text-lg text-espresso-900 mb-1">{s.title}</h2>
                <p className="text-sm text-espresso-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-espresso-50 border border-espresso-100 p-6">
          <h3 className="font-display text-lg text-espresso-900 mb-2">Provision och betalning</h3>
          <p className="text-sm text-espresso-500 leading-relaxed">
            GuldBud tar en köparprovision på <span className="font-semibold text-espresso-800">8&nbsp;%</span> av
            det vinnande budet. Provisionen läggs <span className="font-semibold text-espresso-800">ovanpå</span> ditt
            bud – säljaren får hela budbeloppet, du betalar bud + provision. När du lägger ett bud ser du alltid
            ditt totalpris direkt i budpanelen.
          </p>
          <p className="text-sm text-espresso-500 leading-relaxed mt-3">
            Exempel: vinnande bud 40&nbsp;000 kr → provision 3&nbsp;200 kr → ditt totalpris 43&nbsp;200 kr.
            All kommunikation med säljaren går via GuldBud i affärsvyn, så att båda parter förblir skyddade.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/dealer/dashboard" className="btn-gold">Till budpanelen</Link>
          <Link href="/auctions" className="btn-ghost-gold">Se auktioner</Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
