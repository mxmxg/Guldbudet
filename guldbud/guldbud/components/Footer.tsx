import Link from 'next/link'
import Logo from '@/components/Logo'
import { TrustpilotFooterLink } from '@/components/TrustpilotInvite'

export default function Footer() {
  return (
    <footer className="relative bg-espresso-900 text-espresso-100/70 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-gold-500/5 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo className="text-gold-300 text-[24px] leading-none" />
            <p className="text-sm mt-3 max-w-xs leading-relaxed text-espresso-100/60">
              Vi får guldköparna att konkurrera om ditt guld. Auktoriserade handlare budar mot
              varandra i realtid, och du säljer till bäst betalt, tryggt och kostnadsfritt.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gold-200/80 border border-gold-500/20 rounded-full px-2.5 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/bankid-white.png" alt="BankID" className="h-3.5 w-auto opacity-90" />
                verifierad
              </span>
              <TrustBadge>Försäkrad frakt</TrustBadge>
            </div>
          </div>

          <FooterCol title="Sälja guld">
            <FooterLink href="/customer/submit">Lägg ut föremål</FooterLink>
            <FooterLink href="/how-it-works">Så fungerar det</FooterLink>
            <FooterLink href="/#estimator">Värderingskalkylator</FooterLink>
            <FooterLink href="/auctions">Pågående auktioner</FooterLink>
            <FooterLink href="/resultat">Sålda resultat</FooterLink>
            <FooterLink href="/guider">Guider</FooterLink>
          </FooterCol>

          <FooterCol title="För handlare">
            <FooterLink href="/auth/login?role=dealer">Bli guldhandlare</FooterLink>
            <FooterLink href="/dealer/dashboard">Handlarpanel</FooterLink>
            <FooterLink href="/dealer/guide">Budgivning</FooterLink>
            <FooterLink href="/handlarvillkor">Handlarvillkor</FooterLink>
          </FooterCol>

          <FooterCol title="Kontakt">
            <li className="text-sm">GuldBud AB</li>
            <li className="text-sm">Org.nr 559291-4781</li>
            <li className="text-sm">Box 6007</li>
            <li className="text-sm">102 31 Stockholm</li>
            <li className="text-sm">
              <a href="mailto:info@guldbud.com" className="hover:text-gold-300 transition">
                info@guldbud.com
              </a>
            </li>
            <li className="pt-1">
              <TrustpilotFooterLink />
            </li>
          </FooterCol>
        </div>

        <div className="divider-gold my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-espresso-100/45">
          <p>© {new Date().getFullYear()} GuldBud AB. Alla rättigheter förbehållna.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gold-300 transition inline-block py-2 px-1">
              Villkor
            </Link>
            <Link href="/privacy" className="hover:text-gold-300 transition inline-block py-2 px-1">
              Integritetspolicy
            </Link>
            <Link href="/privacy" className="hover:text-gold-300 transition inline-block py-2 px-1">
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
      <h3 className="text-gold-300 text-sm font-semibold mb-4 font-sans tracking-wide">{title}</h3>
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
