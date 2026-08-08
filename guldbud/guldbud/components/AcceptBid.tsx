'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Confetti from '@/components/Confetti'
import { CheckIcon } from '@/components/Icons'

export default function AcceptBid({ itemId, bidId, amount, dealerName, isOwner }: {
  itemId: string
  bidId: string
  amount: number
  dealerName: string
  isOwner: boolean
}) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(0)
  const supabase = createClient()

  if (!isOwner) return null

  const accept = async () => {
    setLoading(true)
    setError('')
    // Only advance to the success state if the write actually succeeds –
    // otherwise the seller would be told to ship an item for a deal that
    // was never created (the order is created by a DB trigger on this update).
    const { error: updateError } = await supabase
      .from('items')
      .update({ accepted_bid_id: bidId, accepted_at: new Date().toISOString(), status: 'closed' })
      .eq('id', itemId)
    if (updateError) {
      setError('Kunde inte acceptera budet: ' + updateError.message + ' Försök igen.')
      setLoading(false)
      return
    }
    // The order is created by a DB trigger; fetch its id so we can link to it.
    const { data: order } = await supabase.from('orders').select('id').eq('item_id', itemId).single()
    setOrderId(order?.id ?? null)
    setLoading(false)
    setConfetti((c) => c + 1)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 mt-6">
        <Confetti fire={confetti} />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <CheckIcon size={18} strokeWidth={3} />
          </div>
          <div>
            <p className="font-medium text-emerald-800">Bud accepterat!</p>
            <p className="text-sm text-emerald-700">{amount.toLocaleString('sv-SE')} kr från {dealerName}</p>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-espresso-100 p-4 mb-4">
          <p className="font-medium text-espresso-800 mb-3">Nästa steg: skicka föremålet till oss</p>
          <ol className="flex flex-col gap-2 text-sm text-espresso-600">
            {[
              'Packa föremålet omsorgsfullt i en liten ask eller bubbelpåse.',
              'Skicka som rekommenderat och försäkrat brev till vår adress.',
              'Vi verifierar äktheten så snart vi mottagit föremålet.',
              'När allt är klart betalas du ut, normalt inom 1–2 bankdagar.',
            ].map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gold-600 font-semibold">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl bg-espresso-900 p-4 text-center">
          <p className="text-gold-500/70 text-xs tracking-widest uppercase mb-1">Skicka till</p>
          <p className="text-gold-200 font-medium">GuldBud AB</p>
          <p className="text-gold-200/80 text-sm">Storgatan 1, 111 22 Stockholm</p>
          <p className="text-gold-500/70 text-xs mt-2">Vid frågor: info@guldbud.com</p>
        </div>
        {orderId && (
          <Link href={`/orders/${orderId}`} className="btn-gold w-full mt-4 justify-center">
            Följ affären och kontakta oss →
          </Link>
        )}
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 mt-6">
        <p className="font-medium text-espresso-800 mb-1">Bekräfta att du accepterar</p>
        <p className="text-sm text-espresso-500 mb-4">
          Du accepterar budet på <span className="font-medium text-espresso-800">{amount.toLocaleString('sv-SE')} kr</span> från{' '}
          <span className="font-medium text-espresso-800">{dealerName}</span>. Auktionen stängs och du instrueras
          om hur du skickar föremålet till oss.
        </p>
        <div className="flex gap-3">
          <button
            onClick={accept}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm"
          >
            {loading ? 'Bekräftar...' : 'Ja, acceptera budet'}
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
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition mt-4 text-sm"
    >
      Acceptera budet på {amount.toLocaleString('sv-SE')} kr
    </button>
  )
}
