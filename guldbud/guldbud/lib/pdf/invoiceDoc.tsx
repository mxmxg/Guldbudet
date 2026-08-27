/* Server-only. Renders the GuldBud documents as a real PDF using
 * @react-pdf/renderer, mirroring app/orders/[id]/invoice/page.tsx exactly:
 *   - receipt: säljarens försäljnings- och utbetalningsunderlag
 *   - invoice: handlarens inköpsnota (privatpersonen som säljare) + GuldBuds faktura
 * Numbers come from lib/fees so screen and PDF never drift apart.
 */
import React from 'react'
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import {
  DEALER_COMMISSION_LABEL,
  SHIPPING_FEE_EX_VAT,
  SHIPPING_FEE_VAT,
  commission,
  commissionVat,
  guldbudServiceTotal,
  dealerTotal,
} from '@/lib/fees'

export const GULDBUD = {
  name: 'GuldBud AB',
  org: '559291-4781',
  vat: 'SE559291478101',
  email: 'info@guldbud.com',
  box: 'Box 6007',
  postal: '102 31 Stockholm',
}

export type InvoiceParty = {
  company_name?: string | null
  full_name?: string | null
  org_number?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
}
export type InvoiceSeller = {
  full_name?: string | null
  personal_number?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
}
export type InvoiceData = {
  kind: 'invoice' | 'receipt'
  order: {
    id: string
    order_no?: number | null
    amount: number
    created_at: string
    refunded_at?: string | null
    refund_reason?: string | null
  }
  item: { title?: string | null; weight_grams?: number | null; karat?: string | null } | null
  party: InvoiceParty | null
  seller: InvoiceSeller | null
}

export function ref(orderNo?: number | null) {
  return 'GB-' + String(orderNo ?? 0).padStart(6, '0')
}
// Två decimaler, med vanligt mellanslag som tusentalsavgränsare (Helvetica i
// react-pdf klarar inte alla smala no-break spaces sv-SE annars använder).
function kr2(n: number) {
  const s = n
    .toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/ | /g, ' ')
  return s + ' kr'
}

const C = {
  ink: '#3a2c17',
  ink900: '#241a0c',
  muted: '#8a7a5f',
  faint: '#b8a887',
  line: '#e7ddca',
  line2: '#d9cbb0',
  panel: '#f7f2e7',
}

const s = StyleSheet.create({
  page: { paddingVertical: 46, paddingHorizontal: 46, fontSize: 10, color: C.ink, fontFamily: 'Helvetica' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.ink900 },
  small: { fontSize: 8.5, color: C.faint, marginTop: 1.5 },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.ink900, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.6 },
  docSub: { fontSize: 8.5, color: C.faint, textAlign: 'right', marginTop: 2 },
  metaLine: { fontSize: 8.5, color: C.muted, textAlign: 'right', marginTop: 1.5 },
  partiesRow: { flexDirection: 'row', marginBottom: 22 },
  partyCol: { flex: 1, paddingRight: 14 },
  label: { fontSize: 8, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  partyName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.ink900 },
  partyLine: { fontSize: 9.5, color: C.muted, marginTop: 1.5 },
  panel: { backgroundColor: C.panel, borderRadius: 6, padding: 12, marginBottom: 18 },
  panelText: { fontSize: 9, color: C.ink, lineHeight: 1.5 },
  thead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.line2, paddingBottom: 6, marginBottom: 2 },
  th: { fontSize: 8.5, color: C.faint },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 6 },
  rowPlain: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  cellLabel: { fontSize: 10, color: C.ink },
  cellValue: { fontSize: 10, color: C.ink900 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line2, paddingTop: 9, marginTop: 2 },
  totalLabel: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.ink900 },
  totalValue: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.ink900 },
  fine: { fontSize: 8.5, color: C.muted, lineHeight: 1.5, marginTop: 14 },
  footer: { position: 'absolute', bottom: 26, left: 46, right: 46, textAlign: 'center', fontSize: 8, color: C.faint },
}) as any

function Head({ title, sub, order, date, showVat }: { title: string; sub: string; order: InvoiceData['order']; date: string; showVat?: boolean }) {
  return (
    <View style={s.headRow}>
      <View>
        <Text style={s.brand}>GuldBud</Text>
        <Text style={s.small}>{GULDBUD.name}</Text>
        <Text style={s.small}>Org.nr {GULDBUD.org}</Text>
        {showVat ? <Text style={s.small}>Momsnr {GULDBUD.vat}</Text> : null}
        <Text style={s.small}>{GULDBUD.box}</Text>
        <Text style={s.small}>{GULDBUD.postal}</Text>
        <Text style={s.small}>{GULDBUD.email}</Text>
      </View>
      <View>
        <Text style={s.docTitle}>{title}</Text>
        <Text style={s.docSub}>{sub}</Text>
        <Text style={s.metaLine}>Nr: {ref(order.order_no)}</Text>
        <Text style={s.metaLine}>Datum: {date}</Text>
      </View>
    </View>
  )
}

function PartyCol({ label, party }: { label: string; party: InvoiceParty | null }) {
  const name = party?.company_name || party?.full_name || '-'
  const addr = party?.address || party?.city
    ? `${party?.address || ''}${party?.postal_code || party?.city ? `, ${party?.postal_code || ''} ${party?.city || ''}` : ''}`
    : null
  return (
    <View style={s.partyCol}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.partyName}>{name}</Text>
      {party?.company_name && party?.full_name ? <Text style={s.partyLine}>{party.full_name}</Text> : null}
      {party?.org_number ? <Text style={s.partyLine}>Org.nr {party.org_number}</Text> : null}
      {addr ? <Text style={s.partyLine}>{addr}</Text> : null}
    </View>
  )
}

function SellerCol({ seller }: { seller: InvoiceSeller | null }) {
  const addr = seller?.address || seller?.city
    ? `${seller?.address || ''}${seller?.postal_code || seller?.city ? `, ${seller?.postal_code || ''} ${seller?.city || ''}` : ''}`
    : null
  return (
    <View style={s.partyCol}>
      <Text style={s.label}>Säljare (privatperson)</Text>
      {seller ? (
        <>
          <Text style={s.partyName}>{seller.full_name || '-'}</Text>
          {seller.personal_number ? <Text style={s.partyLine}>Personnr {seller.personal_number}</Text> : null}
          {addr ? <Text style={s.partyLine}>{addr}</Text> : null}
        </>
      ) : (
        <Text style={s.partyLine}>Privatperson</Text>
      )}
    </View>
  )
}

function Row({ label, value, plain }: { label: string; value: string; plain?: boolean }) {
  return (
    <View style={plain ? s.rowPlain : s.row}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{value}</Text>
    </View>
  )
}
function Total({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.totalRow}>
      <Text style={s.totalLabel}>{label}</Text>
      <Text style={s.totalValue}>{value}</Text>
    </View>
  )
}

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const { kind, order, item, party, seller } = data
  const credit = kind === 'invoice' && !!order.refunded_at
  const date = new Date(order.created_at).toLocaleDateString('sv-SE')
  const bid = order.amount
  const neg = (str: string) => (credit ? '-' : '') + str
  const itemSpec = `${item?.weight_grams ?? ''} g · ${item?.karat ?? ''}`

  if (kind === 'receipt') {
    return (
      <Document>
        <Page size="A4" style={s.page}>
          <Head title="Försäljnings- och utbetalningsunderlag" sub="Underlag för din försäljning" order={order} date={date} />
          <View style={s.partiesRow}>
            <PartyCol label="Utbetalas till" party={party} />
          </View>
          <Row label={`Vara: ${item?.title || 'Föremål'}`} value={itemSpec} plain />
          <Row label="Försäljningspris" value={kr2(bid)} />
          <Total label="Utbetalt till dig" value={kr2(bid)} />
          <Text style={s.fine}>
            {order.refunded_at
              ? `Affären återgick: föremålet godkändes inte vid äkthetskontroll${order.refund_reason ? ` (${order.refund_reason})` : ''}, och försäljningen genomfördes inte.`
              : `Du får hela försäljningspriset. GuldBud har inte gjort något avdrag från ditt belopp. Som privatperson lägger du ingen moms på försäljning av dina egna begagnade föremål. Förmedlat av ${GULDBUD.name} (org.nr ${GULDBUD.org}). Referens: ${ref(order.order_no)}.`}
          </Text>
          <Text style={s.footer} fixed>Automatiskt genererat dokument från GuldBud. Vid frågor, kontakta {GULDBUD.email}.</Text>
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      {/* Dok 1: inköpsnota */}
      <Page size="A4" style={s.page}>
        <Head title="Inköpsunderlag" sub="Köp av föremål från privatperson" order={order} date={date} />
        <View style={s.partiesRow}>
          <PartyCol label="Köpare" party={party} />
          <SellerCol seller={seller} />
        </View>
        <View style={s.panel}>
          <Text style={s.label}>Förmedlare</Text>
          <Text style={s.panelText}>
            {GULDBUD.name}, org.nr {GULDBUD.org}. GuldBud har förmedlat affären mellan säljaren och köparen och är inte part i köpet av föremålet.
          </Text>
        </View>
        <Row label={`Vara: ${item?.title || 'Föremål'}`} value={itemSpec} plain />
        <Total label={credit ? 'Inköpspris (återgått)' : 'Inköpspris'} value={neg(kr2(bid))} />
        <Text style={s.fine}>
          {credit
            ? `Inköpet har återgått. Föremålet godkändes inte vid äkthetskontroll${order.refund_reason ? ` (${order.refund_reason})` : ''} och affären krediteras i sin helhet.`
            : `Säljaren är privatperson och försäljningen är inte momsbelagd, ingen moms tas ut på föremålet. Affären är förmedlad av ${GULDBUD.name} (org.nr ${GULDBUD.org}), som inte är part i själva köpet. Referens: ${ref(order.order_no)}. Detta underlag styrker ditt inköp av föremålet från säljaren ovan.`}
        </Text>
        <Text style={s.footer} fixed>Automatiskt genererat dokument från GuldBud. Vid frågor, kontakta {GULDBUD.email}.</Text>
      </Page>

      {/* Dok 2: GuldBuds faktura */}
      <Page size="A4" style={s.page}>
        <Head
          title={credit ? 'Kreditfaktura' : 'Faktura'}
          sub={credit ? `Kreditering av faktura ${ref(order.order_no)}` : 'GuldBuds förmedlingstjänst'}
          order={order}
          date={date}
          showVat
        />
        <View style={s.partiesRow}>
          <PartyCol label="Faktureras" party={party} />
        </View>
        <View style={s.thead}>
          <Text style={[s.th, { flex: 1 }]}>Beskrivning</Text>
          <Text style={s.th}>Belopp exkl moms</Text>
        </View>
        <Row label={`Förmedlingsprovision ${DEALER_COMMISSION_LABEL}`} value={neg(kr2(commission(bid)))} />
        <Row label="Frakt" value={neg(kr2(SHIPPING_FEE_EX_VAT))} />
        <Row label="Summa exkl moms" value={neg(kr2(commission(bid) + SHIPPING_FEE_EX_VAT))} />
        <Row label="Moms 25%" value={neg(kr2(commissionVat(bid) + SHIPPING_FEE_VAT))} />
        <Total label={credit ? 'Att återbetala' : 'Att betala till GuldBud'} value={neg(kr2(guldbudServiceTotal(bid)))} />
        <Text style={s.fine}>
          Avser GuldBuds förmedlingstjänst (provision + frakt). Föremålets pris ({kr2(bid)}) faktureras separat enligt inköpsunderlaget och tillfaller säljaren.{' '}
          {credit ? '' : `Handlaren betalar hela affären som en summa: ${kr2(dealerTotal(bid))} (föremål ${kr2(bid)} + denna faktura ${kr2(guldbudServiceTotal(bid))}). `}
          Referens: {ref(order.order_no)}.
        </Text>
        <Text style={s.footer} fixed>Automatiskt genererat dokument från GuldBud. Vid frågor, kontakta {GULDBUD.email}.</Text>
      </Page>
    </Document>
  )
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />)
}
