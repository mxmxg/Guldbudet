// Adressen till inloggningen, med sidan man stod på som återvändsadress.
//
// Grindarna skickade tidigare till '/auth/login' rakt av, och inloggningen
// gick sedan alltid till startsidan eller handlarpanelen. Den som kom från
// en länk i ett mejl, till exempel "Öppna i adminpanelen", loggade alltså in
// och hamnade på fel sida. Nu följer adressen med som ?next= och läses av
// inloggningssidan, se safeNext nedan.
//
// Bara klientkomponenter anropar den, därför window direkt.

export function loginUrl(role?: 'dealer'): string {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (typeof window !== 'undefined') {
    const here = window.location.pathname + window.location.search
    if (here && here !== '/') params.set('next', here)
  }
  const q = params.toString()
  return '/auth/login' + (q ? '?' + q : '')
}

// Godtar bara en relativ adress på den egna sajten. En absolut adress eller
// en som börjar med två snedstreck hade kunnat skicka en nyss inloggad
// användare till en främmande sajt.
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  if (value.startsWith('/auth/')) return null
  return value
}
