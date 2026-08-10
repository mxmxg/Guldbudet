'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import Confetti from '@/components/Confetti'
import { DEALER_COMMISSION_LABEL, DEALER_SHIPPING_FEE, commission, dealerTotal } from '@/lib/fees'

const INCREMENTS = [100, 250, 500, 1000]

export default function BidSection({
  itemId,
  currentTop,
  endsAt,
  onPlaced,
}: {
  itemId: string
  currentTop: number
  endsAt?: string | null
  onPlaced?: () => void | Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [confetti, setConfetti] = useState(0)
  const [role, setRole] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [checked, setChecked] = useState(false)
  const [maxBid, setMaxBid] = useState('')
  const [myAutoMax, setMyAutoMax] = useState<number | null>(null)
  const [autoMsg, setAutoMsg] = useState('')
  const [autoLoading, setAutoLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, approved, suspended')
          .eq('id', data.user.id)
          .single()
        setRole(prof?.role ?? null)
        setApproved(prof?.approved ?? false)
        setSuspended(prof?.suspended ?? false)
        const { data: ab } = await supabase
          .from('auto_bids')
          .select('max_amount')
          .eq('item_id', itemId)
          .eq('dealer_id', data.user.id)
          .maybeSingle()
        setMyAutoMax(ab?.max_amount ?? null)
      }
      setChecked(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveAutoBid = async () => {
    const val = parseInt(maxBid)
    setAutoMsg('')
    if (!val || val <= currentTop) {
      setAutoMsg(`Maxbudet måste vara högre än ${currentTop.toLocaleString('sv-SE')} kr`)
      return
    }
    setAutoLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('auto_bids')
      .upsert({ item_id: itemId, dealer_id: user?.id, max_amount: val }, { onConflict: 'item_id,dealer_id' })
    if (error) {
      setAutoMsg(/row-level security|policy|violates/i.test(error.message) ? 'Just nu går det inte att sätta maxbud här.' : error.message)
    } else {
      setMyAutoMax(val)
      setMaxBid('')
      setAutoMsg('✓ Maxbud satt – vi budar åt dig upp till ' + val.toLocaleString('sv-SE') + ' kr.')
      if (onPlaced) await onPlaced()
      router.refresh()
    }
    setAutoLoading(false)
  }

  const removeAutoBid = async () => {
    setAutoLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('auto_bids').delete().eq('item_id', itemId).eq('dealer_id', user?.id)
    setMyAutoMax(null)
    setAutoMsg('')
    setAutoLoading(false)
  }

  const minNext = currentTop + 100
  const quickSet = (inc: number) => setAmount(String(Math.max(minNext, (currentTop || 0) + inc)))

  const place = async () => {
    const val = parseInt(amount)
    setOk(false)
    if (endsAt && new Date(endsAt).getTime() < Date.now()) {
      setMsg('Auktionen är avslutad – det går inte längre att buda.')
      return
    }
    if (!val || val <= currentTop) {
      setMsg(`Budet måste vara högre än ${currentTop.toLocaleString('sv-SE')} kr`)
      return
    }
    setLoading(true)
    setMsg('')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('bids').insert({ item_id: itemId, dealer_id: user?.id, amount: val })
    if (error) {
      // Råa RLS-/policyfel ska aldrig visas för användaren.
      setMsg(
        /row-level security|policy|violates/i.test(error.message)
          ? 'Just nu går det inte att lägga bud på det här föremålet.'
          : error.message
      )
      setOk(false)
    } else {
      setMsg('🎉 Ditt bud är lagt – du leder nu!')
      setOk(true)
      setAmount('')
      setConfetti((c) => c + 1)
      if (onPlaced) await onPlaced()
      router.refresh()
    }
    setLoading(false)
  }

  if (!checked) return <div className="h-24 rounded-2xl skeleton" />

  if (!role) {
    return (
      <div className="rounded-2xl bg-white border border-espresso-100 p-5 text-center shadow-soft">
        <p className="text-espresso-500 text-sm mb-3">Logga in för att lägga bud</p>
        <Link href="/auth/login" className="btn-gold">
          Logga in
        </Link>
      </div>
    )
  }

  if (role === 'customer' || role === 'admin') {
    return (
      <div className="rounded-2xl bg-espresso-50 border border-espresso-100 p-4">
        <p className="text-espresso-500 text-sm">Endast auktoriserade guldhandlare kan lägga bud.</p>
      </div>
    )
  }

  if (!approved) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-amber-700 text-sm font-medium">Ditt handlarkonto väntar på godkännande.</p>
        <p className="text-amber-600 text-xs mt-1">Du får ett mejl när du är godkänd och kan börja buda.</p>
      </div>
    )
  }

  if (suspended) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
        <p className="text-red-700 text-sm font-medium">Ditt konto är pausat</p>
        <p className="text-red-600 text-xs mt-1">Du kan inte lägga bud just nu. Kontakta oss så reder vi ut det.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-espresso-100 p-5 shadow-soft">
      <Confetti fire={confetti} />
      <p className="text-sm font-medium text-espresso-800 mb-3">Lägg ditt bud</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {INCREMENTS.map((inc) => (
          <button
            key={inc}
            type="button"
            onClick={() => quickSet(inc)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-espresso-200 text-espresso-600 hover:border-gold-400 hover:text-gold-700 hover:bg-gold-50 transition"
          >
            +{inc.toLocaleString('sv-SE')}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Minst ${minNext.toLocaleString('sv-SE')}`}
            className="w-full !pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-300 text-sm">kr</span>
        </div>
        <button onClick={place} disabled={loading} className="btn-gold whitespace-nowrap">
          {loading ? '...' : 'Lägg bud'}
        </button>
      </div>

      {/* Buyer's premium — always visible, live total when a bid is entered */}
      <div className="mt-3 rounded-xl bg-espresso-50 border border-espresso-100 px-3 py-2 text-xs text-espresso-500">
        {parseInt(amount) > 0 ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span>Ditt bud</span>
              <span className="tabular-nums">{parseInt(amount).toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="flex justify-between">
              <span>Provision {DEALER_COMMISSION_LABEL}</span>
              <span className="tabular-nums">+{commission(parseInt(amount)).toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="flex justify-between">
              <span>Frakt</span>
              <span className="tabular-nums">+{DEALER_SHIPPING_FEE.toLocaleString('sv-SE')} kr</span>
            </div>
            <div className="flex justify-between font-semibold text-espresso-800 pt-1 mt-1 border-t border-espresso-100">
              <span>Ditt totalpris</span>
              <span className="tabular-nums">{dealerTotal(parseInt(amount)).toLocaleString('sv-SE')} kr</span>
            </div>
          </div>
        ) : (
          <span>Provision {DEALER_COMMISSION_LABEL} + frakt {DEALER_SHIPPING_FEE} kr tillkommer på ditt bud. Säljaren får hela budbeloppet.</span>
        )}
      </div>

      {msg && (
        <p className={`text-sm mt-2 flex items-center gap-1.5 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
          {ok && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {msg}
        </p>
      )}

      {/* Auto-bud (maxbud) */}
      <div className="mt-4 pt-4 border-t border-espresso-100">
        {myAutoMax ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-gold-50 border border-gold-200 px-3 py-2">
            <p className="text-sm text-gold-800">
              <span className="font-medium">Autobud aktivt</span> · vi budar åt dig upp till{' '}
              <span className="tabular-nums font-medium">{myAutoMax.toLocaleString('sv-SE')} kr</span>
            </p>
            <button onClick={removeAutoBid} disabled={autoLoading} className="text-xs text-espresso-400 hover:text-red-500 shrink-0">
              Ta bort
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-espresso-800 mb-1">Eller sätt ett maxbud</p>
            <p className="text-xs text-espresso-400 mb-2">
              Vi budar automatiskt åt dig, ett steg i taget, upp till ditt max. Andra ser aldrig ditt maxbelopp.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={maxBid}
                  onChange={(e) => setMaxBid(e.target.value)}
                  placeholder={`Max, t.ex. ${(minNext + 900).toLocaleString('sv-SE')}`}
                  className="w-full !pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-300 text-sm">kr</span>
              </div>
              <button onClick={saveAutoBid} disabled={autoLoading} className="btn-ghost-gold whitespace-nowrap !py-2">
                {autoLoading ? '...' : 'Sätt maxbud'}
              </button>
            </div>
          </div>
        )}
        {autoMsg && <p className={`text-sm mt-2 ${autoMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{autoMsg}</p>}
      </div>
    </div>
  )
}
