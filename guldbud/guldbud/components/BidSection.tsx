'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { DEALER_COMMISSION_LABEL, commission, totalWithCommission } from '@/lib/fees'

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
  const [role, setRole] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, approved')
          .eq('id', data.user.id)
          .single()
        setRole(prof?.role ?? null)
        setApproved(prof?.approved ?? false)
      }
      setChecked(true)
    })
  }, [])

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
      setMsg(error.message)
      setOk(false)
    } else {
      setMsg('Ditt bud är lagt!')
      setOk(true)
      setAmount('')
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

  return (
    <div className="rounded-2xl bg-white border border-espresso-100 p-5 shadow-soft">
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
            <div className="flex justify-between font-semibold text-espresso-800 pt-1 mt-1 border-t border-espresso-100">
              <span>Ditt totalpris</span>
              <span className="tabular-nums">{totalWithCommission(parseInt(amount)).toLocaleString('sv-SE')} kr</span>
            </div>
          </div>
        ) : (
          <span>Provision {DEALER_COMMISSION_LABEL} tillkommer på ditt bud. Säljaren får hela budbeloppet.</span>
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
    </div>
  )
}
