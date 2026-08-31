'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { GULDBUD } from '@/lib/company'

// Kvitto på förmedlingsuppdraget för ett enskilt föremål. Adminvy.
//
// Uppdraget signeras aldrig separat. Säljaren godkänner villkoren vid
// registreringen, och villkoren bär uppdraget. När säljaren publicerar
// föremålet ÄR det instruktionen att förmedla, och den noteras på föremålet
// (mandate_accepted_at + terms_version).
//
// Handlingen är ett underlag för GuldBud, inte något säljaren behöver.
// Säljaren har redan godkänt villkoren när kontot skapades och ser
// uppdragstexten i formuläret när föremålet publiceras. Sidan låg tidigare
// under /customer och var länkad från "Mina föremål". Den flyttades hit på
// användarens instruktion: den ska tas fram när en revisor eller Skatteverket
// frågar hur förmedlingen gick till, inte visas för kunden.
//
// Detta är en yta i gränssnittet, inte en spärr. Säljaren äger raden i items
// och kommer åt sina egna uppgifter ändå via RLS. Poängen är att handlingen
// inte längre presenteras för kunden, inte att den är hemlig för hen.

function fmt(ts?: string | null) {
  if (!ts) return null
  return new Date(ts).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminMandatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)

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
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') {
      router.push('/')
      return
    }
    const { data: it } = await supabase.from('items').select('*').eq('id', params.id).single()
    if (!it) {
      router.push('/admin')
      return
    }
    // Säljarens uppgifter, inte adminens. Adminpolicyn på profiles ger
    // läsrätten.
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name, personal_number, address, postal_code, city, identity_verified')
      .eq('id', it.owner_id)
      .single()
    setItem(it)
    setSeller(prof)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-espresso-400">Hämtar uppdraget...</p>
        </div>
        <Footer />
      </div>
    )
  }

  const given = fmt(item.mandate_accepted_at) || fmt(item.created_at)
  const spec = [item.weight_grams ? `${item.weight_grams} g` : null, item.karat]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-cream">
      <div className="print:hidden">
        <Navbar />
      </div>

      <style>{`@media print { .no-print { display:none !important; } body { background:#fff; } }`}</style>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-4 no-print">
          <Link href="/admin" className="text-sm text-espresso-500 hover:text-espresso-800">
            Tillbaka till adminpanelen
          </Link>
          <button onClick={() => window.print()} className="btn-gold !py-2">
            Skriv ut / Spara som PDF
          </button>
        </div>

        <div className="bg-white border border-espresso-100 rounded-2xl p-8 sm:p-10 print:border-0 print:rounded-none">
          {/* Sidhuvud */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="font-sans font-semibold tracking-tight text-2xl text-espresso-900">GuldBud</p>
              <p className="text-xs text-espresso-400 mt-1">{GULDBUD.name}</p>
              <p className="text-xs text-espresso-400">Org.nr {GULDBUD.org}</p>
              <p className="text-xs text-espresso-400">{GULDBUD.box}</p>
              <p className="text-xs text-espresso-400">{GULDBUD.postal}</p>
              <p className="text-xs text-espresso-400">{GULDBUD.email}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-espresso-900 uppercase tracking-wide text-sm">
                Förmedlingsuppdrag
              </p>
              <p className="text-[11px] text-espresso-400">Kvitto på lämnat uppdrag</p>
              {given && <p className="text-xs text-espresso-400 mt-1">Lämnat: {given}</p>}
            </div>
          </div>

          <p className="text-sm text-espresso-600 mb-8">
            Denna handling dokumenterar det förmedlingsuppdrag säljaren lämnade till {GULDBUD.name} när
            föremålet nedan publicerades i tjänsten. Uppdraget följer av GuldBuds användarvillkor
            för säljare, som säljaren godkände vid registreringen.
          </p>

          {/* Registrerade uppgifter */}
          <p className="text-xs text-espresso-400 uppercase tracking-wide mb-2">Registrerade uppgifter</p>
          <div className="rounded-xl bg-espresso-50 px-5 py-4 mb-8">
            <dl className="text-sm space-y-1.5">
              <Row label="Säljare" value={seller?.full_name} />
              <Row label="Personnummer" value={seller?.personal_number} />
              <Row
                label="Adress"
                value={
                  [seller?.address, [seller?.postal_code, seller?.city].filter(Boolean).join(' ')]
                    .filter(Boolean)
                    .join(', ') || null
                }
              />
              <Row
                label="Identitet"
                value={seller?.identity_verified ? 'Verifierad med BankID' : 'Personnummer lämnat'}
              />
              <Row label="Föremål" value={[item.title, spec].filter(Boolean).join(' · ')} />
              <Row label="Objekts-id" value={item.id} mono />
              <Row label="Uppdraget lämnat" value={given} />
              <Row label="Godkända villkor" value={item.terms_version ? `Version ${item.terms_version}` : null} />
              <Row label="Förmedlare" value={`${GULDBUD.name}, org.nr ${GULDBUD.org}`} />
            </dl>
          </div>

          {/* Uppdragets innebörd */}
          <p className="text-xs text-espresso-400 uppercase tracking-wide mb-2">Uppdraget</p>
          <p className="text-sm text-espresso-700 mb-4">
            Säljaren har uppdragit åt GuldBud att förmedla försäljningen av föremålet{' '}
            <strong>i säljarens namn och för säljarens räkning</strong> till en av GuldBud godkänd
            handlare. GuldBud är inte köpare av föremålet, förvärvar inte äganderätten och säljer inte
            föremålet vidare för egen räkning.
          </p>
          <p className="text-sm text-espresso-700 mb-4">
            Äganderätten till föremålet tillkommer säljaren fram till dess att den övergår enligt
            köpeavtalet mellan säljaren och den köpande handlaren. Att föremålet skickas till GuldBud
            för kontroll innebär inte att äganderätten övergår till GuldBud.
          </p>

          <p className="text-xs text-espresso-400 uppercase tracking-wide mb-2 mt-8">
            GuldBuds åtaganden mot säljaren
          </p>
          <ul className="text-sm text-espresso-700 space-y-1.5 mb-8 list-disc pl-5">
            <li>tillvarata säljarens intresse och utföra uppdraget med omsorg,</li>
            <li>hålla säljaren underrättad om bud, accept, mottagande, kontroll och utbetalning,</li>
            <li>hålla säljarens medel åtskilda från GuldBuds egna medel fram till utbetalning,</li>
            <li>redovisa affären för säljaren genom det underlag som tillhandahålls i tjänsten,</li>
            <li>betala ut säljarens köpeskilling utan avdrag enligt villkoren,</li>
            <li>förvara föremålet aktsamt så länge det är i GuldBuds besittning,</li>
            <li>samt kostnadsfritt återlämna föremålet till säljaren om någon affär inte kommer till stånd.</li>
          </ul>

          <p className="text-xs text-espresso-400 leading-relaxed border-t border-espresso-100 pt-5">
            GuldBud tar inte ut provision eller annan avgift från säljaren. Säljaren har rätt till
            hela den köpeskilling som tillkommer denne enligt köpeavtalet mellan säljaren och
            handlaren. GuldBuds ersättning betalas av handlaren och är ekonomiskt skild från
            säljarens köpeskilling. Fullständiga villkor finns på{' '}
            <Link href="/terms" className="underline">
              guldbud.com/terms
            </Link>
            .
          </p>
        </div>

        <p className="text-[11px] text-espresso-300 text-center mt-4 no-print">
          Automatiskt genererad handling från GuldBud. Internt underlag, visas inte för säljaren.
        </p>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-espresso-400 flex-none">{label}</dt>
      <dd className={`text-espresso-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
