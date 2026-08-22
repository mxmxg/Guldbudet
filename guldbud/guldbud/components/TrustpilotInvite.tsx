import Link from 'next/link'

// Länk till GuldBuds Trustpilot-sida för att lämna omdöme. Domänbaserad
// "evaluate"-länk – funkar utan widget-kod och utan betalplan. Byt domänen
// här om Trustpilot-profilen skulle ligga på en annan.
export const TRUSTPILOT_REVIEW_URL = 'https://se.trustpilot.com/evaluate/guldbud.com'
export const TRUSTPILOT_PROFILE_URL = 'https://se.trustpilot.com/review/guldbud.com'

// Business Unit ID för GuldBud (från Trustpilots Review Collector-widget).
// Behövs den dagen vi tar en betalplan och vill slå på den officiella
// TrustBox-widgeten som visar stjärnbetyget publikt.
export const TRUSTPILOT_BUSINESS_UNIT_ID = '6a89c2c1b1b4ac4deeef5a5c'

// Trustpilots gröna stjärna (självständig SVG, ingen extern kod).
function TrustpilotStar({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px]"
      style={{ background: '#00B67A', width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="#fff">
        <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.9 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z" />
      </svg>
    </span>
  )
}

// Kort med uppmaning att lämna omdöme. Visas vid det bästa tillfället, precis
// efter en avslutad affär, samt kan användas där social proof behövs.
export default function TrustpilotInvite({
  heading = 'Nöjd med din affär?',
  text = 'Det tar en minut att lämna ett omdöme på Trustpilot och hjälper andra att våga sälja sitt guld tryggt.',
}: {
  heading?: string
  text?: string
}) {
  return (
    <div className="card p-6 text-center">
      <div className="flex items-center justify-center gap-1 mb-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <TrustpilotStar key={i} size={22} />
        ))}
      </div>
      <h2 className="font-display text-lg text-espresso-900 mb-1">{heading}</h2>
      <p className="text-sm text-espresso-500 leading-relaxed max-w-sm mx-auto">{text}</p>
      <a
        href={TRUSTPILOT_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-gold mt-5 inline-flex items-center gap-2"
      >
        <TrustpilotStar size={16} />
        Lämna ett omdöme
      </a>
    </div>
  )
}

// Kompakt länk (t.ex. i sidfoten).
export function TrustpilotFooterLink() {
  return (
    <a
      href={TRUSTPILOT_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-espresso-100/70 hover:text-gold-300 transition"
    >
      <TrustpilotStar size={14} />
      Betygsätt oss på Trustpilot
    </a>
  )
}
