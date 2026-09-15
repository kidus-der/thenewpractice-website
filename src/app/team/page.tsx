/**
 * /team — T6 Index on `team.ts` (docs/05 §T6). The page composes: the
 * document's untitled opening paragraph lifted onto the title page as the
 * lead, the rest of that opening on sand, *One Client. One Team.* with its
 * three subsections (the multidisciplinary roles as the hairline two-column
 * list) on bone, then the eleven members as rows — name over role, no
 * portraits until the client supplies them (docs/02: never a landscape plate
 * for a person) — the rail, the band.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { routes } from '@/content/nav'
import { ROUTE_SEO } from '@/content/seo'
import { TEAM, TEAM_PAGE } from '@/content/team'
import { liftLead, rowsFromTeam } from '@/lib/indexPage'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, itemList, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { IndexTemplate } from '@/templates/IndexTemplate'

const SEO = ROUTE_SEO.team
const PATH = routes.team

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The untitled opening; its first line becomes the lead, the rest sits on sand. */
const OPENING_SECTION = 'intro'
assertSectionIds(TEAM_PAGE, [OPENING_SECTION])

const PAGE = liftLead(TEAM_PAGE, OPENING_SECTION)
const ROWS = rowsFromTeam(TEAM)

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
        page={PAGE}
        before={PAGE.sections}
        grounds={{ [OPENING_SECTION]: 'mid' }}
        list={{ label: TEAM_PAGE.title, rows: ROWS }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
