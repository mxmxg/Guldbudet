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
          <p className="font-medium text-espresso-800 mb-2">Vad händer nu?</p>
          <p className="text-sm text-espresso-600 leading-relaxed">
            Vi slutför affären med handlaren. Så fort det är klart hör vi av oss med instruktioner om hur du
            skickar in föremålet, oftast redan samma dag. Du behöver inte skicka något än. När vi tagit emot
            och verifierat föremålet betalas du ut, normalt inom 1–2 bankdagar.
          </p>
        </div>
        {orderId && (
          <Link href={`/orders/${orderId}`} className="btn-gold w-full mt-1 justify-center">
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
