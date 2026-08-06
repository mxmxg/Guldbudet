'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { CheckIcon } from '@/components/Icons'
import NotifToggle from '@/components/NotifToggle'
import { ORDER_STATUS_LABEL, OrderStatus } from '@/lib/orders'
import { formatSEK } from '@/lib/gold'

type Stats = { bids: number; items: number; leading: number; won: number }

export default function DealerProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [stats, setStats] = useState<Stats>({ bids: 0, items: 0, leading: 0, won: 0 })
  const [orders, setOrders] = useState<any[]>([])
  const [docUploading, setDocUploading] = useState(false)
  const [docMsg, setDocMsg] = useState('')

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setDocMsg('')
    if (file.size > 10 * 1024 * 1024) {
      setDocMsg('Filen är för stor (max 10 MB).')
      return
    }
    setDocUploading(true)
    const ext = file.name.split('.').pop() || 'dat'
    const path = `${profile.id}/verification.${ext}`
    const { error: upErr } = await supabase.storage
      .from('dealer-docs')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      setDocMsg(upErr.message)
      setDocUploading(false)
      return
    }
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ verification_doc_path: path })
      .eq('id', profile.id)
    if (pErr) setDocMsg(pErr.message)
    else setProfile((p: any) => ({ ...p, verification_doc_path: path }))
    setDocUploading(false)
  }
  const [form, setForm] = useState({
    company_name: '',
    full_name: '',
    phone: '',
    org_number: '',
    address: '',
    postal_code: '',
    city: '',
  })

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login?role=dealer')
      return
    }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'dealer') {
      router.push('/')
      return
    }
    setProfile(prof)
    setForm({
      company_name: prof.company_name || '',
      full_name: prof.full_name || '',
      phone: prof.phone || '',
      org_number: prof.org_number || '',
      address: prof.address || '',
      postal_code: prof.postal_code || '',
      city: prof.city || '',
    })

    // Stats
    const { data: mine } = await supabase.from('bids').select('item_id, amount').eq('dealer_id', user.id)
    const myBids = mine || []
    const itemIds = Array.from(new Set(myBids.map((b: any) => b.item_id)))
    const myMax: Record<string, number> = {}
    myBids.forEach((b: any) => {
      if (!myMax[b.item_id] || b.amount > myMax[b.item_id]) myMax[b.item_id] = b.amount
    })

    let leading = 0
    let won = 0
    if (itemIds.length > 0) {
      const { data: allBids } = await supabase.from('bids').select('item_id, amount').in('item_id', itemIds)
      const top: Record<string, number> = {}
      allBids?.forEach((b: any) => {
        if (!top[b.item_id] || b.amount > top[b.item_id]) top[b.item_id] = b.amount
      })
      itemIds.forEach((id) => {
        if (myMax[id] && myMax[id] >= top[id]) leading += 1
      })
      const { data: closedItems } = await supabase
        .from('items')
        .select('id, status, accepted_at')
        .in('id', itemIds)
        .eq('status', 'closed')
      // A closed item that we were leading on counts as won.
      closedItems?.forEach((it: any) => {
        if (myMax[it.id] && myMax[it.id] >= top[it.id]) won += 1
      })
      leading -= won // don't double-count closed ones as "leading"
      if (leading < 0) leading = 0
    }
    setStats({ bids: myBids.length, items: itemIds.length, leading, won })

    const { data: myOrders } = await supabase
      .from('orders')
      .select('id, amount, status, items(title, image_urls)')
      .eq('dealer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(myOrders || [])

    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    // company_name and org_number are verification details and cannot be
    // changed by the dealer (locked in the UI and by RLS). Contact GuldBud to
    // update them.
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        address: form.address || null,
        postal_code: form.postal_code || null,
        city: form.city || null,
      })
      .eq('id', profile.id)
    if (error) {
      setMsg({ ok: false, text: error.message })
    } else {
      setMsg({ ok: true, text: 'Dina uppgifter är sparade.' })
      setProfile((p: any) => ({ ...p, ...form }))
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <p className="eyebrow text-gold-500/80 mb-1">Min profil</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-gold-100">
              {profile?.company_name || profile?.full_name || 'Handlare'}
            </h1>
            {profile &&
              (profile.approved ? (
                <span className="chip bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 inline-flex items-center gap-1">
                  <CheckIcon size={13} strokeWidth={3} /> Verifierad handlare
                </span>
              ) : (
                <span className="chip bg-amber-500/15 text-amber-300 border border-amber-400/25">
                  Väntar på godkännande
                </span>
              ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <HeaderStat value={stats.bids} label="Bud lagda" />
            <HeaderStat value={stats.items} label="Auktioner budat på" />
            <HeaderStat value={stats.leading} label="Ledande nu" accent />
            <HeaderStat value={stats.won} label="Vunna auktioner" />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="grid gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Not approved notice */}
            {!profile.approved && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
                <p className="text-amber-800 font-medium text-sm">Ditt handlarkonto granskas</p>
                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                  Vi kontrollerar dina uppgifter manuellt innan du får buda. Du får ett mejl så snart du är
                  godkänd. Kontrollera gärna att uppgifterna nedan är kompletta – det gör granskningen snabbare.
                </p>
              </div>
            )}

            {/* Contact / company */}
            <section className="card p-6">
              <h2 className="font-display text-xl text-espresso-900 mb-1">Företags- och kontaktuppgifter</h2>
              <p className="text-xs text-espresso-400 mb-5">
                Dessa uppgifter visas aldrig publikt. I budgivningen syns du bara som ett anonymt handlarnummer.
                Företagsnamn och organisationsnummer är låsta efter verifieringen – kontakta GuldBud om något behöver ändras.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Företagsnamn (kan ej ändras)">
                  <input value={form.company_name} disabled className="!bg-espresso-50 !text-espresso-400" />
                </Field>
                <Field label="Organisationsnummer (kan ej ändras)">
                  <input value={form.org_number} disabled className="!bg-espresso-50 !text-espresso-400" />
                </Field>
                <Field label="Kontaktperson">
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </Field>
                <Field label="Telefon">
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="E-post (kan ej ändras här)">
                  <input value={profile.email} disabled className="!bg-espresso-50 !text-espresso-400" />
                </Field>
                <Field label="Adress">
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <Field label="Postnummer">
                  <input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
                </Field>
                <Field label="Ort">
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </Field>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <button onClick={save} disabled={saving} className="btn-gold">
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
                {msg && (
                  <span className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</span>
                )}
              </div>
            </section>

            {/* Verifieringsdokument */}
            <section className="card p-6">
              <h2 className="font-display text-xl text-espresso-900 mb-1">Verifieringsdokument</h2>
              <p className="text-xs text-espresso-400 mb-4">
                Ladda upp t.ex. registreringsbevis eller F-skattebevis så går godkännandet snabbare. Dokumentet är
                privat och ses bara av GuldBuds granskare.
              </p>
              {profile.verification_doc_path ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="chip bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                    <CheckIcon size={13} strokeWidth={3} /> Dokument uppladdat
                  </span>
                  <label className="text-sm text-gold-600 hover:text-gold-700 cursor-pointer">
                    {docUploading ? 'Laddar upp…' : 'Byt ut dokument'}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={uploadDoc} />
                  </label>
                </div>
              ) : (
                <label className="btn-ghost-gold inline-flex cursor-pointer">
                  {docUploading ? 'Laddar upp…' : 'Ladda upp dokument'}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={uploadDoc} />
                </label>
              )}
              {docMsg && <p className="text-sm text-red-500 mt-2">{docMsg}</p>}
            </section>

            {/* Notiser */}
            <section className="card p-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg text-espresso-900">Notiser</h2>
                <p className="text-xs text-espresso-400 mt-0.5">
                  E-post om nya bud, överbud och affärer. Notiser i appen visas alltid.
                </p>
              </div>
              <NotifToggle
                on={profile.email_notifications !== false}
                onToggle={async (v) => {
                  await supabase.from('profiles').update({ email_notifications: v }).eq('id', profile.id)
                  setProfile((p: any) => ({ ...p, email_notifications: v }))
                }}
              />
            </section>

            {/* Mina affärer */}
            {orders.length > 0 && (
              <section className="card p-6">
                <h2 className="font-display text-xl text-espresso-900 mb-1">Mina affärer</h2>
                <p className="text-xs text-espresso-400 mb-4">Auktioner du vunnit och deras status.</p>
                <div className="grid gap-3">
                  {orders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="flex items-center gap-3 rounded-xl border border-espresso-100 p-3 hover:border-gold-300 hover:bg-gold-50/40 transition"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-espresso-900 to-espresso-800 relative shrink-0">
                        {o.items?.image_urls?.[0] && (
                          <Image src={o.items.image_urls[0]} alt="" fill className="object-contain" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-espresso-900 truncate">{o.items?.title}</p>
                        <span className="chip bg-espresso-100 text-espresso-600 mt-0.5">
                          {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gold-700 tabular-nums shrink-0">
                        {formatSEK(o.amount)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Quick links */}
            <section className="grid sm:grid-cols-2 gap-4">
              <Link href="/dealer/dashboard" className="card p-5 hover:shadow-gold transition group">
                <p className="font-medium text-espresso-900 group-hover:text-gold-700 transition">Till budpanelen</p>
                <p className="text-xs text-espresso-400 mt-1">Se aktiva auktioner och lägg bud.</p>
              </Link>
              <Link href="/dealer/guide" className="card p-5 hover:shadow-gold transition group">
                <p className="font-medium text-espresso-900 group-hover:text-gold-700 transition">Så fungerar budgivningen</p>
                <p className="text-xs text-espresso-400 mt-1">Från bud till vunnet föremål – steg för steg.</p>
              </Link>
            </section>

            <div className="text-center pt-2">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="text-sm text-espresso-400 hover:text-espresso-700 transition"
              >
                Logga ut
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function HeaderStat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-display text-2xl ${accent ? 'text-emerald-400' : 'text-gold-100'}`}>{value}</div>
      <div className="text-xs text-gold-500/60">{label}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-espresso-500 mb-1.5">{label}</span>
      {children}
    </label>
  )
}
