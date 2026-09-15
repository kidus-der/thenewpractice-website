/**
 * /clinical-services — T6 Index on `services.ts` (docs/05 §T6). The page
 * composes: the document's one intro section on sand, then the eleven
 * services as rows with no plates (services carry none yet; the list stays
 * pure type), the rail, the band. Everything else is the template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { routes } from '@/content/nav'
import { ROUTE_SEO } from '@/content/seo'
import { SERVICES, SERVICES_PAGE } from '@/content/services'
import { rowsFromServices } from '@/lib/indexPage'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, itemList, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { IndexTemplate } from '@/templates/IndexTemplate'

const SEO = ROUTE_SEO.clinicalServices
const PATH = routes.clinicalServices

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The one intro section, on sand. */
const INTRO_SECTION = 'individualized-treatment-for-complex-human-problems'
assertSectionIds(SERVICES_PAGE, [INTRO_SECTION])

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
        page={SERVICES_PAGE}
        before={SERVICES_PAGE.sections}
        grounds={{ [INTRO_SECTION]: 'mid' }}
        list={{ label: SERVICES_PAGE.title, rows: ROWS }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
