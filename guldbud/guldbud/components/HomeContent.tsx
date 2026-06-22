'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import Image from 'next/image'
import AuctionCard from '@/components/AuctionCard'
import { Item } from '@/lib/types'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Väntar på granskning', color: 'bg-amber-100 text-amber-700' },
  active: { label: 'Auktion pågår', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Avslutad', color: 'bg-stone-100 text-stone-500' },
  rejected: { label: 'Avvisad', color: 'bg-red-100 text-red-600' },
}

export default function HomeContent({ items }: { items: Item[] }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myItems, setMyItems] = useState<any[]>([])
  const [checked, setChecked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
        setProfile(p)
        if (p?.role === 'customer') {
          const { data: mi } = await supabase.from('items').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(3)
          setMyItems(mi || [])
        }
      }
      setChecked(true)
    }
    load()
  }, [])

  if (!checked) return null

  // UTLOGGAD
  if (!user) {
    return (
      <>
        <div className="bg-[#1a1208] text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#8B6914] text-sm tracking-widest uppercase mb-3">Sveriges guldauktion</p>
            <h1 className="text-4xl font-medium mb-4 text-[#D4AF37]">Sälj ditt guld till rätt pris</h1>
            <p className="text-[#c9a84c] text-lg mb-8">
              Lägg ut ditt guldföremål – auktoriserade handlare budar direkt mot varandra.
              Du får det bästa priset, enkelt och tryggt.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/auth/login" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white font-medium rounded-lg px-6 py-3 transition">
                Lägg ut ett föremål
              </Link>
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
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-medium text-lg flex items-center justify-center mx-auto mb-3">{s.step}</div>
                <h3 className="font-medium text-stone-900 mb-1">{s.title}</h3>
                <p className="text-stone-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-medium text-stone-800 mb-6">Pågående auktioner</h2>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(item => <AuctionCard key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-stone-400 border border-dashed border-stone-200 rounded-xl">
              <p className="text-lg mb-2">Inga aktiva auktioner just nu</p>
              <p className="text-sm">Var den första att lägga ut ett föremål!</p>
            </div>
          )}
        </div>
      </>
    )
  }

  // INLOGGAD KUND
  if (profile?.role === 'customer') {
    return (
      <>
        <div className="bg-[#1a1208] px-4 py-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-[#8B6914] text-xs tracking-widest uppercase mb-1">Välkommen tillbaka</p>
              <h1 className="text-2xl text-[#D4AF37] font-medium">{profile.full_name}</h1>
            </div>
            <Link href="/customer/submit" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
              + Lägg ut föremål
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-stone-800">Mina föremål</h2>
              <Link href="/customer/my-items" className="text-sm text-[#B8860B] hover:text-[#D4AF37] transition">Se alla →</Link>
            </div>
            {myItems.length === 0 ? (
              <div className="bg-white border border-dashed border-stone-200 rounded-xl p-8 text-center">
                <p className="text-stone-400 mb-3">Du har inte lagt ut några föremål ännu.</p>
                <Link href="/customer/submit" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white text-sm font-medium px-5 py-2 rounded-lg transition inline-block">
                  Lägg ut ditt första föremål
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myItems.map(item => {
                  const s = STATUS_LABEL[item.status] || { label: item.status, color: 'bg-stone-100 text-stone-500' }
                  return (
                    <div key={item.id} className="bg-white border border-stone-200 rounded-xl flex gap-4 p-4">
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden relative bg-stone-100">
                        {item.image_urls?.[0] && <Image src={item.image_urls[0]} alt={item.title} fill className="object-cover" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-stone-900">{item.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                        </div>
                        <p className="text-xs text-stone-400">{item.weight_grams} g · {item.karat}</p>
                        {item.min_price && <p className="text-xs text-stone-500 mt-0.5">Minimipris: {item.min_price.toLocaleString('sv-SE')} kr</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium text-stone-800 mb-4">Pågående auktioner</h2>
            {items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map(item => <AuctionCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="text-center py-12 text-stone-400 border border-dashed border-stone-200 rounded-xl">
                <p>Inga aktiva auktioner just nu</p>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // INLOGGAD HANDLARE
  if (profile?.role === 'dealer') {
    return (
      <>
        <div className="bg-[#1a1208] px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#8B6914] text-xs tracking-widest uppercase mb-1">Välkommen tillbaka</p>
            <h1 className="text-2xl text-[#D4AF37] font-medium">{profile.full_name}</h1>
            <p className="text-[#8B6914] text-sm mt-1">{items.length} aktiva auktioner att buda på</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="text-lg font-medium text-stone-800 mb-4">Aktiva auktioner</h2>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(item => <AuctionCard key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 border border-dashed border-stone-200 rounded-xl">
              <p>Inga aktiva auktioner just nu</p>
            </div>
          )}
        </div>
      </>
    )
  }

  // ADMIN
  return (
    <>
      <div className="bg-[#1a1208] px-4 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#8B6914] text-xs tracking-widest uppercase mb-1">Administratör</p>
            <h1 className="text-2xl text-[#D4AF37] font-medium">{profile?.full_name}</h1>
          </div>
          <Link href="/admin" className="bg-[#B8860B] hover:bg-[#D4AF37] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
            Öppna adminpanel
          </Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-medium text-stone-800 mb-4">Pågående auktioner</h2>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => <AuctionCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-stone-400 border border-dashed border-stone-200 rounded-xl">
            <p>Inga aktiva auktioner just nu</p>
          </div>
        )}
      </div>
    </>
  )
}
