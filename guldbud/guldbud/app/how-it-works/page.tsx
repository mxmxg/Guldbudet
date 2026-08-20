import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata = { title: 'Så fungerar det · GuldBud' }

const STEPS = [
  {
    step: '1',
    time: 'Direkt',
    title: 'Fotografera och lägg ut ditt föremål',
    desc: 'Ta minst 2 bilder: framsida, baksida och stämpel om möjligt. Fyll i vikt och karat. Det tar under 5 minuter.',
  },
  {
    step: '2',
    time: 'Inom 2 timmar',
    title: 'Vi granskar och godkänner',
    desc: 'Vårt team kontrollerar bilderna och uppgifterna. Är allt okej öppnar vi budgivningen. Du får en notifiering när auktionen startar.',
  },
  {
    step: '3',
    time: 'Under budgivningen',
    title: 'Auktoriserade handlare budar',
    desc: 'Endast verifierade och godkända guldhandlare ser ditt föremål och budar mot varandra. Du ser buden i realtid och kan följa auktionen.',
  },
  {
    step: '4',
    time: 'Du bestämmer',
    title: 'Välj det bästa budet',
    desc: 'När auktionen stänger väljer du om du vill acceptera det högsta budet. Ingen press, du har alltid rätt att tacka nej.',
  },
  {
    step: '5',
    time: 'Efter avslutad auktion',
    title: 'Posta i vårt kostnadsfria rekommenderade brev',
    desc: 'När du godkänt ditt slutpris skickar vi dig ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Du lägger föremålet i det och postar det rekommenderat. Porto och adress är redan klara.',
  },
  {
    step: '6',
    time: 'Efter mottagning',
    title: 'Vi verifierar äktheten',
    desc: 'När vi mottagit föremålet granskar våra experter äktheten, vikten och karathalten. Stämmer allt förbereder vi utbetalningen.',
  },
  {
    step: '7',
    time: '1–2 bankdagar',
    title: 'Pengarna på ditt konto',
    desc: 'När kontrollen är godkänd betalas beloppet ut till ditt konto, normalt inom 1–2 bankdagar. Du får hela det vinnande budet – inga avgifter dras.',
  },
]

const FAQ = [
  {
    q: 'Vad kostar det att lägga ut ett föremål?',
    a: 'Det är helt gratis för dig som säljare – du får hela det vinnande budet, inga avgifter dras. GuldBud tar i stället en köparprovision av den vinnande handlaren.',
  },
  {
    q: 'Kan jag ångra mig efter att jag accepterat ett bud?',
    a: 'Du kan ångra dig fram tills du skickat iväg föremålet. Kontakta oss så hjälper vi dig.',
  },
  {
    q: 'Vad händer om föremålet inte är äkta?',
    a: 'Om föremålet inte stämmer överens med beskrivningen skickas det tillbaka till dig utan kostnad och budet annulleras.',
  },
  {
    q: 'Hur vet jag att handlarna är seriösa?',
    a: 'Alla handlare på GuldBud är manuellt granskade och godkända av oss. Vi kontrollerar företagsuppgifter innan de får buda.',
  },
  {
    q: 'Måste jag acceptera det högsta budet?',
    a: 'Nej, du har alltid rätt att tacka nej till alla bud. Du kan också sätta ett reservationspris när du lägger ut föremålet.',
  },
  {
    q: 'Hur skickar jag föremålet på ett säkert sätt?',
    a: 'När du godkänt ditt slutpris skickar vi dig ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Du lägger föremålet i det och postar det rekommenderat, porto och adress är redan klara.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-espresso-900 px-4 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-4xl text-gold-100 mb-4">Så fungerar GuldBud</h1>
          <p className="text-gold-200/70 max-w-xl mx-auto text-sm leading-relaxed">
            Från uppladdning till pengarna på kontot. Vi guidar dig genom hela processen. Allt sker tryggt,
            snabbt och med full kontroll.
          </p>
        </div>
      </div>

      {/* Steg */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex flex-col gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="card p-6 flex gap-5">
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl bg-gold-sheen text-espresso-900 font-display text-lg flex items-center justify-center shadow-gold">
                  {s.step}
                </div>
                {i < STEPS.length - 1 && <div className="w-0.5 bg-espresso-100 flex-1 mt-2 min-h-6" />}
              </div>
              <div className="flex-1">
                <span className="text-xs text-gold-600 font-medium">{s.time}</span>
                <h3 className="font-display text-lg text-espresso-900 mt-0.5 mb-1">{s.title}</h3>
                <p className="text-espresso-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="font-display text-2xl text-espresso-900 mb-6">Vanliga frågor</h2>
          <div className="flex flex-col gap-4">
            {FAQ.map((faq, i) => (
              <div key={i} className="card p-5">
                <h4 className="font-medium text-espresso-900 mb-2">{faq.q}</h4>
                <p className="text-espresso-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden mt-12 bg-espresso-900 rounded-2xl p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
          <div className="pointer-events-none absolute -top-16 right-1/4 w-56 h-56 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="relative">
            <h3 className="font-display text-2xl text-gold-100 mb-2">Redo att sälja ditt guld?</h3>
            <p className="text-gold-500/70 text-sm mb-6">Det tar under 5 minuter att lägga ut ditt första föremål.</p>
            <Link href="/auth/login?mode=register" className="btn-gold">
              Kom igång gratis
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
