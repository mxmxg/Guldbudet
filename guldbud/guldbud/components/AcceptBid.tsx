'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function AcceptBid({ itemId, bidId, amount, dealerName, isOwner }: {
  itemId: string
  bidId: string
  amount: number
  dealerName: string
  isOwner: boolean
}) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isOwner) return null

  const accept = async () => {
    setLoading(true)
    await supabase.from('items').update({
      accepted_bid_id: bidId,
      accepted_at: new Date().toISOString(),
      status: 'closed'
    }).eq('id', itemId)
    setLoading(false)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">✓</div>
          <div>
            <p className="font-medium text-green-800">Bud accepterat!</p>
            <p className="text-sm text-green-600">{amount.toLocaleString('sv-SE')} kr från {dealerName}</p>
          </div>
        </div>
        <div className="bg-white border border-green-100 rounded-lg p-4 mb-4">
          <p className="font-medium text-stone-800 mb-3">Nästa steg — skicka föremålet till oss</p>
          <div className="flex flex-col gap-2 text-sm text-stone-600">
            <div className="flex gap-2">
              <span className="text-green-500 font-bold">1.</span>
              <span>Packa föremålet omsorgsfullt i en liten ask eller bubbla.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-500 font-bold">2.</span>
              <span>Skicka som rekommenderat och försäkrat brev till vår adress.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-500 font-bold">3.</span>
              <span>Vi verifierar äktheten inom 24 timmar efter mottagning.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-500 font-bold">4.</span>
              <span>Du får betalning via Swish samma dag som vi verifierat.</span>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1208] rounded-lg p-4 text-center">
          <p className="text-[#8B6914] text-xs tracking-widest uppercase mb-1">Skicka till</p>
          <p className="text-[#D4AF37] font-medium">GuldBud AB</p>
          <p className="text-[#c9a84c] text-sm">Storgatan 1</p>
          <p className="text-[#c9a84c] text-sm">111 22 Stockholm</p>
          <p className="text-[#8B6914] text-xs mt-2">Vid frågor: info@guldbud.com</p>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-6">
        <p className="font-medium text-stone-800 mb-1">Bekräfta att du accepterar</p>
        <p className="text-sm text-stone-500 mb-4">
          Du accepterar budet på <span className="font-medium text-stone-800">{amount.toLocaleString('sv-SE')} kr</span> från <span className="font-medium text-stone-800">{dealerName}</span>. 
          Auktionen stängs och du instrueras om hur du skickar föremålet till oss.
        </p>
        <div className="flex gap-3">
          <button
            onClick={accept}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg transition text-sm"
          >
            {loading ? 'Bekräftar...' : 'Ja, acceptera budet'}
          </button>
          <button
            onClick={() => setStep('idle')}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-5 py-2 rounded-lg transition text-sm"
          >
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setStep('confirm')}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition mt-4 text-sm"
    >
      Acceptera detta bud — {amount.toLocaleString('sv-SE')} kr
    </button>
  )
}
