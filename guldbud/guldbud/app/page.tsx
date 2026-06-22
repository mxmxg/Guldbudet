import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Item } from '@/lib/types'
import Navbar from '@/components/Navbar'
import AuctionCard from '@/components/AuctionCard'

export default async function HomePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: items } = await supabase
    .from('items')
    .select('*, profiles(full_name)')
    .eq('status', 'active')
    .order('auction_ends_at', { ascending: true })

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-gold-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-100 text-sm tracking-widest uppercase mb-3">Sveriges guldauktion</p>
          <h1 className="text-4xl font-medium mb-4 text-gold-100">
            Sälj ditt guld till rätt pris
          </h1>
          <p className="text-gold-200 text-lg mb-8">
            Lägg ut ditt guldföremål – auktoriserade handlare budar direkt mot varandra.
            Du får det bästa priset, enkelt och tryggt.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/customer/submit" className="bg-gold-400 hover:bg-gold-500 text-white font-medium rounded-lg px-6 py-3 transition">
              Lägg ut ett föremål
            </Link>
            {!user && (
              <Link href="/auth/login?role=dealer" className="border border-gold-400 text-gold-100 hover:bg-gold-800 font-medium rounded-lg px-6 py-3 transition">
                Logga in som handlare
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white border-b border-stone-200 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { step: '1', title: 'Fotografera', desc: 'Ta bilder på föremålet och fyll i vikt och karat.' },
            { step: '2', title: 'Handlare budar', desc: 'Anslutna guldhandlare ser ditt föremål och budar mot varandra.' },
            { step: '3', title: 'Du väljer', desc: 'Du accepterar det bud du vill ha och kontaktas av handlaren.' },
          ].map(s => (
            <div key={s.step}>
              <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-700 font-medium text-lg flex items-center justify-center mx-auto mb-3">{s.step}</div>
              <h3 className="font-medium text-stone-900 mb-1">{s.title}</h3>
              <p className="text-stone-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-medium text-stone-800 mb-6">Pågående auktioner</h2>
        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => (
              <AuctionCard key={item.id} item={item as Item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-stone-400 border border-dashed border-stone-200 rounded-xl">
            <p className="text-lg mb-2">Inga aktiva auktioner just nu</p>
            <p className="text-sm">Var den första att lägga ut ett föremål!</p>
          </div>
        )}
      </div>
    </div>
  )
}
