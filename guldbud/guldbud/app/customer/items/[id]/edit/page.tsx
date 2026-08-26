'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { KARAT_OPTIONS, estimateRange, formatSEK } from '@/lib/gold'
import { CATEGORIES, GEMSTONES } from '@/lib/catalog'

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    weight: '',
    karat: '',
    minPrice: '',
    hasGem: false,
    gemstone: 'Diamant',
    diamondCarat: '',
  })

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push('/auth/login')
      return
    }
    const { data: item } = await supabase.from('items').select('*').eq('id', params.id).single()
    if (!item || item.owner_id !== user.id || item.status !== 'pending') {
      // Only the owner can edit, and only while pending (before approval).
      router.push('/customer/my-items')
      return
    }
    setForm({
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      weight: item.weight_grams ? String(item.weight_grams) : '',
      karat: item.karat || '',
      minPrice: item.min_price ? String(item.min_price) : '',
      hasGem: !!item.gemstone,
      gemstone: item.gemstone || 'Diamant',
      diamondCarat: item.diamond_carat ? String(item.diamond_carat) : '',
    })
    setLoading(false)
  }

  const est = useMemo(() => {
    const w = parseFloat(form.weight)
    if (!w || !form.karat) return null
    return estimateRange(w, form.karat)
  }, [form.weight, form.karat])

  const save = async () => {
    setError('')
    if (!form.title || !form.weight || !form.karat) {
      setError('Fyll i titel, vikt och karat.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase
      .from('items')
      .update({
        title: form.title,
        category: form.category || null,
        description: form.description,
        karat: form.karat,
        weight_grams: parseFloat(form.weight),
        diamond_carat: form.hasGem && form.diamondCarat ? parseFloat(form.diamondCarat) : null,
        gemstone: form.hasGem ? form.gemstone : null,
        min_price: form.minPrice ? parseInt(form.minPrice) : null,
      })
      .eq('id', params.id)
    setSaving(false)
    if (err) setError(err.message)
    else router.push('/customer/my-items')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
          <div className="h-96 rounded-2xl skeleton" />
        </div>
        <Footer />
      </div>
    )
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
        <Link href="/customer/my-items" className="text-sm text-espresso-500 hover:text-espresso-800">← Mina föremål</Link>
        <h1 className="font-display text-3xl text-espresso-900 mt-2 mb-1">Redigera föremål</h1>
        <p className="text-sm text-espresso-400 mb-6">Du kan ändra uppgifterna så länge föremålet väntar på granskning.</p>

        <div className="card p-6 grid gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-espresso-700 mb-1.5">Kategori</span>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full">
              <option value="">Välj kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-espresso-700 mb-1.5">Titel</span>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className="w-full" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-espresso-700 mb-1.5">Beskrivning</span>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-espresso-700 mb-1.5">Vikt (gram)</span>
              <input type="number" step="0.01" value={form.weight} onChange={(e) => set('weight', e.target.value)} className="w-full" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-espresso-700 mb-1.5">Karat / finhet</span>
              <select value={form.karat} onChange={(e) => set('karat', e.target.value)} className="w-full">
                <option value="">Välj</option>
                {KARAT_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-espresso-700">
            <input type="checkbox" checked={form.hasGem} onChange={(e) => set('hasGem', e.target.checked)} />
            Föremålet har diamant/ädelsten
          </label>
          {form.hasGem && (
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-espresso-700 mb-1.5">Ädelsten</span>
                <select value={form.gemstone} onChange={(e) => set('gemstone', e.target.value)} className="w-full">
                  {GEMSTONES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-espresso-700 mb-1.5">Karat (ct)</span>
                <input type="number" step="0.01" value={form.diamondCarat} onChange={(e) => set('diamondCarat', e.target.value)} className="w-full" />
              </label>
            </div>
          )}

          <label className="block">
            <span className="block text-sm font-medium text-espresso-700 mb-1.5">
              Reservationspris (valfritt)
            </span>
            <input type="number" value={form.minPrice} onChange={(e) => set('minPrice', e.target.value)} placeholder="Lägsta pris du accepterar" className="w-full" />
          </label>

          {est && (
            <p className="text-xs text-espresso-400">Uppskattad utbetalning: {formatSEK(est.low)}–{formatSEK(est.high)}</p>
          )}

          <p className="text-xs text-espresso-400">Bilderna behåller du från din ursprungliga uppladdning.</p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={save} disabled={saving} className="btn-gold">
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
            <Link href="/customer/my-items" className="btn-ghost-gold">Avbryt</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
