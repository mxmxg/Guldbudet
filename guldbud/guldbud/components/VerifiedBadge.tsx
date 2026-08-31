import Link from 'next/link'
import { CheckIcon, ShieldIcon } from '@/components/Icons'

// Ett enda verifieringsmärke, återanvänt överallt.
//
// Ligger i en egen komponent för att märket ska se likadant ut på varje yta.
// Ett märke som ritas om lite olika på varje sida slutar betyda något: poängen
// är att en användare känner igen det direkt.
//
// Märket säger EN sak: den här personen har legitimerat sig med BankID. Det ska
// inte blandas ihop med att en handlare är godkänd av admin, vilket är ett annat
// beslut. Handlarprofilen visade tidigare "Verifierad handlare" enbart baserat
// på adminens godkännande, alltså utan att någon legitimerat sig.
//
// tone: 'dark' för de mörka espresso-headerna, 'light' för kort på cream.

export default function VerifiedBadge({
  verified,
  tone = 'light',
  label,
  unverifiedLabel = 'Inte legitimerad',
  href,
  className = '',
}: {
  verified: boolean
  tone?: 'dark' | 'light'
  /** Texten när användaren är verifierad. Default passar båda rollerna. */
  label?: string
  /** Texten när den inte är det. */
  unverifiedLabel?: string
  /** Gör det overifierade märket klickbart, typiskt till /verifiering. */
  href?: string
  className?: string
}) {
  if (verified) {
    const styles =
      tone === 'dark'
        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    return (
      <span className={`chip inline-flex items-center gap-1.5 ${styles} ${className}`} title="Legitimerad med BankID">
        <ShieldIcon size={13} strokeWidth={2.2} />
        <CheckIcon size={12} strokeWidth={3} />
        {label || 'Legitimerad med BankID'}
      </span>
    )
  }

  const styles =
    tone === 'dark'
      ? 'bg-amber-500/15 text-amber-300 border border-amber-400/25'
      : 'bg-amber-50 text-amber-700 border border-amber-200'
  const content = (
    <span className={`chip inline-flex items-center gap-1.5 ${styles} ${className}`}>
      <ShieldIcon size={13} strokeWidth={2.2} />
      {unverifiedLabel}
    </span>
  )
  return href ? (
    <Link href={href} className="inline-flex hover:opacity-90 transition">
      {content}
    </Link>
  ) : (
    content
  )
}
