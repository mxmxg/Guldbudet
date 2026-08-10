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

export default function RecentlySold({ rows }: { rows: SoldRow[] }) {
  if (!rows || rows.length === 0) return null
  return (
    <section className="border-t border-espresso-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow text-gold-600/80 mb-1">Avslutade auktioner</p>
            <h2 className="font-display text-2xl text-espresso-900">Nyligen sålt</h2>
            <p className="text-sm text-espresso-500 mt-1">Riktiga slutpriser från avslutad budgivning.</p>
          </div>
          <Link href="/resultat" className="text-sm text-gold-600 hover:text-gold-700 shrink-0">
            Se alla resultat →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((r) => (
            <Link key={r.id} href={`/auctions/${r.id}`} className="card card-hover overflow-hidden group">
              <div className="aspect-[4/3] bg-gradient-to-br from-espresso-900 to-espresso-800 relative">
                {r.image_urls?.[0] ? (
                  <Image src={r.image_urls[0]} alt={r.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gold-500/60">
                    <CategoryIcon category={r.category || undefined} size={30} strokeWidth={1.4} />
                  </div>
                )}
                <span className="absolute top-2 left-2 chip bg-espresso-900/85 text-gold-200 text-[11px]">Såld</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-espresso-900 truncate group-hover:text-gold-700 transition">
                  {r.title}
                </p>
                <p className="text-xs text-espresso-400 mt-0.5">
                  {[r.weight_grams ? `${r.weight_grams} g` : '', r.karat].filter(Boolean).join(' · ')}
                </p>
                <p className="font-display text-lg text-gradient-gold tabular-nums mt-1.5">{formatSEK(r.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
