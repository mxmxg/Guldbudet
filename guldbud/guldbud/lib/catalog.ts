// Predefined jewellery categories and gemstone options used across the app.

export const CATEGORIES = [
  'Ringar',
  'Halsband',
  'Örhängen',
  'Hängen',
  'Armband',
  'Broscher',
  'Mynt',
  'Övrigt',
] as const

export type Category = (typeof CATEGORIES)[number]

export const GEMSTONES = ['Diamant', 'Safir', 'Rubin', 'Smaragd', 'Pärla', 'Annan ädelsten'] as const

// Grammatically singular label for a category (used in copy).
export const CATEGORY_SINGULAR: Record<string, string> = {
  Ringar: 'Ring',
  Halsband: 'Halsband',
  Örhängen: 'Örhänge',
  Hängen: 'Hänge',
  Armband: 'Armband',
  Broscher: 'Brosch',
  Mynt: 'Mynt',
  Övrigt: 'Föremål',
}
