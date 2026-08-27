'use client'
import { useState } from 'react'
import Link from 'next/link'

// Vanliga frågor på startsidan. Bemöter de vanligaste invändningarna precis
// innan köpbeslutet. Alla svar är ärliga och matchar villkoren. Lägger även in
// FAQPage-schema (JSON-LD) för bättre synlighet i Google.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Vad kostar det att sälja?',
    a: 'Ingenting för dig som säljer. Du får hela det vinnande budet, utan avdrag. Det är den köpande handlaren som betalar en provision till GuldBud, aldrig du.',
  },
  {
    q: 'Hur och när får jag betalt?',
    a: 'När du godkänt ett bud skickar vi dig ett kostnadsfritt, försäkrat brev. Så snart vi tagit emot och äkthetskontrollerat föremålet betalar vi ut hela budet omgående via Swish eller bankkonto.',
  },
  {
    q: 'Är det säkert att skicka in mitt guld?',
    a: 'Ja. Du postar det i ett rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Försändelsen är spårbar hela vägen, och porto och adress är redan klara när du fått brevet.',
  },
  {
    q: 'Vad händer om jag inte är nöjd med buden?',
    a: 'Du bestämmer själv. Du kan sätta ett reservationspris och du kan alltid tacka nej. Inget säljs utan att du godkänner det, och det är helt kostnadsfritt att lägga ut.',
  },
  {
    q: 'Vilka är det som budar på mitt föremål?',
    a: 'Bara auktoriserade guldhandlare som vi verifierat med organisationsnummer och legitimation. Inga anonyma köpare. Flera handlare budar mot varandra, vilket pressar priset uppåt.',
  },
  {
    q: 'Behöver jag kvitto på guldet?',
    a: 'Nej. De flesta säljer ärvda eller gamla smycken utan kvitto, det är helt normalt. Vi ber bara om en enkel bekräftelse på hur du kommit över föremålet, som en trygghet för alla.',
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl sm:text-4xl text-espresso-900">Vanliga frågor</h2>
        <p className="mt-3 text-espresso-500">Allt du undrar innan du lägger ut ditt guld.</p>
      </div>
      <div className="flex flex-col gap-3">
        {FAQ.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-espresso-900">{f.q}</span>
                <span
                  className={`shrink-0 w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center transition-transform ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                  aria-hidden
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-espresso-600 leading-relaxed">{f.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-espresso-500 mt-8">
        Har du en annan fråga?{' '}
        <Link href="/how-it-works" className="text-gold-700 hover:text-gold-800 font-medium">
          Läs mer om hur det fungerar
        </Link>
      </p>
    </section>
  )
}
