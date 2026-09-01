// Formen på en guide i lib/guides.ts. Egen fil så att listan kan importeras
// utan att dra med sig något annat.
export type Guide = {
  href: string
  title: string
  desc: string
}
