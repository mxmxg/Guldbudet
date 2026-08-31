// Delade definitioner för ursprungskontroll / AML. Trösklarna speglar
// triggern set_order_aml_status i supabase-schema.sql, håll dem i synk.

export const AML_SINGLE_THRESHOLD = 25000 // kr per affär
export const AML_CUMULATIVE_THRESHOLD = 50000 // kr sammanlagt, rullande 12 mån

export type AmlStatus = 'clear' | 'review' | 'approved' | 'flagged'

export const AML_STATUS_LABEL: Record<AmlStatus, string> = {
  clear: 'Godkänd automatiskt',
  review: 'Behöver granskas',
  approved: 'Granskad och godkänd',
  flagged: 'Flaggad',
}

export const AML_STATUS_STYLE: Record<AmlStatus, string> = {
  clear: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  review: 'bg-amber-100 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  flagged: 'bg-red-100 text-red-700 border border-red-200',
}

// Ursprungsalternativ. Vänligt formulerade, detta är en trygghets- och
// ägarbekräftelse för säljaren, inte ett förhör. Dubblar som fin
// annonsinfo (t.ex. arvguld).
export type SourceOption = { key: string; label: string }

export const SOURCE_OPTIONS: SourceOption[] = [
  { key: 'eget_smycke', label: 'Mitt eller familjens smycke' },
  { key: 'arv', label: 'Arv eller gåva' },
  { key: 'eget_kop', label: 'Köpt av mig själv' },
  { key: 'annat', label: 'Annat' },
]

export function sourceLabel(key: string | null | undefined): string {
  if (!key) return 'Ej angivet'
  return SOURCE_OPTIONS.find((o) => o.key === key)?.label || key
}
