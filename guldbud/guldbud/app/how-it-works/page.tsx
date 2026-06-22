import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#1a1208] px-4 py-16 text-center">
        <p className="text-[#8B6914] text-xs tracking-widest uppercase mb-3">Enkelt och tryggt</p>
        <h1 className="text-3xl font-medium text-[#D4AF37] mb-4">Så fungerar GuldBud</h1>
        <p className="text-[#c9a84c] max-w-xl mx-auto text-sm leading-relaxed">
          Från uppladdning till pengarna på kontot — vi guidar dig genom hela processen.
          Allt sker tryggt, snabbt och med full kontroll.
        </p>
      </div>

      {/* Steg */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex flex-col gap-6">
          {[
            {
              step: '1',
              time: 'Direkt',
              title: 'Fotografera och lägg ut ditt föremål',
              desc: 'Ta minst 2 bilder — framsida, baksida och stämpel om möjligt. Fyll i vikt och karat. Det tar under 5 minuter.',
              color: 'bg-amber-100 text-amber-700 border-amber-200',
            },
            {
              step: '2',
              time: 'Inom 2 timmar',
              title: 'Vi granskar och godkänner',
              desc: 'Vårt team kontrollerar bilderna och uppgifterna. Är allt okej öppnar vi budgivningen. Du får en notifiering när auktionen startar.',
              color: 'bg-blue-100 text-blue-700 border-blue-200',
            },
            {
              step: '3',
              time: '48 timmar',
              title: 'Auktoriserade handlare budar',
              desc: 'Endast verifierade och godkända guldhandlare ser ditt föremål och budar mot varandra. Du ser buden i realtid och kan följa auktionen.',
              color: 'bg-purple-100 text-purple-700 border-purple-200',
            },
            {
              step: '4',
              time: 'Du bestämmer',
              title: 'Välj det bästa budet',
              desc: 'När auktionen stänger väljer du om du vill acceptera det högsta budet. Ingen press — du har alltid rätt att tacka nej.',
              color: 'bg-green-100 text-green-700 border-green-200',
            },
            {
              step: '5',
              time: 'Samma dag',
              title: 'Skicka med rekommenderad försäkrad post',
              desc: 'Säljaren ansvarar för att skicka föremålet med rekommenderat och försäkrat brev. Vi hjälper dig välja rätt fraktalternativ baserat på föremålets värde.',
              color: 'bg-orange-100 text-orange-700 border-orange-200',
            },
            {
              step: '6',
              time: 'Inom 24 timmar',
              title: 'Vi verifierar äktheten',
              desc: 'När vi mottagit föremålet granskar våra experter äktheten, vikten och karathalten. Om allt stämmer betalar vi ut direkt.',
              color: 'bg-teal-100 text-teal-700 border-teal-200',
            },
            {
              step: '7',
              time: 'Samma dag',
              title: 'Pengarna på ditt konto',
              desc: 'Utbetalning sker via Swish samma dag som vi verifierat föremålet. Totalt tar hela processen 4–5 dagar.',
              color: 'bg-amber-100 text-amber-700 border-amber-200',
            },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 flex gap-5">
              <div className="shrink-0 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-lg border ${s.color}`}>
                  {s.step}
                </div>
                {i < 6 && <div className="w-0.5 bg-stone-200 flex-1 mt-2 mb-0 min-h-6" />}
              </div>
              <div className="flex-1">
                <span className="text-xs text-[#B8860B] font-medium">{s.time}</span>
                <h3 className="font-medium text-stone-900 mt-0.5 mb-2">{s.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-xl font-medium text-stone-800 mb-6">Vanliga frågor</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                q: 'Vad kostar det att lägga ut ett föremål?',
                a: 'Det är helt gratis att lägga ut föremål och ta emot bud. Vi tar en provision på 5% av slutpriset om du accepterar ett bud.',
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
                a: 'Alla handlare på GuldBud är manuellt granskade och godkända av oss. Vi kontrollerar företagsuppgifter och legitimation innan de får buda.',
              },
              {
                q: 'Måste jag acceptera det högsta budet?',
                a: 'Nej, du har alltid rätt att tacka nej till alla bud. Du kan också sätta ett minimipris när du lägger ut föremålet.',
              },
              {
                q: 'Hur skickar jag föremålet på ett säkert sätt?',
                a: 'Säljaren ansvarar för att skicka föremålet med rekommenderat och försäkrat brev. Vi hjälper dig välja rätt fraktalternativ baserat på föremålets värde så att det är fullt försäkrat under transporten.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl p-5">
                <h4 className="font-medium text-stone-900 mb-2">{faq.q}</h4>
                <p className="text-stone-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#1a1208] rounded-2xl p-8 text-center">
          <h3 className="text-xl text-[#D4AF37] font-medium mb-2">Redo att sälja ditt guld?</h3>
          <p className="text-[#8B6914] text-sm mb-6">Det tar under 5 minuter att lägga ut ditt första föremål.</p>
          <Link href="/auth/login?mode=register" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white font-medium px-8 py-3 rounded-lg transition inline-block">
            Kom igång gratis
          </Link>
        </div>
      </div>
    </div>
  )
}
