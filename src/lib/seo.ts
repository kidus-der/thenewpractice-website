/**
 * Metadata helpers — docs/09-performance-accessibility.md §Search and AI visibility.
 *
 * `buildMetadata()` is what every template exports from `generateMetadata`
 * (or a static `metadata`). It is pure: the site origin and the index switch
 * are read from the environment once by default and can be injected for tests.
 *
 * The Open Graph image for a page is the `/og` route with the page's short
 * title, so every shared link shows the lockup on canopy with the page named
 * beneath it (src/lib/og.tsx). Setting `openGraph.images` explicitly also
 * stops Next merging the root `opengraph-image.tsx` over it.
 */
import type { Metadata, MetadataRoute } from 'next'

import { allRoutes, routes } from '@/content'
import { DESCRIPTION_MAX, SEO_DEFAULTS, excerpt, type OpenGraphType } from '@/content/seo'
import { env, isIndexable } from '@/lib/env'

export type BuildMetadataInput = {
  title: string
  description: string
  /** Route path, e.g. `/team/lowell-monkhouse`. Query and hash are dropped. */
  path: string
  /** Absolute URL or site-relative path of a custom image; defaults to `/og`. */
  image?: string
  /** The line under the lockup on the generated card. Ignored when `image` is set. */
  ogTitle?: string | null
  type?: OpenGraphType
  /** Keep the page out of the index even in production (legal stubs, thank-you pages). */
  noIndex?: boolean
}

export type SeoContext = {
  /** Origin without a trailing slash. */
  siteUrl: string
  indexable: boolean
}

export const OG_IMAGE = { width: 1200, height: 630 } as const
export const OG_ROUTE = '/og'
export const OG_TITLE_PARAM = 'title'
export const OG_TITLE_MAX = 80

const LEGAL_ROUTES: readonly string[] = [routes.privacy, routes.terms]
const PRIORITY = { home: 1, page: 0.8, item: 0.6, legal: 0.3 } as const

/** The live context: validated env plus the production switch. */
export const liveSeoContext = (): SeoContext => ({
  siteUrl: env().NEXT_PUBLIC_SITE_URL,
  indexable: isIndexable(),
})

/** `/about/` → `/about`; `about?x#y` → `/about`; `''` → `/`. */
export function normalisePath(path: string): string {
  const bare = path.split(/[?#]/)[0] ?? ''
  const withLeadingSlash = bare.startsWith('/') ? bare : `/${bare}`
  const trimmed = withLeadingSlash.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/** Absolute canonical URL; the root keeps its trailing slash, nothing else does. */
export function canonicalUrl(siteUrl: string, path: string): string {
  const origin = siteUrl.replace(/\/+$/, '')
  const normalised = normalisePath(path)
  return normalised === '/' ? `${origin}/` : `${origin}${normalised}`
}

/** Site-relative path of the generated card for a page. */
export function ogImagePath(ogTitle?: string | null): string {
  if (!ogTitle) return OG_ROUTE
  const params = new URLSearchParams({ [OG_TITLE_PARAM]: ogTitle })
  return `${OG_ROUTE}?${params.toString()}`
}

const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}]/gu

/** One clean line for the card: no control characters, collapsed spaces, capped length. */
export function sanitiseOgTitle(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  const clean = raw.replace(CONTROL_CHARACTERS, '').replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  return clean.length <= OG_TITLE_MAX ? clean : excerpt(clean, OG_TITLE_MAX)
}

const absolute = (siteUrl: string, urlOrPath: string): string =>
  /^https?:\/\//.test(urlOrPath) ? urlOrPath : `${siteUrl.replace(/\/+$/, '')}${urlOrPath}`

const robotsFor = (input: BuildMetadataInput, context: SeoContext): Metadata['robots'] => {
  if (!context.indexable) return { index: false, follow: false }
  if (input.noIndex) return { index: false, follow: true }
  return { index: true, follow: true }
}

/** The complete Metadata object for one page. */
export function buildMetadata(
  input: BuildMetadataInput,
  context: SeoContext = liveSeoContext()
): Metadata {
  const description = excerpt(input.description, DESCRIPTION_MAX)
  const url = canonicalUrl(context.siteUrl, input.path)
  const imageUrl = absolute(context.siteUrl, input.image ?? ogImagePath(input.ogTitle))

  return {
    title: { absolute: input.title },
    description,
    alternates: { canonical: url },
    robots: robotsFor(input, context),
    openGraph: {
      type: input.type ?? 'website',
      siteName: SEO_DEFAULTS.siteName,
      locale: SEO_DEFAULTS.locale,
      url,
      title: input.title,
      description,
      images: [{ url: imageUrl, ...OG_IMAGE, alt: SEO_DEFAULTS.ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description,
      images: [imageUrl],
    },
  }
}

const priorityFor = (path: string): number => {
  if (path === routes.home) return PRIORITY.home
  if (LEGAL_ROUTES.includes(path)) return PRIORITY.legal
  const isStatic = (Object.values(routes) as readonly string[]).includes(path)
  return isStatic ? PRIORITY.page : PRIORITY.item
}

/** Every route the site serves, for `app/sitemap.ts`. Empty when not indexable. */
export function sitemapEntries(context: SeoContext, lastModified: Date): MetadataRoute.Sitemap {
  if (!context.indexable) return []
  return allRoutes().map((path) => ({
    url: canonicalUrl(context.siteUrl, path),
    lastModified,
    changeFrequency: LEGAL_ROUTES.includes(path) ? 'yearly' : 'monthly',
    priority: priorityFor(path),
  }))
}
