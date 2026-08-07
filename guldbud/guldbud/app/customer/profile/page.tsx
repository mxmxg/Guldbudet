'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import NotifToggle from '@/components/NotifToggle'

export default function CustomerProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [stats, setStats] = useState({ items: 0, deals: 0 })
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    personal_number: '',
    address: '',
    postal_code: '',
    city: '',
  })

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'customer') {
      router.push('/')
      return
    }
    setProfile(prof)
    setForm({
      full_name: prof.full_name || '',
      phone: prof.phone || '',
      personal_number: prof.personal_number || '',
      address: prof.address || '',
      postal_code: prof.postal_code || '',
      city: prof.city || '',
    })

    const [{ count: itemCount }, { count: dealCount }] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id),
    ])
    setStats({ items: itemCount || 0, deals: dealCount || 0 })
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        personal_number: form.personal_number || null,
        address: form.address || null,
        postal_code: form.postal_code || null,
        city: form.city || null,
      })
      .eq('id', profile.id)
    if (error) setMsg({ ok: false, text: error.message })
    else {
      setMsg({ ok: true, text: 'Dina uppgifter är sparade.' })
      setProfile((p: any) => ({ ...p, ...form }))
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <div className="relative overflow-hidden bg-espresso-900">
        <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <p className="eyebrow text-gold-500/80 mb-1">Min profil</p>
          <h1 className="font-display text-3xl text-gold-100">{profile?.full_name || 'Mitt konto'}</h1>
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="font-display text-2xl text-gold-100">{stats.items}</div>
              <div className="text-xs text-gold-500/60">Utlagda föremål</div>
            </div>
            <div>
              <div className="font-display text-2xl text-gold-100">{stats.deals}</div>
              <div className="text-xs text-gold-500/60">Affärer</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="h-64 rounded-2xl skeleton" />
        ) : (
          <div className="grid gap-6">
            <section className="card p-6">
              <h2 className="font-display text-xl text-espresso-900 mb-1">Mina uppgifter</h2>
              <p className="text-xs text-espresso-400 mb-5">
                Vi använder uppgifterna för utbetalning och för att kunna kontakta dig om en affär. De delas aldrig publikt.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Namn">
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </Field>
                <Field label="Personnummer">
                  <input value={form.personal_number} onChange={(e) => setForm({ ...form, personal_number: e.target.value })} placeholder="ÅÅÅÅMMDD-XXXX" />
                </Field>
                <Field label="E-post (kan ej ändras här)">
                  <input value={profile.email} disabled className="!bg-espresso-50 !text-espresso-400" />
                </Field>
                <Field label="Telefon">
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
                {msg && <span className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</span>}
              </div>
            </section>

            <section className="card p-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg text-espresso-900">Notiser</h2>
                <p className="text-xs text-espresso-400 mt-0.5">
                  E-post om bud, godkännande och affärer. Notiser i appen visas alltid.
                </p>
              </div>
              <NotifToggle
                on={profile.email_notifications !== false}
                onToggle={async (v) => {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ email_notifications: v })
                    .eq('id', profile.id)
                  if (!error) setProfile((p: any) => ({ ...p, email_notifications: v }))
                }}
              />
            </section>

            <section className="grid sm:grid-cols-2 gap-4">
              <Link href="/customer/my-items" className="card p-5 hover:shadow-gold transition group">
                <p className="font-medium text-espresso-900 group-hover:text-gold-700 transition">Mina föremål</p>
                <p className="text-xs text-espresso-400 mt-1">Se dina auktioner och affärer.</p>
              </Link>
              <Link href="/customer/submit" className="card p-5 hover:shadow-gold transition group">
                <p className="font-medium text-espresso-900 group-hover:text-gold-700 transition">Lägg ut föremål</p>
                <p className="text-xs text-espresso-400 mt-1">Starta en ny auktion.</p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-espresso-500 mb-1.5">{label}</span>
      {children}
    </label>
  )
}
