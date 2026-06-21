import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'GuldBud – Auktioner för guldföremål',
  description: 'Lägg ut ditt guld och låt auktoriserade guldhandlare buda direkt.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.variable} font-sans bg-stone-50 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
