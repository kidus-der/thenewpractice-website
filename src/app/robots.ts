import type { MetadataRoute } from 'next'

import { env, isIndexable } from '@/lib/env'

/**
 * Staging and development must never be indexed: the pages carry no on-screen
 * disclaimer, so robots.txt and the noindex meta in layout.tsx are the only
 * things stopping a review URL being found and mistaken for the live practice.
 *
 * Production allows everything and points at the sitemap. Task 10 adds
 * `app/sitemap.ts`; until then the production URL below is declared but 404s,
 * which is harmless because no production target exists yet.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${env().NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
