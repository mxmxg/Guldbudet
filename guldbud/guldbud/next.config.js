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
    // Serva bilderna direkt från Supabase CDN i stället för via Vercels
    // bildoptimering. Vercels optimering har en månadskvot och började svara
    // 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED (bilder blev svarta). Supabase
    // levererar redan via CDN, så vi behöver inte mellanledet.
    unoptimized: true,
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
