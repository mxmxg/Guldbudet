/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  // sharp är en native-modul och ska laddas från node_modules i runtime, inte
  // bundlas in (används i engångs-routen /api/admin/optimize-images).
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  images: {
    // Egen loader (lib/imageLoader.js): routar Supabase-bilder genom render/image-
    // transformendpointen NÄR NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM='true' (kräver
    // Supabase Pro-plan), för responsiva bilder + WebP och bättre Core Web Vitals.
    // Avstängd som standard -> original-URL returneras oförändrad, precis som den
    // gamla unoptimized-vägen. Inget går via Vercels bildoptimering, så kvoten som
    // tidigare gav 402/svarta bilder är aldrig i bild.
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
