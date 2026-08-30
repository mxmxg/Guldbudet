'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { TERMS_VERSION } from '@/lib/terms'

// Säljaren tackar nej till högsta budet efter avslutad auktion. Föremålet stängs
// utan accepterat bud (sålt = stängt MED accepterat bud, avböjt = stängt UTAN),
// så ingen affär skapas. RLS tillåter ägaren att sätta status 'closed'. Säljaren
// kan sedan lägga ut föremålet igen (skapar en ny annons för granskning).
export default function DeclineBid({ item, isOwner }: { item: any; isOwner: boolean }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [loading, setLoading] = useState(false)
  const [relisting, setRelisting] = useState(false)
  const [relisted, setRelisted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  if (!isOwner) return null

  const decline = async () => {
    setLoading(true)
    setError('')
    const { data: updated, error: updErr } = await supabase
      .from('items')
      .update({ status: 'closed' })
      .eq('id', item.id)
      .is('accepted_bid_id', null) // säkerställ att vi aldrig stänger ett redan accepterat föremål
      .select('id')
    if (updErr || !updated || updated.length === 0) {
      setError(
        'Kunde inte tacka nej just nu' + (updErr ? ': ' + updErr.message : '') + '. Försök igen, eller kontakta info@guldbud.com.'
      )
      setLoading(false)
      return
    }
    setLoading(false)
    setStep('done')
  }

  const relist = async () => {
    setRelisting(true)
    setError('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setError('Du behöver vara inloggad.')
      setRelisting(false)
      return
    }
    // Föremål som lades ut innan ursprungsvalet fanns saknar source_type.
    // Databasspärren kräver det vid publicering, så vi fångar det här och
    // skickar säljaren till formuläret i stället för att visa ett SQL-fel.
    if (!item.source_type) {
      setError(
        'Det här föremålet lades ut innan vi började fråga om ursprung. Lägg ut det via formuläret så fyller du i de uppgifter som behövs.'
      )
      setRelisting(false)
      return
    }
    const { error: insErr } = await supabase.from('items').insert({
      owner_id: user.id,
      title: item.title,
      category: item.category,
      description: item.description,
      karat: item.karat,
      weight_grams: item.weight_grams,
      diamond_carat: item.diamond_carat,
      gemstone: item.gemstone,
      min_price: item.min_price,
      image_urls: item.image_urls,
      // Ursprunget följer med föremålet, det ändras inte av att annonsen görs om.
      source_type: item.source_type,
      source_note: item.source_note,
      // Att lägga ut igen är en ny publicering, alltså ett nytt ägarintyg och ett
      // nytt förmedlingsuppdrag under den lydelse som gäller idag. Utan de här
      // fälten skulle uppdragskvittot sakna version och adminpanelen visa att
      // ägarintyget saknas.
      ownership_attested_at: new Date().toISOString(),
      mandate_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
      status: 'pending',
    })
    setRelisting(false)
    if (insErr) {
      setError('Kunde inte lägga ut igen: ' + insErr.message)
      return
    }
    setRelisted(true)
  }

  if (step === 'done') {
    return (
      <div className="rounded-2xl bg-espresso-50 border border-espresso-200 p-5 mt-3">
        <p className="font-medium text-espresso-800 mb-1">Du tackade nej till budet</p>
        <p className="text-sm text-espresso-500 mb-4">
          Föremålet såldes inte. Du kan lägga ut det igen när du vill, så får handlarna buda på nytt.
        </p>
        {relisted ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
            Föremålet är utlagt igen och väntar på granskning. Du hittar det under Mina föremål.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={relist}
              disabled={relisting}
              className="bg-gold-500 hover:bg-gold-600 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
            >
              {relisting ? 'Lägger ut...' : 'Lägg ut igen'}
            </button>
            <Link
              href="/customer/my-items"
              className="bg-espresso-100 hover:bg-espresso-200 text-espresso-700 font-medium px-5 py-2.5 rounded-xl transition text-sm"
            >
              Till Mina föremål
            </Link>
          </div>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 mt-3">
        <p className="font-medium text-espresso-800 mb-1">Tacka nej till budet?</p>
        <p className="text-sm text-espresso-500 mb-4">
          Föremålet säljs inte och budgivningen stängs. Du kan lägga ut det igen efteråt om du ändrar dig.
        </p>
        <div className="flex gap-3">
          <button
            onClick={decline}
            disabled={loading}
            className="bg-espresso-800 hover:bg-espresso-900 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
          >
            {loading ? 'Bekräftar...' : 'Ja, tacka nej'}
          </button>
          <button
            onClick={() => setStep('idle')}
            className="bg-espresso-100 hover:bg-espresso-200 text-espresso-700 font-medium px-5 py-2.5 rounded-xl transition text-sm"
          >
            Avbryt
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setStep('confirm')}
      className="w-full border border-espresso-200 text-espresso-600 hover:bg-espresso-50 font-medium py-2.5 rounded-xl transition mt-2 text-sm"
    >
      Tacka nej till budet
    </button>
  )
}
