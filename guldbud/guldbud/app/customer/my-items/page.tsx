'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { GemIcon } from '@/components/Icons'
import InviteFriend from '@/components/InviteFriend'
import DownloadInvoiceButton from '@/components/DownloadInvoiceButton'
import PendingApprovalBanner from '@/components/PendingApprovalBanner'
import { TERMS_VERSION } from '@/lib/terms'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Väntar på granskning', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Godkänd', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Auktion pågår', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Avslutad', color: 'bg-espresso-100 text-espresso-500' },
  rejected: { label: 'Avvisad', color: 'bg-red-100 text-red-600' },
}

export default function MyItemsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [orderByItem, setOrderByItem] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [relisting, setRelisting] = useState<string | null>(null)
  const [relistError, setRelistError] = useState('')

  const relist = async (item: any) => {
    setRelisting(item.id)
    setRelistError('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push('/auth/login')
      return
    }
    const { data: created, error } = await supabase
      .from('items')
      .insert({
        owner_id: user.id,
        title: item.title,
        category: item.category,
        description: item.description,
        karat: item.karat,
        weight_grams: item.weight_grams,
        diamond_carat: item.diamond_carat,
        gemstone: item.gemstone,
        min_price: item.min_price,
        image_urls: item.image_urls,
        // Ursprunget följer med föremålet, det ändras inte av att annonsen görs om.
        source_type: item.source_type,
        source_note: item.source_note,
        // Att lägga ut igen är en ny publicering, alltså ett nytt ägarintyg och ett
        // nytt förmedlingsuppdrag under den lydelse som gäller idag. Utan de här
        // fälten skulle uppdragskvittot sakna version och adminpanelen visa att
        // ägarintyget saknas.
        ownership_attested_at: new Date().toISOString(),
        mandate_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        status: 'pending',
      })
      .select('*')
      .single()
    setRelisting(null)
    if (error) {
      setRelistError('Kunde inte lägga ut föremålet igen: ' + error.message)
      return
    }
    if (created) setItems((prev) => [created, ...prev])
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setItems(data || [])

      const { data: orders } = await supabase.from('orders').select('id, item_id').eq('seller_id', user.id)
      const map: Record<string, string> = {}
      orders?.forEach((o: any) => (map[o.item_id] = o.id))
      setOrderByItem(map)

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-espresso-900">Mina föremål</h1>
          </div>
          <Link href="/customer/submit" className="btn-gold">
            + Lägg ut nytt
          </Link>
        </div>

        {relistError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">{relistError}</div>
        )}

        <PendingApprovalBanner />

        {loading ? (
          <div className="grid gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 rounded-2xl skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-50 text-gold-500 flex items-center justify-center mx-auto mb-4 animate-float">
              <GemIcon size={30} strokeWidth={1.2} />
            </div>
            <p className="text-espresso-500 mb-5">Du har inte lagt ut några föremål ännu.</p>
            <Link href="/customer/submit" className="btn-gold">
              Lägg ut ditt första föremål
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const s = STATUS_LABEL[item.status] || {
                label: item.status,
                color: 'bg-espresso-100 text-espresso-500',
              }
              const orderId = orderByItem[item.id]
              const clickable = item.status === 'active' || item.status === 'closed'
              const href = orderId ? `/orders/${orderId}` : `/auctions/${item.id}`
              const Wrapper: any = clickable ? Link : 'div'
              return (
                <div key={item.id} className="grid gap-1.5">
                <Wrapper
                  {...(clickable ? { href } : {})}
                  className={`card p-4 flex gap-4 items-center ${clickable ? 'card-hover' : ''}`}
                >
                  <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-espresso-800 to-espresso-600 relative">
                    {item.image_urls?.[0] && (
                      <Image src={item.image_urls[0]} alt={item.title} fill sizes="80px" className="object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-espresso-900">{item.title}</h3>
                      <span className={`chip ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-espresso-400 mb-1.5">
                      {item.category ? `${item.category} · ` : ''}{item.weight_grams} g · {item.karat}
                      {item.gemstone ? ` · ${item.gemstone}` : ''}
                    </p>
                    {item.min_price && (
                      <p className="text-xs text-espresso-500">
                        Reservationspris: {item.min_price.toLocaleString('sv-SE')} kr
                      </p>
                    )}
                    <p className="text-[11px] text-espresso-300 mt-1">
                      {new Date(item.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  {clickable && (
                    <span className="text-sm text-gold-600 shrink-0 hidden sm:inline">
                      {orderId ? 'Följ affären →' : 'Se auktion →'}
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <Link
                      href={`/customer/items/${item.id}/edit`}
                      className="text-sm text-gold-600 hover:text-gold-700 shrink-0 whitespace-nowrap"
                    >
                      Redigera →
                    </Link>
                  )}
                  {/* Kvitto på förmedlingsuppdraget. Finns för allt som faktiskt
                      lagts ut, alltså inte för avvisade föremål. */}
                  {item.status !== 'rejected' && (
                    <Link
                      href={`/customer/items/${item.id}/uppdrag`}
                      className="text-sm text-espresso-400 hover:text-gold-600 shrink-0 whitespace-nowrap"
                    >
                      Uppdrag →
                    </Link>
                  )}
                  {item.status === 'rejected' && (
                    <button
                      onClick={() => relist(item)}
                      disabled={relisting === item.id}
                      className="text-sm text-gold-600 hover:text-gold-700 shrink-0 whitespace-nowrap disabled:opacity-50"
                    >
                      {relisting === item.id ? '...' : 'Lägg ut igen →'}
                    </button>
                  )}
                </Wrapper>
                {orderId && (
                  <div className="pl-1">
                    <DownloadInvoiceButton
                      orderId={orderId}
                      label="Ladda ner underlag (PDF)"
                      className="text-xs text-espresso-500 hover:text-espresso-800 disabled:opacity-50"
                    />
                  </div>
                )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-8">
            <InviteFriend />
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
