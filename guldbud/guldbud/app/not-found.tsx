import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { GemIcon } from '@/components/Icons'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gold-50 text-gold-500 flex items-center justify-center mx-auto mb-6 animate-float">
            <GemIcon size={30} strokeWidth={1.2} />
          </div>
          <p className="font-display text-6xl text-espresso-900 mb-2">404</p>
          <h1 className="font-display text-2xl text-espresso-800 mb-3">Sidan hittades inte</h1>
          <p className="text-espresso-500 text-sm mb-8">
            Sidan du letar efter finns inte eller har flyttats. Kanske har en auktion redan avslutats.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/" className="btn-gold">Till startsidan</Link>
            <Link href="/auctions" className="btn-ghost-gold">Se auktioner</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
