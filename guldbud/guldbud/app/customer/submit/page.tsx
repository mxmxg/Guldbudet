'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Image from 'next/image'

const KARAT_OPTIONS = ['24K / 999', '22K / 916', '18K / 750', '14K / 585', '9K / 375', 'Övrigt']

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

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles).slice(0, 6)
    setFiles(prev => [...prev, ...arr].slice(0, 6))
    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => [...prev, e.target!.result as string].slice(0, 6))
      reader.readAsDataURL(f)
    })
  }

  const removeImage = (i: number) => {
    setFiles(f => f.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length < 2) { setError('Ladda upp minst 2 bilder.'); return }
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Upload images
    const imageUrls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('item-images').upload(path, file)
      if (uploadError) { setError('Bilduppladdning misslyckades: ' + uploadError.message); setLoading(false); return }
      const { data } = supabase.storage.from('item-images').getPublicUrl(path)
      imageUrls.push(data.publicUrl)
    }

    // Insert item
    const { error: insertError } = await supabase.from('items').insert({
      owner_id: user.id,
      title, description, karat,
      weight_grams: parseFloat(weight),
      min_price: minPrice ? parseInt(minPrice) : null,
      image_urls: imageUrls,
      status: 'pending',
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-lg mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
        <h1 className="text-xl font-medium mb-3">Förfrågan mottagen!</h1>
        <p className="text-stone-500 mb-6">Vi granskar ditt föremål och öppnar budgivningen inom 24 timmar. Du får ett e-postmeddelande när det är klart.</p>
        <button onClick={() => { setSuccess(false); setFiles([]); setPreviews([]); setTitle(''); setDescription(''); setWeight(''); setKarat(''); setMinPrice('') }}
          className="btn-gold">Lägg ut ett till</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-medium text-stone-900 mb-2">Lägg ut ett guldföremål</h1>
        <p className="text-stone-500 text-sm mb-8">Fyll i uppgifter och ladda upp foton. Auktoriserade guldhandlare budar direkt – du väljer det bästa budet.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Foton <span className="text-stone-400 font-normal">(minst 2, max 6)</span>
            </label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200">
                  <Image src={src} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center">×</button>
                </div>
              ))}
              {previews.length < 6 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-stone-200 hover:border-gold-400 flex flex-col items-center justify-center text-stone-400 hover:text-gold-500 transition">
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-xs">Lägg till bild</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
            <p className="text-xs text-stone-400">Tips: framsida, baksida, stämpel/punsstämpel och eventuella skador.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Typ av föremål</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="t.ex. Guldring, Halskedja, Guldmynt" className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Vikt (gram)</label>
              <input type="number" required step="0.1" min="0.1" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="t.ex. 12.5" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Karat / Finhet</label>
              <select required value={karat} onChange={e => setKarat(e.target.value)} className="w-full">
                <option value="">Välj...</option>
                {KARAT_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Minimipris i SEK <span className="text-stone-400 font-normal">(valfritt)</span>
            </label>
            <input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              placeholder="Lämna tomt för att acceptera alla bud" className="w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Beskrivning</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Beskriv föremålet – ålder, ursprung, skick, gravyr eller annan info handlarna bör känna till."
              className="w-full" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-gold mt-2">
            {loading ? 'Skickar in...' : 'Skicka in förfrågan'}
          </button>
        </form>
      </div>
    </div>
  )
}
