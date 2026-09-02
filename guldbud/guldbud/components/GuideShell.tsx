import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import { relatedGuides } from '@/lib/guides'

// Shared layout for the /guider SEO content pages: dark hero + readable prose
// body + a conversion CTA, matching the rest of the site.
//
// `slug` är sidans egen sökväg, till exempel '/guider/salja-guld'. Den används
// för att välja tre andra guider att läsa vidare. Utelämnas den visas ingen
// sådan ruta, så en ny guide går sönder synligt i stället för att tyst hamna
// utanför korslänkningen.
export default function GuideShell({
  eyebrow = 'Guide',
  title,
  intro,
  updated,
  children,
  faq,
  slug,
  answer,
}: {
  eyebrow?: string
  title: string
  intro: string
  updated?: string
  children: React.ReactNode
  faq?: { q: string; a: string }[]
  slug?: string
  answer?: React.ReactNode
}) {
  const related = slug ? relatedGuides(slug) : []
  const faqLd = faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null

  const SITE = 'https://guldbud.com'
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hem', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Guider', item: `${SITE}/guider` },
      { '@type': 'ListItem', position: 3, name: title },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {faqLd && <JsonLd data={faqLd} />}
      <JsonLd data={breadcrumbLd} />
      <Navbar />

      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-3xl mx-auto px-4 py-16">
          <p className="eyebrow text-gold-500/80 mb-2">{eyebrow}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-gold-100 leading-tight">{title}</h1>
          <p className="mt-4 text-gold-200/75 leading-relaxed max-w-2xl">{intro}</p>
          {updated && <p className="mt-3 text-xs text-gold-500/50">Uppdaterad {updated}</p>}
        </div>
      </div>

      <article className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        {/* Kort svar högst upp, före brödtexten.
            Skälet är läsaren: den som söker "var säljer man guld bäst" vill ha
            svaret, inte tre rubriker att scrolla förbi först. Håll det till två
            eller tre meningar, och låt det vara ett riktigt svar, inte en
            inledning till ett svar. */}
        {answer && (
          <div className="mb-10 rounded-2xl border border-gold-200 bg-gold-50/60 px-5 py-4 sm:px-6 sm:py-5">
            <p className="eyebrow text-gold-700/80 mb-1.5">Kort svar</p>
            <div className="text-espresso-800 leading-relaxed">{answer}</div>
          </div>
        )}

        {children}

        {faq && faq.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl text-espresso-900 mb-4">Vanliga frågor</h2>
            <div className="space-y-4">
              {faq.map((f) => (
                <div key={f.q} className="card p-5">
                  <p className="font-medium text-espresso-900 mb-1">{f.q}</p>
                  <p className="text-espresso-600 leading-relaxed text-sm">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Läs vidare. Ligger före CTA:n med flit: den som inte är redo att
            sälja ska hitta nästa guide i stället för att lämna sajten. */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl text-espresso-900 mb-4">Läs vidare</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((g) => (
                <Link key={g.href} href={g.href} className="card card-hover p-5 group">
                  <p className="font-display text-base text-espresso-900 group-hover:text-gold-700 transition leading-snug">
                    {g.title}
                  </p>
                  <p className="text-xs text-espresso-500 mt-1.5 leading-relaxed">{g.desc}</p>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm">
              <Link href="/guider" className="text-gold-700 underline underline-offset-2 hover:text-gold-800">
                Alla guider om att sälja guld
              </Link>
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 rounded-3xl bg-espresso-900 p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
          <div className="relative">
            <h2 className="font-display text-2xl text-gold-100">Redo att sälja ditt guld?</h2>
            <p className="mt-2 text-espresso-100/70 max-w-md mx-auto">
              Lägg ut på under fem minuter och låt auktoriserade handlare tävla om att ge dig bäst pris. Gratis och
              utan förpliktelser.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link href="/customer/submit" className="btn-gold">Lägg ut ditt guld</Link>
              <Link href="/#estimator" className="btn-ghost-gold text-gold-200">Vad är det värt?</Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}

// Prose building blocks so the articles stay clean and consistent.
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl text-espresso-900 mt-10 mb-3 scroll-mt-28">{children}</h2>
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-espresso-600 leading-relaxed mb-4">{children}</p>
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 text-espresso-600 leading-relaxed space-y-1.5 mb-4">{children}</ul>
}
export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gold-700 underline underline-offset-2 hover:text-gold-800">
      {children}
    </Link>
  )
}
