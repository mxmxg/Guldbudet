import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

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
    'Lägg ut ditt guld och låt auktoriserade guldhandlare buda mot varandra i realtid. Du får marknadens bästa pris, enkelt, tryggt och kostnadsfritt.',
  keywords: ['sälja guld', 'guldauktion', 'guldpris', 'guldhandlare', 'sälja smycken'],
  openGraph: {
    title: 'GuldBud · Sveriges guldauktion',
    description:
      'Låt auktoriserade guldhandlare buda mot varandra om ditt guld. Bästa priset, tryggt och gratis.',
    type: 'website',
    locale: 'sv_SE',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-cream text-espresso-900 antialiased selection:bg-gold-200 selection:text-espresso-900">
        {children}
      </body>
    </html>
  )
}
