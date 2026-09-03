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
import { SELLER_DOC_STATES, type OrderStatus } from '@/lib/orders'

// Två flikar, samma indelning som adminpanelens affärslista så de två vyerna
// läser likadant. 'pending' hör till pågående: föremålet är på väg ut, det
// väntar bara på granskning. 'rejected' hör till avslutade, det blev aldrig
// någon auktion av det.
type Tab = 'open' | 'done' | 'docs'

const TAB_LABEL: Record<Tab, string> = {
  open: 'Pågående',
  done: 'Avslutade',
  docs: 'Mina underlag',
}

// Underlagsfliken går inte på föremålets status utan på affärens, se
// SELLER_DOC_STATES: handlingen redovisar en utbetalning och finns först när
// den är godkänd.
const TAB_MATCH: Record<'open' | 'done', (status: string) => boolean> = {
  open: (s) => s === 'pending' || s === 'active' || s === 'approved',
  done: (s) => s === 'closed' || s === 'rejected',
}

type SellerOrder = { id: string; item_id: string; status: string; amount: number; created_at: string }

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
  const [orderByItem, setOrderByItem] = useState<Record<string, SellerOrder>>({})
  const [loading, setLoading] = useState(true)
  const [relisting, setRelisting] = useState<string | null>(null)
  const [relistError, setRelistError] = useState('')
  const [tab, setTab] = useState<Tab>('open')

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
    // Föremål som lades ut innan ursprungsvalet fanns saknar source_type.
    // Databasspärren kräver det vid publicering, så vi fångar det här och
    // skickar säljaren till formuläret i stället för att visa ett SQL-fel.
    if (!item.source_type) {
      setRelisting(null)
      setRelistError(
        'Det här föremålet lades ut innan vi började fråga om ursprung. Lägg ut det via formuläret så fyller du i de uppgifter som behövs.'
      )
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
        // Bandet tillbaka till annonsen den lades ut från.
        relisted_from: item.id,
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

      // Statusen behövs för att veta om säljarens underlag finns än. Den
      // redovisar en utbetalning, se SELLER_DOC_STATES i lib/orders.
      const { data: orders } = await supabase
        .from('orders')
        .select('id, item_id, status, amount, created_at')
        .eq('seller_id', user.id)
      const map: Record<string, SellerOrder> = {}
      orders?.forEach((o: any) => (map[o.item_id] = o))
      setOrderByItem(map)

      setLoading(false)
    }
    load()
  }, [])

  // Öppna direkt på rätt flik när man kommer från en länk, t.ex. "Mina
  // underlag" i profilen.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t === 'done' || t === 'docs') setTab(t)
  }, [])

  // Vilka föremål har ersatts av en nyare annons. Säljaren äger båda raderna,
  // så uppgiften finns redan i listan och behöver ingen extra fråga.
  const replacedBy: Record<string, { id: string; status: string }> = {}
  items.forEach((i: any) => {
    if (i.relisted_from) replacedBy[i.relisted_from] = { id: i.id, status: i.status }
  })

  // Föremål med ett färdigt underlag, alltså där utbetalningen är godkänd.
  const docItems = items.filter((i: any) => {
    const o = orderByItem[i.id]
    return !!o && SELLER_DOC_STATES.includes(o.status as OrderStatus)
  })

  // Räknas ur hela listan, så antalen på flikarna stämmer oavsett vilken som
  // är vald.
  const listFor = (t: Tab) =>
    t === 'docs' ? docItems : items.filter((i: any) => TAB_MATCH[t](i.status))
  const shown = listFor(tab)

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

        {!loading && items.length > 0 && (
          <div className="flex flex-wrap gap-1 bg-white border border-espresso-100 p-1 rounded-xl w-fit max-w-full mb-6 shadow-soft">
            {(['open', 'done', 'docs'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t
                    ? 'bg-gold-sheen text-espresso-900 shadow-gold'
                    : 'text-espresso-500 hover:text-espresso-800'
                }`}
              >
                {TAB_LABEL[t]}
                <span className="ml-1.5 text-xs opacity-60 tabular-nums">{listFor(t).length}</span>
              </button>
            ))}
          </div>
        )}

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
        ) : tab === 'docs' ? (
          /* Underlagen samlade på ett ställe. De fanns redan, men bara som två
             små länkar under det enskilda föremålets kort, alltså bara för den
             som råkade leta på rätt rad. Det här är arkivet: en rad per affär
             som betalats ut, med belopp och datum, att visa eller ladda ner. */
          <div className="grid gap-3">
            {docItems.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-espresso-500 text-sm">Du har inga underlag än.</p>
                <p className="text-espresso-400 text-xs mt-1.5">
                  Underlaget skapas när vi betalat ut för ett sålt föremål.
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden divide-y divide-espresso-100">
                {docItems.map((item: any) => {
                  const o = orderByItem[item.id]
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-espresso-100 relative shrink-0">
                        {item.image_urls?.[0] && (
                          <Image src={item.image_urls[0]} alt={item.title} fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-espresso-900 truncate">{item.title}</p>
                        <p className="text-xs text-espresso-400">
                          {o?.amount ? `${o.amount.toLocaleString('sv-SE')} kr` : ''}
                          {o?.created_at
                            ? ` · ${new Date(o.created_at).toLocaleDateString('sv-SE')}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 shrink-0">
                        <Link
                          href={`/orders/${o.id}/invoice`}
                          className="text-xs text-gold-600 hover:text-gold-700 whitespace-nowrap"
                        >
                          Visa →
                        </Link>
                        <DownloadInvoiceButton
                          orderId={o.id}
                          label="Ladda ner (PDF)"
                          className="text-xs text-espresso-500 hover:text-espresso-800 disabled:opacity-50 whitespace-nowrap"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {shown.length === 0 && (
              <div className="card p-12 text-center text-espresso-400 text-sm">
                {tab === 'open'
                  ? 'Inga pågående föremål just nu.'
                  : 'Inga avslutade föremål än.'}
              </div>
            )}
            {shown.map((item) => {
              const s = STATUS_LABEL[item.status] || {
                label: item.status,
                color: 'bg-espresso-100 text-espresso-500',
              }
              const order = orderByItem[item.id]
              const orderId = order?.id
              // Underlaget redovisar en utbetalning, så det finns först när
              // utbetalningen är godkänd. Samma regel som i ordervyn, och den
              // bor i lib/orders så de två inte kan glida isär.
              const hasSellerDoc = !!order && SELLER_DOC_STATES.includes(order.status as OrderStatus)
              const clickable = item.status === 'active' || item.status === 'closed'
              // Se kommentaren vid knappen längre ner för varför just de två.
              const relistable =
                item.status === 'rejected' || (item.status === 'closed' && !item.accepted_bid_id)
              // Redan utlagd igen. Ersätter knappen, så samma föremål inte
              // läggs ut två gånger, och visar var det tog vägen.
              const replaced = replacedBy[item.id]
              const href = orderId ? `/orders/${orderId}` : `/auctions/${item.id}`
              const Wrapper: any = clickable ? Link : 'div'
              return (
                <div key={item.id} className="grid gap-1.5">
                <Wrapper
                  {...(clickable ? { href } : {})}
                  // min-w-0: kortet är ett grid-barn och måste kunna krympa
                  // till spårets bredd, annars skjuts högerkolumnen ut på
                  // mobil. Se adminvyn för mätningen.
                  className={`card p-4 flex gap-4 items-center min-w-0 ${clickable ? 'card-hover' : ''}`}
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
                  {/* Kvittot på förmedlingsuppdraget låg här förut. Det ligger nu
                      i adminpanelen, på användarens instruktion: säljaren har
                      redan godkänt villkoren vid registreringen och ser
                      uppdragstexten i formuläret när föremålet publiceras.
                      Handlingen är ett underlag för GuldBud, för revisor och
                      Skatteverket, inte något kunden behöver hämta. */}
                </Wrapper>
                {/* Säljaren får lägga ut igen i två lägen, och bara i dem.
                    'rejected' är ett föremål admin nekade, alltså en annons som
                    aldrig kom till auktion.
                    'closed' UTAN accepterat bud betyder att säljaren tackade nej
                    till högsta budet. Det är det enda läget efter en avslutad
                    auktion där föremålet får läggas ut igen.

                    Stängt MED accepterat bud är sålt och ger ingen knapp, inte
                    heller när affären senare avbryts: den avbrutna affären står
                    kvar med sitt accepterade bud, och att lägga ut föremålet
                    igen därifrån är ett adminbeslut, inte säljarens.

                    Auktionssidan lovade redan det här ("Du kan lägga ut det igen
                    från Mina föremål när du vill"), men knappen fanns bara för
                    'rejected'. Efter en omladdning hade säljaren ingen väg alls:
                    DeclineBid renderas bara så länge föremålet är öppet, så
                    knappen där försvann i samma stund som nejet sparades.

                    Knappen ligger under kortet, inte i det. Ett stängt föremål
                    har kortet som länk, och en knapp inuti en länk hade både
                    varit ogiltig HTML och navigerat bort vid klick. */}
                {relistable && !replaced && (
                  <div className="pl-1">
                    <button
                      onClick={() => relist(item)}
                      disabled={relisting === item.id}
                      className="text-xs text-gold-600 hover:text-gold-700 disabled:opacity-50"
                    >
                      {relisting === item.id ? 'Lägger ut...' : 'Lägg ut igen →'}
                    </button>
                  </div>
                )}
                {/* Den gamla annonsen är inte ett återvändsgränd när föremålet
                    redan ligger ute igen. Utan raden ser säljaren två rader med
                    samma titel, en avslutad och en pågående, utan att något
                    säger att det är samma föremål. */}
                {replaced && (
                  <p className="pl-1 text-xs text-espresso-400">
                    Utlagd igen.{' '}
                    {replaced.status === 'pending' ? (
                      <span>Den nya annonsen väntar på granskning.</span>
                    ) : (
                      <Link href={`/auctions/${replaced.id}`} className="text-gold-600 hover:text-gold-700">
                        Se den nya annonsen →
                      </Link>
                    )}
                  </p>
                )}
                {/* Säljarens försäljnings- och utbetalningsunderlag, både att
                    visa och att ladda ner. Nedladdningen fanns här redan, men
                    utan villkor, så den gick att hämta innan utbetalningen var
                    godkänd. Nu följer båda samma regel som ordervyn. */}
                {hasSellerDoc && orderId && (
                  <div className="pl-1 flex items-center gap-4">
                    <Link
                      href={`/orders/${orderId}/invoice`}
                      className="text-xs text-gold-600 hover:text-gold-700"
                    >
                      Visa underlag →
                    </Link>
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
