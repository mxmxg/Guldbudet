import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://guldbud.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep private/account areas out of the index.
      disallow: ['/admin', '/dealer/dashboard', '/dealer/profile', '/customer/', '/orders/', '/auth/', '/meddelanden'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
