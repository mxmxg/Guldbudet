/** @type {import('next').NextConfig} */
const nextConfig = {
  // Typfel blockerar nu bygget igen, så riktiga buggar inte kan gå live
  // oupptäckta. ESLint ignoreras fortfarande under bygget (separat städning),
  // men typkontrollen är på.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
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
      {
        // Loadern skriver om till render/image när transformflaggan är på.
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
    ],
  },
}

module.exports = nextConfig
