'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { KARAT_OPTIONS, estimateRange, formatSEK, isPlatinum } from '@/lib/gold'
import { CATEGORIES, GEMSTONES } from '@/lib/catalog'
import { CheckIcon } from '@/components/Icons'

export default function SubmitPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiHidden, setAiHidden] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [karat, setKarat] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [hasGem, setHasGem] = useState(false)
  const [gemstone, setGemstone] = useState('Diamant')
  const [diamondCarat, setDiamondCarat] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Guard on mount so a guest/dealer isn't allowed to fill in the whole form
  // only to be bounced at submit (losing everything they typed).
  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (prof?.role !== 'customer') {
        router.push('/')
        return
      }
      // Kräv BankID-verifiering innan listning – men bara när BankID är skarpt
      // aktiverat. identity_verified läses bara då, så submit inte kraschar om
      // kolumnen ännu inte finns (migrationen körs innan BankID aktiveras).
      if (process.env.NEXT_PUBLIC_BANKID_ENABLED === 'true') {
        const { data: v } = await supabase
          .from('profiles')
          .select('identity_verified')
          .eq('id', user.id)
          .single()
        if (!v?.identity_verified) router.push('/verifiering')
      }
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const est = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || !karat) return null
    return estimateRange(w, karat)
  }, [weight, karat])

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles).slice(0, 6)
    // Skapa previews synkront och i exakt samma ordning som filerna, så att
    // previews[i] alltid motsvarar files[i] (annars kan fel bild bli huvudbild
    // eller fel bild raderas).
    setFiles((prev) => [...prev, ...arr].slice(0, 6))
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))].slice(0, 6))
  }

  // Skala ner bilden i webbläsaren innan den skickas till AI:n (mindre payload,
  // lägre kostnad, snabbare svar).
  const fileToDataUrl = async (file: File, max = 1024): Promise<string> => {
    const img = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const suggestWithAI = async () => {
    if (files.length === 0) return
    setAiLoading(true)
    setAiError('')
    try {
      // Skicka upp till 3 bilder så AI:n kan avgöra typ från flera vinklar.
      const dataUrls = await Promise.all(files.slice(0, 3).map((f) => fileToDataUrl(f)))
      const res = await fetch('/api/suggest-listing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dataUrls }),
      })
      if (res.status === 503) {
        // AI inte aktiverad (ingen nyckel) – dölj knappen tyst.
        setAiHidden(true)
        return
      }
      if (!res.ok) {
        setAiError('AI-förslaget gick inte att hämta just nu. Fyll gärna i själv.')
        return
      }
      const s = await res.json()
      if (s.title) setTitle(s.title)
      if (s.description) setDescription(s.description)
      if (s.category && !category) setCategory(s.category)
    } catch {
      setAiError('AI-förslaget gick inte att hämta just nu. Fyll gärna i själv.')
    } finally {
      setAiLoading(false)
    }
  }

  const removeImage = (i: number) => {
    setPreviews((p) => {
      const url = p[i]
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
      return p.filter((_, idx) => idx !== i)
    })
    setFiles((f) => f.filter((_, idx) => idx !== i))
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
      setLoading(false)
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
      category: category || null,
      description,
      karat,
      weight_grams: parseFloat(weight),
      diamond_carat: hasGem && diamondCarat ? parseFloat(diamondCarat) : null,
      gemstone: hasGem ? gemstone : null,
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
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckIcon size={34} />
          </div>
          <h1 className="font-display text-3xl text-espresso-900 mb-3">Förfrågan mottagen</h1>
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
                setCategory('')
                setDescription('')
                setWeight('')
                setKarat('')
                setMinPrice('')
                setHasGem(false)
                setDiamondCarat('')
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
          <h1 className="font-display text-3xl sm:text-4xl text-espresso-900">Lägg ut ett smycke</h1>
          <p className="text-espresso-500 mt-2 max-w-xl">
            Kostnadsfritt och klart på fem minuter. Fyll i uppgifter och ladda upp foton –
            auktoriserade guldhandlare budar direkt, och du väljer själv det bud du är nöjd med.
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
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-espresso-100 bg-gradient-to-br from-espresso-900 to-espresso-800 group">
                    <Image src={src} alt="" fill className="object-contain" />
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
                    <span className="text-2xl mb-1 leading-none">+</span>
                    <span className="text-xs">Lägg till</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

              {previews.length < 6 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="btn-outline !py-2 text-sm">
                    📷 Ta foto
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline !py-2 text-sm">
                    🖼 Ladda upp bild
                  </button>
                </div>
              )}
              <p className="text-xs text-espresso-400">
                Tips: framsida, baksida, stämpel och eventuella skador.
              </p>

              {/* AI-förslag på rubrik & beskrivning från fotot */}
              {files.length > 0 && !aiHidden && (
                <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50 p-3">
                  <button
                    type="button"
                    onClick={suggestWithAI}
                    disabled={aiLoading}
                    className="btn-gold !py-2 text-sm"
                  >
                    {aiLoading ? 'Analyserar bilden…' : '✨ Föreslå rubrik & beskrivning'}
                  </button>
                  <p className="text-xs text-espresso-500 mt-2">
                    Vi tittar på dina bilder och fyller i rubrik, beskrivning och kategori åt dig. Du kan ändra allt efteråt.
                  </p>
                  {aiError && <p className="text-xs text-red-500 mt-1.5">{aiError}</p>}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Kategori</label>
                <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full">
                  <option value="">Välj kategori...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Namn på föremålet</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="t.ex. Vigselring i rödguld"
                  className="w-full"
                />
              </div>
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
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Guldets karat / finhet</label>
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

            {/* Diamonds / gemstones */}
            <div className="rounded-xl border border-espresso-100 p-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasGem}
                  onChange={(e) => setHasGem(e.target.checked)}
                  className="!w-auto !p-0 h-4 w-4 accent-gold-500"
                />
                <span className="text-sm font-medium text-espresso-800">Innehåller diamant eller ädelsten</span>
              </label>
              {hasGem && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-espresso-600 mb-1.5">Typ av sten</label>
                    <select value={gemstone} onChange={(e) => setGemstone(e.target.value)} className="w-full">
                      {GEMSTONES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-espresso-600 mb-1.5">
                      Stenens vikt (carat) <span className="text-espresso-400 font-normal">(valfritt)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={diamondCarat}
                      onChange={(e) => setDiamondCarat(e.target.value)}
                      placeholder="t.ex. 0.50"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">
                Reservationspris i SEK <span className="text-espresso-400 font-normal">(valfritt)</span>
              </label>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Lämna tomt för att ta emot alla bud"
                className="w-full"
              />
              <p className="mt-1.5 text-xs text-espresso-400">
                Den lägsta nivå du är beredd att sälja för. Når inte högsta budet dit är du aldrig
                skyldig att sälja. Beloppet visas aldrig för handlarna.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">Beskrivning</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv föremålet: ålder, ursprung, skick, gravyr eller annat som handlarna bör känna till."
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

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-espresso-900 p-6 shadow-gold">
              <div className="pointer-events-none absolute inset-0 bg-espresso-glow" />
              <div className="relative">
                <p className="eyebrow text-gold-400/80 mb-2">Uppskattat värde</p>
                {isPlatinum(karat) ? (
                  <p className="text-espresso-100/70 text-sm leading-relaxed">
                    Platina prissätts på sin egen marknad, inte via guldkursen. Vi värderar den exakt vid
                    mottagning, och handlarna budar i konkurrens om slutpriset.
                  </p>
                ) : est ? (
                  <>
                    <p className="font-display text-2xl text-gradient-gold tabular-nums leading-tight">
                      {formatSEK(est.low)} till {formatSEK(est.high)}
                    </p>
                    <p className="text-espresso-100/50 text-xs mt-2">
                      {hasGem
                        ? 'Uppskattad utbetalning utifrån guldvärdet. Diamanter och ädelstenar höjer värdet ytterligare.'
                        : 'Uppskattad utbetalning, något under metallvärdet vid dagens guldpris. Handlarna budar i konkurrens om slutpriset.'}
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
                  'Utbetalning via Swish eller bankkonto',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center shrink-0">
                      <CheckIcon size={10} strokeWidth={3} />
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
