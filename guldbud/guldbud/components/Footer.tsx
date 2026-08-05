import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative mt-24 bg-espresso-900 text-espresso-100/70 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-gold-500/5 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <span
              className="text-gold-300 leading-none"
              style={{ fontFamily: "'Great Vibes', cursive", fontSize: '30px' }}
            >
              GuldBud
            </span>
            <p className="text-sm mt-3 max-w-xs leading-relaxed text-espresso-100/60">
              Sveriges guldauktion. Auktoriserade handlare budar mot varandra — du får
              marknadens bästa pris, tryggt och kostnadsfritt.
            </p>
            <div className="flex gap-3 mt-5">
              <TrustBadge>BankID-verifierad</TrustBadge>
              <TrustBadge>Försäkrad frakt</TrustBadge>
            </div>
          </div>

          <FooterCol title="Sälja guld">
            <FooterLink href="/customer/submit">Lägg ut föremål</FooterLink>
            <FooterLink href="/how-it-works">Så fungerar det</FooterLink>
            <FooterLink href="/#estimator">Värderingskalkylator</FooterLink>
            <FooterLink href="/#auctions">Pågående auktioner</FooterLink>
          </FooterCol>

          <FooterCol title="För handlare">
            <FooterLink href="/auth/login?role=dealer">Bli guldhandlare</FooterLink>
            <FooterLink href="/dealer/dashboard">Handlarpanel</FooterLink>
            <FooterLink href="/how-it-works">Budgivning</FooterLink>
          </FooterCol>

          <FooterCol title="Kontakt">
            <li className="text-sm">GuldBud AB</li>
            <li className="text-sm">Storgatan 1, 111 22 Stockholm</li>
            <li className="text-sm">
              <a href="mailto:info@guldbud.se" className="hover:text-gold-300 transition">
                info@guldbud.se
              </a>
            </li>
          </FooterCol>
        </div>

        <div className="divider-gold my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-espresso-100/45">
          <p>© {new Date().getFullYear()} GuldBud AB. Alla rättigheter förbehållna.</p>
          <div className="flex gap-5">
            <Link href="/how-it-works" className="hover:text-gold-300 transition">
              Villkor
            </Link>
            <Link href="/how-it-works" className="hover:text-gold-300 transition">
              Integritetspolicy
            </Link>
            <Link href="/how-it-works" className="hover:text-gold-300 transition">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-gold-300 text-sm font-semibold mb-4 font-sans tracking-wide">{title}</h4>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm hover:text-gold-300 transition">
        {children}
      </Link>
    </li>
  )
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gold-200/80 border border-gold-500/20 rounded-full px-2.5 py-1">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l7 3v6c0 4.5-3 8.3-7 9.5C8 19.3 5 15.5 5 11V5l7-3z" stroke="#e8c766" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="#e8c766" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  )
}
