/**
 * The two legal routes while their copy is a PLACEHOLDER stub
 * (docs/CONTENT-GAPS.md G3): T2 Interior on `pages/legal.ts`, `noIndex`, and
 * — off production only — the staging eyebrow _Copy pending client review_
 * in place of the page's own, so a reviewer can tell the stub from a
 * finished page. Both routes are also left out of the sitemap through
 * `NOINDEX_ROUTES` (nav.ts). When counsel's text arrives the route swaps the
 * module, drops `noIndex`, and this file goes.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { routes, type RouteKey } from '@/content/nav'
import type { Page } from '@/content/schemas'
import { ROUTE_SEO } from '@/content/seo'
import { UI_STAGING } from '@/content/ui'
import { isIndexable } from '@/lib/env'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { InteriorTemplate } from '@/templates/InteriorTemplate'

type LegalRoute = Extract<RouteKey, 'privacy' | 'terms'>

export const legalMetadata = (route: LegalRoute): Metadata =>
  buildMetadata({ ...ROUTE_SEO[route], path: routes[route], noIndex: true })

/** The flag shows wherever the site is not indexable — development and staging. */
const stagingEyebrow = (): string | undefined =>
  isIndexable() ? undefined : UI_STAGING.copyPending

type Props = { route: LegalRoute; page: Page }

export function LegalStub({ route, page }: Props) {
  const seo = ROUTE_SEO[route]
  const path = routes[route]
  const flagged: Page = { ...page, eyebrow: stagingEyebrow() ?? page.eyebrow }
  const trail = [
    { name: ROUTE_SEO.home.name, path: routes.home },
    { name: seo.name, path },
  ] as const

  return (
    <>
      <JsonLd
        data={[
          webPage({ title: seo.title, description: seo.description, path }),
          breadcrumb(trail),
          organization(),
        ]}
      />
      <InteriorTemplate page={flagged} />
    </>
  )
}
