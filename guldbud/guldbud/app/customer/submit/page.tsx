'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { KARAT_OPTIONS, estimateRange, formatSEK, isPlatinum } from '@/lib/gold'
import { useGoldPrice } from '@/lib/useGoldPrice'
import { BANKID_LIVE } from '@/lib/identity'
import { CATEGORIES, GEMSTONES } from '@/lib/catalog'
import { SOURCE_OPTIONS } from '@/lib/aml'
import { TERMS_VERSION } from '@/lib/terms'
import { CheckIcon } from '@/components/Icons'

export default function SubmitPage() {
  // 24K-priset per gram, live. Faller tillbaka på riktvärdet i lib/gold
  // tills /api/gold-price svarat.
  const { price: spot } = useGoldPrice()
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
  const [sourceType, setSourceType] = useState('')
  const [ownershipAttested, setOwnershipAttested] = useState(false)
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
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('role, identity_verified, personal_number, address, postal_code, city, payout_swish, payout_bank_clearing, payout_bank_account')
        .eq('id', user.id)
        .single()
      if (prof?.role !== 'customer') {
        router.push('/')
        return
      }
      // Hård identitetsgrind före listning: när BankID är skarpt krävs verifierad
      // identitet, annars kan konton med bara e-post lägga upp fejkannonser.
      const bankidLive = BANKID_LIVE
      if (bankidLive && !prof?.identity_verified) {
        router.push('/verifiering')
        return
      }
      // Säljaren måste ha en komplett profil innan listning: identitet
      // (personnummer som interim tills BankID är skarpt), leveransadress (dit vi
      // skickar det förbetalda kuvertet) och utbetalningsuppgifter. Uppgifterna
      // samlas här i stället för vid registreringen, där de sänkte konverteringen.
      const addressOk = !!(prof?.address && prof?.postal_code && prof?.city)
      const payoutOk = !!(prof?.payout_swish || (prof?.payout_bank_clearing && prof?.payout_bank_account))
      const identityOk = bankidLive ? !!prof?.identity_verified : !!prof?.personal_number
      if (!addressOk || !payoutOk || !identityOk) {
        router.push('/customer/profile?from=submit')
        return
      }
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const est = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || !karat) return null
    return estimateRange(w, karat, spot)
  }, [weight, karat, spot])

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

  // Skala ner och normalisera bilden till JPEG i webbläsaren innan uppladdning.
  // Stora telefonfoton (flera MB) blir små utan synlig kvalitetsförlust (2560px
  // längsta sida räcker även för fullskärm/zoom, kvalitet 0.92), och HEIC från
  // iPhone blir en renderbar JPEG. imageOrientation bakar in EXIF-rotationen så
  // liggande/stående blir rätt.
  //
  // Går avkodningen inte igenom (t.ex. HEIC i en webbläsare som saknar stöd)
  // laddas originalet upp orört. Uppladdningen får ALDRIG blockeras: säljaren
  // ska kunna fota direkt med mobilen och bli klar, utan att först spara om
  // bilden i ett annat format.
  //
  // Att stora original tidigare var dyra berodde på att bildtransformeringen
  // var avstängd, så lagrad storlek var samma sak som levererad storlek. Med
  // transformeringen påslagen är de frikopplade: originalet kan vara stort
  // medan rutnätet får en nedskalad WebP. Lagring är inte flaskhalsen.
  const prepareForUpload = async (file: File): Promise<{ data: Blob; ext: string }> => {
    const MAX_EDGE = 2560
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(bitmap, 0, 0, w, h)
      bitmap.close?.()
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      )
      if (!blob) throw new Error('toBlob gav null')
      return { data: blob, ext: 'jpg' }
    } catch {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      return { data: file, ext }
    }
  }

  const suggestWithAI = async () => {
    if (files.length === 0) return
    setAiLoading(true)
    setAiError('')
    try {
      // Skicka upp till 3 bilder så AI:n kan avgöra typ från flera vinklar.
      const dataUrls = await Promise.all(files.slice(0, 3).map((f) => fileToDataUrl(f)))
      // Skicka access-token så endpointen kan kräva inloggad användare (skyddar
      // den betalda AI-modellen mot anonymt missbruk).
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch('/api/suggest-listing', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
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
    if (!sourceType) {
      setError('Välj hur du fick föremålet.')
      return
    }
    if (!ownershipAttested) {
      setError('Bekräfta att föremålet är ditt att sälja.')
      return
    }
    setLoading(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      setLoading(false)
      router.push('/auth/login')
      return
    }

    const imageUrls: string[] = []
    for (const file of files) {
      let fileData: Blob
      let ext: string
      try {
        // Normalfallet kastar aldrig: går bilden inte att behandla laddas
        // originalet upp orört. Skulle något oväntat ändå gå fel ska formuläret
        // inte fastna i laddläge, så felet fångas och visas.
        ;({ data: fileData, ext } = await prepareForUpload(file))
      } catch (err: any) {
        setError(err?.message || 'Bilden kunde inte behandlas. Försök igen.')
        setLoading(false)
        return
      }
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        // Ett års cache: filnamnet är unikt per uppladdning, så bilden ändras
        // aldrig. Återbesökare slipper ladda om den (PageSpeed: cache-livslängd).
        .upload(path, fileData, {
          contentType: fileData.type || 'image/jpeg',
          cacheControl: '31536000',
        })
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
      source_type: sourceType,
      ownership_attested_at: new Date().toISOString(),
      // Förmedlingsuppdraget. Villkoren som säljaren godkände vid
      // registreringen bär uppdraget, och publiceringen är instruktionen att
      // förmedla. Vi noterar när den lämnades och vilken lydelse som gällde,
      // så uppdragskvittot kan renderas korrekt även efter att villkoren
      // ändrats. Ingen separat signering behövs.
      mandate_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
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
          <h1 className="font-display text-3xl text-espresso-900 mb-3">Föremålet är inskickat</h1>
          <p className="text-espresso-500 mb-8 leading-relaxed">
            Vi granskar det snabbt och öppnar budgivningen inom ett par timmar. Vi mejlar dig
            så fort auktionen är live.
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
          <h1 className="font-display text-3xl sm:text-4xl text-espresso-900">Lägg ut ett föremål</h1>
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
                    <Image src={src} alt="" fill sizes="(max-width: 640px) 33vw, 240px" className="object-contain" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 chip bg-espresso-900/80 text-gold-200 !text-[10px] !px-1.5 !py-0.5">
                        Huvudbild
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Ta bort bild ${i + 1}`}
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
                <select required value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kategori" className="w-full">
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
                  aria-label="Namn på föremålet"
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
                  aria-label="Vikt i gram"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Guldets karat / finhet</label>
                <select required value={karat} onChange={(e) => setKarat(e.target.value)} aria-label="Guldets karat eller finhet" className="w-full">
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
                    <select value={gemstone} onChange={(e) => setGemstone(e.target.value)} aria-label="Typ av sten" className="w-full">
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
                      aria-label="Stenens vikt i carat"
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
                aria-label="Reservationspris i kronor (valfritt)"
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
                aria-label="Beskrivning"
                className="w-full"
              />
            </div>

            {/* Ägarbekräftelse – trygghet, inte förhör. Enkelt val + intyg. */}
            <div className="rounded-2xl border border-gold-200/70 bg-gold-50/40 p-5">
              <div className="flex items-center gap-2 mb-1">
                <CheckIcon size={16} />
                <p className="text-sm font-medium text-espresso-800">Bara en snabb bekräftelse</p>
              </div>
              <p className="text-xs text-espresso-500 mb-4 leading-relaxed">
                För allas trygghet säljer vi bara guld med känt ursprung. Det tar tre sekunder.
              </p>

              <div className="mb-3">
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">
                  Hur kom du över föremålet?
                </label>
                <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="w-full">
                  <option value="">Välj...</option>
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ownershipAttested}
                  onChange={(e) => setOwnershipAttested(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-espresso-600 leading-relaxed">
                  Jag intygar att föremålet är min egendom och lagligt införskaffat.
                </span>
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>
            )}

            <div className="space-y-2">
              <button type="submit" disabled={loading} className="btn-gold">
                {loading ? 'Lägger ut...' : 'Lägg ut föremålet'}
              </button>
              {/* Förmedlingsuppdraget bor i villkoren som säljaren godkände vid
                  registreringen. Publiceringen är instruktionen, så ingen ny
                  kryssruta behövs, bara att det sägs rakt ut. */}
              <p className="text-xs text-espresso-400 max-w-md">
                När du publicerar ger du GuldBud i uppdrag att sälja föremålet åt dig enligt{' '}
                <Link href="/terms" className="underline hover:text-espresso-600">villkoren</Link>.
              </p>
            </div>
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
                        : 'Riktvärde utifrån dagens guldpris. Handlarna budar i konkurrens, så slutpriset kan bli högre.'}
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
