import type { NextRequest } from 'next/server'

import { renderOgCard } from '@/lib/og'
import { OG_TITLE_PARAM, sanitiseOgTitle } from '@/lib/seo'

/**
 * /og?title=<page> — the lockup card with the page named beneath it. This is
 * what buildMetadata() points every page's og:image at. The metadata file
 * convention (opengraph-image.tsx) receives only route params, never the
 * query string, which is why the per-page card is a route handler.
 *
 * Reading the query makes the route dynamic; the cache header lets the CDN
 * hold each rendered title for a week and serve it stale while refreshing.
 */
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'

export function GET(request: NextRequest): Promise<Response> {
  const title = sanitiseOgTitle(request.nextUrl.searchParams.get(OG_TITLE_PARAM))
  return renderOgCard({ title, headers: { 'cache-control': CACHE_CONTROL } })
}
