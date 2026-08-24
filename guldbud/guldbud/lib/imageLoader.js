// Custom Next.js image loader.
//
// När NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === 'true' routas Supabase-lagringens
// bilder genom render/image-transformendpointen, som levererar rätt storlek +
// modernt format (WebP via Accept-header). Det ger responsiva bilder och löser
// Core Web Vitals, UTAN att gå via Vercels bildoptimering (som tidigare slog i
// månadskvoten och gav 402/svarta bilder).
//
// OBS: Supabase bildtransformering kräver Pro-planen. Därför är loadern AVSTÄNGD
// som standard: utan flaggan returneras original-URL:en oförändrad, precis som
// den gamla `unoptimized: true`-vägen. Då kan inget gå sönder på en plan utan
// transformering. Slå på flaggan först när planen stödjer det.
//
// Icke-Supabase-URL:er (t.ex. data:-preview vid uppladdning) lämnas orörda.
const MAX_WIDTH = 2048 // matchar vår uppladdnings-nedskalning; håll under Supabases tak

export default function supabaseImageLoader({ src, width, quality }) {
  const enabled = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === 'true'
  if (!enabled || typeof src !== 'string' || !src.includes('/storage/v1/object/public/')) {
    return src
  }
  const rendered = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const w = Math.min(width || MAX_WIDTH, MAX_WIDTH)
  const q = quality || 75
  const sep = rendered.includes('?') ? '&' : '?'
  return `${rendered}${sep}width=${w}&quality=${q}&resize=contain`
}
