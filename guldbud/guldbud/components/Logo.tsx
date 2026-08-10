// GuldBuds ordmärke. Ett rent, modernt wordmark i Inter (sajtens sans),
// halvfet med tight teckenavstånd. Används överallt så loggan är exakt
// likadan i navbar, footer, inloggning, startsida och dokument.
export default function Logo({ className = '' }: { className?: string }) {
  return <span className={`font-sans font-semibold tracking-tight ${className}`}>GuldBud</span>
}
