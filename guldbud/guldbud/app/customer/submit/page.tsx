'use client'
import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { KARAT_OPTIONS, estimateRange, formatSEK } from '@/lib/gold'

export default function SubmitPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [karat, setKarat] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const est = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || !karat) return null
    return estimateRange(w, karat)
  }, [weight, karat])

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles).slice(0, 6)
    setFiles((prev) => [...prev, ...arr].slice(0, 6))
    arr.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target!.result as string].slice(0, 6))
      reader.readAsDataURL(f)
    })
  }

  const removeImage = (i: number) => {
    setFiles((f) => f.filter((_, idx) => idx !== i))
    setPreviews((p) => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length < 2) {
      setError('Ladda upp minst 2 bilder.')
      return
    }
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const imageUrls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('item-images').upload(path, file)
      if (uploadError) {
        setError('Bilduppladdning misslyckades: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data } = supabase.storage.from('item-images').getPublicUrl(path)
      imageUrls.push(data.publicUrl)
    }

    const { error: insertError } = await supabase.from('items').insert({
      owner_id: user.id,
      title,
      description,
      karat,
      weight_grams: parseFloat(weight),
      min_price: minPrice ? parseInt(minPrice) : null,
      image_urls: imageUrls,
      status: 'pending',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success)
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto text-center py-24 px-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-scale-in">
            ✓
          </div>
          <h1 className="font-display text-3xl text-espresso-900 mb-3">Förfrågan mottagen!</h1>
          <p className="text-espresso-500 mb-8 leading-relaxed">
            Vi granskar ditt föremål och öppnar budgivningen inom ett par timmar. Du får en
            notifiering så fort auktionen är live.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => {
                setSuccess(false)
                setFiles([])
                setPreviews([])
                setTitle('')
                setDescription('')
                setWeight('')
                setKarat('')
                setMinPrice('')
              }}
              className="btn-gold"
            >
              Lägg ut ett till
            </button>
            <Link href="/customer/my-items" className="btn-outline">
              Se mina föremål
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="eyebrow text-gold-600">Kostnadsfritt · tar 5 minuter</span>
          <h1 className="font-display text-3xl sm:text-4xl text-espresso-900 mt-2">Lägg ut ett guldföremål</h1>
          <p className="text-espresso-500 mt-2 max-w-xl">
            Fyll i uppgifter och ladda upp foton. Auktoriserade guldhandlare budar direkt — du väljer
            det bästa budet.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <form onSubmit={handleSubmit} className="card p-6 sm:p-8 flex flex-col gap-6">
            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-2">
                Foton <span className="text-espresso-400 font-normal">(minst 2, max 6)</span>
              </label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-espresso-100 group">
                    <Image src={src} alt="" fill className="object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 chip bg-espresso-900/80 text-gold-200 !text-[10px] !px-1.5 !py-0.5">
                        Huvudbild
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {previews.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      handleFiles(e.dataTransfer.files)
                    }}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition ${
                      dragOver
                        ? 'border-gold-400 bg-gold-50 text-gold-600'
                        : 'border-espresso-200 text-espresso-400 hover:border-gold-400 hover:text-gold-500'
                    }`}
                  >
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-xs">Lägg till</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <p className="text-xs text-espresso-400">
                Tips: framsida, baksida, stämpel/punsstämpel och eventuella skador.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">Typ av föremål</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Guldring, Halskedja, Guldmynt"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Vikt (gram)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="t.ex. 12.5"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Karat / finhet</label>
                <select required value={karat} onChange={(e) => setKarat(e.target.value)} className="w-full">
                  <option value="">Välj...</option>
                  {KARAT_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">
                Minimipris i SEK <span className="text-espresso-400 font-normal">(valfritt)</span>
              </label>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Lämna tomt för att acceptera alla bud"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">Beskrivning</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv föremålet – ålder, ursprung, skick, gravyr eller annan info handlarna bör känna till."
                className="w-full"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-gold">
              {loading ? 'Skickar in...' : 'Skicka in förfrågan'}
            </button>
          </form>

          {/* Sidebar — live estimate + reassurance */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-espresso-900 p-6 shadow-gold">
              <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
              <div className="relative">
                <p className="eyebrow text-gold-400/80 mb-2">Uppskattat värde</p>
                {est ? (
                  <>
                    <p className="font-display text-2xl text-gradient-gold tabular-nums leading-tight">
                      {formatSEK(est.low)} – {formatSEK(est.high)}
                    </p>
                    <p className="text-espresso-100/50 text-xs mt-2">
                      Metallvärde vid dagens guldpris. Handlarnas bud landar ofta högre.
                    </p>
                  </>
                ) : (
                  <p className="text-espresso-100/50 text-sm">
                    Fyll i vikt och karat så visar vi ett direktvärde här.
                  </p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-sm font-medium text-espresso-800 mb-3">Därför lönar det sig</p>
              <ul className="space-y-2.5 text-sm text-espresso-500">
                {[
                  'Handlare budar i konkurrens',
                  'Gratis att lägga ut',
                  'Du väljer om du säljer',
                  'Utbetalning via Swish',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#a8791a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}
