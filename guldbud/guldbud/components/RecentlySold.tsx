import Link from 'next/link'
import Image from 'next/image'
import CategoryIcon from '@/components/CategoryIcon'
import { formatSEK } from '@/lib/gold'

export type SoldRow = {
  id: string
  title: string
  category?: string | null
  weight_grams?: number | null
  karat?: string | null
  image_urls?: string[] | null
  price: number
  accepted_at?: string | null
}

// Deterministiskt (bara från datat, ingen Date.now()) → ingen hydration-mismatch.
function soldDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export default function RecentlySold({ rows }: { rows: SoldRow[] }) {
  if (!rows || rows.length === 0) return null
  return (
    <section className="border-t border-espresso-100 bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-espresso-900">Avslutade auktioner</h2>
            <p className="text-sm text-espresso-500 mt-1.5">
              Riktiga slutpriser från avslutad budgivning. Konkurrensen mellan handlare avgör priset.
            </p>
          </div>
          <Link
            href="/resultat"
            className="text-sm font-medium text-gold-700 hover:text-gold-800 shrink-0 whitespace-nowrap"
          >
            Se alla resultat →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {rows.map((r) => {
            const date = soldDate(r.accepted_at)
            const specs = [r.weight_grams ? `${r.weight_grams} g` : '', r.karat].filter(Boolean).join(' · ')
            return (
              <Link
                key={r.id}
                href={`/auctions/${r.id}`}
                className="group rounded-2xl overflow-hidden bg-white border border-espresso-100 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Enhetlig bildruta, object-cover fyller rutan så alla foton ser lika premium ut */}
                <div className="aspect-square relative overflow-hidden bg-espresso-100">
                  {r.image_urls?.[0] ? (
                    <Image
                      src={r.image_urls[0]}
                      alt={r.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gold-600/40 bg-gradient-to-br from-espresso-800 to-espresso-950">
                      <CategoryIcon category={r.category || undefined} size={34} strokeWidth={1.3} />
                    </div>
                  )}
                  {/* Mörk botten-gradient så texten/etiketten alltid syns */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-espresso-950/70 to-transparent" />
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-espresso-950/80 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-gold-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    Såld{date ? ` · ${date}` : ''}
                  </span>
                </div>

                <div className="p-3.5">
                  <p className="text-sm font-medium text-espresso-900 truncate group-hover:text-gold-700 transition">
                    {r.title}
                  </p>
                  {specs && <p className="text-xs text-espresso-400 mt-0.5">{specs}</p>}
                  <div className="mt-2.5 pt-2.5 border-t border-espresso-100">
                    <p className="text-[10px] uppercase tracking-wider text-espresso-400">Slutpris</p>
                    <p className="font-display text-xl sm:text-2xl text-gradient-gold tabular-nums leading-tight mt-0.5">
                      {formatSEK(r.price)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
