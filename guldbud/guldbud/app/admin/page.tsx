'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TrashIcon } from '@/components/Icons'
import { estimateRange, formatSEK } from '@/lib/gold'

export default function AdminPage() {
  const [pendingDealers, setPendingDealers] = useState<any[]>([])
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [liveItems, setLiveItems] = useState<any[]>([])
  const [openOrders, setOpenOrders] = useState(0)
  const [adminError, setAdminError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }

      const { data: dealers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'dealer')
        .eq('approved', false)
        .order('created_at', { ascending: false })
      const { data: items } = await supabase
        .from('items')
        .select('*, profiles(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      const { data: active } = await supabase
        .from('items')
        .select('*')
        .in('status', ['active', 'closed'])
        .order('created_at', { ascending: false })

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['accepted', 'shipped_by_seller', 'received', 'verified_paid', 'shipped_to_dealer'])

      setPendingDealers(dealers || [])
      setPendingItems(items || [])
      setLiveItems(active || [])
      setOpenOrders(ordersCount || 0)
      setLoading(false)
    }
    load()
  }, [])

  const deleteItem = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) {
      setAdminError('Kunde inte radera: ' + error.message)
      setDeletingId(null)
      return
    }
    setLiveItems((prev) => prev.filter((i) => i.id !== id))
    setPendingItems((prev) => prev.filter((i) => i.id !== id))
    setDeletingId(null)
    setConfirmId(null)
  }

  const approveDealer = async (id: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('id', id)
    setPendingDealers((prev) => prev.filter((d) => d.id !== id))
  }

  const rejectDealer = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    setPendingDealers((prev) => prev.filter((d) => d.id !== id))
  }

  const approveItem = async (id: string) => {
    await supabase
      .from('items')
      .update({
        status: 'active',
        auction_ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', id)
    setPendingItems((prev) => prev.filter((i) => i.id !== id))
  }

  const rejectItem = async (id: string) => {
    await supabase.from('items').update({ status: 'rejected' }).eq('id', id)
    setPendingItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading)
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
          <div className="h-8 w-48 rounded skeleton" />
          <div className="h-24 rounded-2xl skeleton" />
          <div className="h-24 rounded-2xl skeleton" />
        </div>
      </div>
    )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Header */}
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <p className="eyebrow text-gold-500/80 mb-1">Kontrollrum</p>
          <h1 className="font-display text-3xl text-gold-100">Adminpanel</h1>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="font-display text-2xl text-gold-100">{pendingDealers.length}</div>
              <div className="text-xs text-gold-500/60">Väntande handlare</div>
            </div>
            <div>
              <div className="font-display text-2xl text-gold-100">{pendingItems.length}</div>
              <div className="text-xs text-gold-500/60">Väntande föremål</div>
            </div>
            <div>
              <div className="font-display text-2xl text-gold-100">
                {liveItems.filter((i) => i.status === 'active').length}
              </div>
              <div className="text-xs text-gold-500/60">Aktiva auktioner</div>
            </div>
            <div>
              <div className="font-display text-2xl text-emerald-400">{openOrders}</div>
              <div className="text-xs text-gold-500/60">Pågående affärer</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {adminError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3">
            <p className="text-sm text-red-600">{adminError}</p>
            <button onClick={() => setAdminError('')} className="text-red-400 hover:text-red-600 text-sm shrink-0">
              Stäng
            </button>
          </div>
        )}

        {/* Orders */}
        <Link
          href="/admin/orders"
          className="card card-hover p-5 mb-10 flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-display text-lg text-espresso-900">Affärer</p>
            <p className="text-sm text-espresso-400">Hantera vunna auktioner: status, spårning och meddelanden.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {openOrders > 0 && <span className="chip bg-amber-100 text-amber-700">{openOrders} pågående</span>}
            <span className="text-gold-600 text-sm">Öppna →</span>
          </div>
        </Link>

        {/* Dealers */}
        <section className="mb-12">
          <h2 className="font-display text-xl text-espresso-900 mb-4 flex items-center gap-2">
            Handlare att godkänna
            <span className="chip bg-amber-100 text-amber-700">{pendingDealers.length}</span>
          </h2>
          {pendingDealers.length === 0 ? (
            <div className="card p-8 text-center text-espresso-400 text-sm">Inga väntande handlare.</div>
          ) : (
            <div className="space-y-3">
              {pendingDealers.map((dealer) => (
                <div key={dealer.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gold-sheen flex items-center justify-center text-espresso-900 font-semibold shrink-0">
                      {(dealer.company_name || dealer.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-espresso-900 truncate">
                        {dealer.company_name || dealer.full_name || 'Handlare'}
                      </p>
                      <p className="text-xs text-espresso-400">
                        Guldhandlare · registrerad {new Date(dealer.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <Info label="Företag" value={dealer.company_name} />
                    <Info label="Org.nummer" value={dealer.org_number} />
                    <Info label="Kontaktperson" value={dealer.full_name} />
                    <Info label="Personnummer" value={dealer.personal_number} />
                    <Info label="E-post" value={dealer.email} />
                    <Info label="Telefon" value={dealer.phone} />
                    <Info
                      label="Adress"
                      value={[dealer.address, [dealer.postal_code, dealer.city].filter(Boolean).join(' ')]
                        .filter(Boolean)
                        .join(', ')}
                    />
                  </dl>

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => approveDealer(dealer.id)}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                    >
                      Godkänn
                    </button>
                    <button
                      onClick={() => rejectDealer(dealer.id)}
                      className="flex-1 sm:flex-initial bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-5 py-2.5 rounded-xl transition"
                    >
                      Neka
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Items */}
        <section>
          <h2 className="font-display text-xl text-espresso-900 mb-4 flex items-center gap-2">
            Föremål att granska
            <span className="chip bg-amber-100 text-amber-700">{pendingItems.length}</span>
          </h2>
          {pendingItems.length === 0 ? (
            <div className="card p-8 text-center text-espresso-400 text-sm">Inga väntande föremål.</div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item) => {
                const est = estimateRange(item.weight_grams || 0, item.karat || '')
                return (
                  <div key={item.id} className="card p-5 flex gap-4 flex-wrap sm:flex-nowrap">
                    {item.image_urls?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_urls[0]} alt={item.title} className="w-24 h-24 object-contain rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-espresso-900">{item.title}</p>
                      <p className="text-sm text-espresso-500">
                        {item.category ? `${item.category} · ` : ''}{item.weight_grams} g · {item.karat}
                        {item.gemstone ? ` · ${item.gemstone}${item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}` : ''}
                      </p>
                      <p className="text-xs text-gold-600 mt-0.5">
                        Metallvärde {formatSEK(est.melt)}
                      </p>
                      {item.min_price && (
                        <p className="text-sm text-espresso-500">
                          Minimipris: {item.min_price.toLocaleString('sv-SE')} kr
                        </p>
                      )}
                      <p className="text-xs text-espresso-400 mt-1">
                        {item.profiles?.full_name} · {item.profiles?.email}
                      </p>
                      {item.description && (
                        <p className="text-xs text-espresso-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => approveItem(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                      >
                        Godkänn
                      </button>
                      <button
                        onClick={() => rejectItem(item.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition"
                      >
                        Neka
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Active / closed auctions — manage & delete */}
        <section className="mt-12">
          <h2 className="font-display text-xl text-espresso-900 mb-4 flex items-center gap-2">
            Auktioner
            <span className="chip bg-espresso-100 text-espresso-500">{liveItems.length}</span>
          </h2>
          {liveItems.length === 0 ? (
            <div className="card p-8 text-center text-espresso-400 text-sm">Inga auktioner ännu.</div>
          ) : (
            <div className="space-y-3">
              {liveItems.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4 items-center flex-wrap sm:flex-nowrap">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-800 to-espresso-600 relative shrink-0">
                    {item.image_urls?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-espresso-900">{item.title}</p>
                      <span className={`chip ${item.status === 'closed' ? 'bg-espresso-100 text-espresso-500' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.status === 'closed' ? 'Avslutad' : 'Aktiv'}
                      </span>
                    </div>
                    <p className="text-xs text-espresso-400 mt-0.5">
                      {item.category ? `${item.category} · ` : ''}{item.weight_grams} g · {item.karat}
                      {item.gemstone ? ` · ${item.gemstone}${item.diamond_carat ? ` ${item.diamond_carat} ct` : ''}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {confirmId === item.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="text-sm font-medium px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition"
                        >
                          {deletingId === item.id ? 'Raderar...' : 'Ja, radera'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-sm font-medium px-3 py-2 rounded-xl bg-espresso-100 hover:bg-espresso-200 text-espresso-600 transition"
                        >
                          Avbryt
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(item.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-espresso-500 hover:text-red-600 border border-espresso-200 hover:border-red-200 px-3 py-2 rounded-xl transition"
                      >
                        <TrashIcon size={15} />
                        Radera
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-espresso-400">{label}</dt>
      <dd className="text-espresso-800 break-words">{value || '—'}</dd>
    </div>
  )
}
