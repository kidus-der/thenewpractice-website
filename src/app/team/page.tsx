/**
 * /team — T6 Index on the curated `team.ts` (docs/05 §T6; round 1, R4c). A
 * short title page (the opening's first sentence as the lead, the
 * `team-index` picture beside it), the eleven members straight beneath it as
 * rows (name over role; no portraits until the client supplies them,
 * docs/02), then _A Multidisciplinary Team_ with its twenty roles on sand,
 * the rail, the band. What renders of the document is chosen in
 * `curated/team.ts`.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey } from '@/content/media'
import { TEAM_CURATED, TEAM_PAGE_CURATED } from '@/content/curated/team'
import { routes } from '@/content/nav'
import { ROUTE_SEO } from '@/content/seo'
import { rowsFromTeam } from '@/lib/indexPage'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, itemList, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { IndexTemplate } from '@/templates/IndexTemplate'

const SEO = ROUTE_SEO.team
const PATH = routes.team

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The roles list, after the names, on sand. */
const ROLES_SECTION = 'a-multidisciplinary-team'
assertSectionIds(TEAM_PAGE_CURATED, [ROLES_SECTION])

/** design/ROUND1-IMAGE-SLOTS.md: one team working on one case. */
const PLATE: MediaKey = 'team-index'
const ROWS = rowsFromTeam(TEAM_CURATED)

const TRAIL = [
  { name: ROUTE_SEO.home.name, path: routes.home },
  { name: SEO.name, path: PATH },
] as const

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          webPage({ title: SEO.title, description: SEO.description, path: PATH }),
          breadcrumb(TRAIL),
          itemList(ROWS.map((row) => ({ name: row.title, path: row.href }))),
          organization(),
        ]}
      />
      <IndexTemplate
        page={TEAM_PAGE_CURATED}
        plate={PLATE}
        after={TEAM_PAGE_CURATED.sections}
        grounds={{ [ROLES_SECTION]: 'mid' }}
        list={{ label: TEAM_PAGE_CURATED.title, rows: ROWS }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
