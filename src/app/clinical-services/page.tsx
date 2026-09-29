/**
 * /clinical-services — T6 Index on `services.ts` (docs/05 §T6), curated in
 * round 1 (R4b, `curated/services.ts`). The page composes: the title page
 * with a two-sentence lead from the document's intro and its picture, then
 * the eleven services directly beneath, opened by the intro's last line, as
 * rows with no plates; the rail, the band. Everything else is the template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { routes } from '@/content/nav'
import { ROUTE_SEO } from '@/content/seo'
import { SERVICES_PAGE_CURATED } from '@/content/curated/services'
import { SERVICES } from '@/content/services'
import { rowsFromServices } from '@/lib/indexPage'
import { breadcrumb, itemList, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { IndexTemplate } from '@/templates/IndexTemplate'

const SEO = ROUTE_SEO.clinicalServices
const PATH = routes.clinicalServices

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

const { page: PAGE, listLead: LIST_LEAD } = SERVICES_PAGE_CURATED
/** design/ROUND1-IMAGE-SLOTS.md: the first consultation, told through hands. */
const PLATE = 'services-index'

const ROWS = rowsFromServices(SERVICES)

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
        plate={PLATE}
        list={{ label: PAGE.title, lead: LIST_LEAD, rows: ROWS }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
