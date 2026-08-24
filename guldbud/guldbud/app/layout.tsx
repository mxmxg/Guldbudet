import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://guldbud.com'),
  title: {
    default: 'GuldBud · Sveriges guldauktion',
    template: '%s · GuldBud',
  },
  description:
    'Låt guldköparna tävla om ditt guld. Lägg ut föremålet så budar Sveriges auktoriserade guldhandlare mot varandra i realtid, och du säljer till bäst betalt. Enkelt, tryggt och kostnadsfritt.',
  keywords: [
    'sälja guld',
    'bäst betalt för guld',
    'vad är mitt guld värt',
    'guldpris idag',
    'sälja guld online',
    'guldauktion',
    'sälja guldsmycken',
    'guldhandlare',
    'värdera guld',
  ],
  // Ingen canonical här: en canonical i rot-layouten ärvs av varje sida som inte
  // sätter en egen (t.ex. klient-sidor som /verifiering), vilket felaktigt pekar
  // dem mot startsidan. Startsidan sätter sin egen canonical i app/page.tsx.
  openGraph: {
    title: 'GuldBud · Låt guldköparna tävla om ditt guld',
    description:
      'Låt guldköparna tävla om ditt guld. Auktoriserade guldhandlare budar mot varandra i realtid, och du säljer till bäst betalt. Tryggt och gratis.',
    type: 'website',
    locale: 'sv_SE',
    siteName: 'GuldBud',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuldBud · Låt guldköparna tävla om ditt guld',
    description:
      'Låt guldköparna tävla om ditt guld. Auktoriserade guldhandlare budar mot varandra i realtid, och du säljer till bäst betalt. Tryggt och gratis.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-cream text-espresso-900 antialiased selection:bg-gold-200 selection:text-espresso-900">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
