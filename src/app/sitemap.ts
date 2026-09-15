import type { MetadataRoute } from 'next'

import { liveSeoContext, sitemapEntries } from '@/lib/seo'

/**
 * Every route the site serves, from the content layer (`allRoutes()`), so a
 * new service or team member appears here without anyone editing this file.
 *
 * Staging and development return an empty set: a review URL must not
 * advertise its pages, and app/robots.ts omits the sitemap line there too.
 * `lastModified` is the build time; a content change ships as a new build.
 */
const BUILT_AT = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(liveSeoContext(), BUILT_AT)
}
