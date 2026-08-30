import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// bullets renderas efter body, för uppräkningar som blir oläsliga som löptext
// (t.ex. GuldBuds åtaganden mot säljaren).
export type LegalSection = { heading: string; body: string[]; bullets?: string[] }

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="relative overflow-hidden bg-espresso-900 px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative">
          <p className="eyebrow text-gold-500/80 mb-3">{eyebrow}</p>
          <h1 className="font-display text-4xl text-gold-100 mb-4">{title}</h1>
          <p className="text-gold-200/70 max-w-xl mx-auto text-sm leading-relaxed">{intro}</p>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-4 py-14 w-full">
        <p className="text-xs text-espresso-400 mb-8">Senast uppdaterad: {updated}</p>

        <div className="flex flex-col gap-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-display text-xl text-espresso-900 mb-3">
                {i + 1}. {s.heading}
              </h2>
              <div className="flex flex-col gap-3">
                {s.body.map((p, j) => (
                  <p key={j} className="text-sm text-espresso-600 leading-relaxed">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="list-disc pl-5 flex flex-col gap-1.5">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="text-sm text-espresso-600 leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-espresso-50 border border-espresso-200 p-5">
          <p className="text-xs text-espresso-600 leading-relaxed">
            Har du frågor om villkoren når du oss på{' '}
            <a href="mailto:info@guldbud.com" className="underline hover:text-espresso-800">
              info@guldbud.com
            </a>
            .
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
