/**
 * /fees — T2 Interior in the letter variant on `pages/fees.ts` (docs/05 §T2,
 * the Statement block). The client's heading is _Cost_ and stays so; the nav
 * label and the metadata say _Fees_ (ledger, Task 10 triage). One statement
 * at the lead register, then the enquire band. Nothing else on the page: the
 * emptiness is the design. Not in the primary navigation, so no rail.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { routes } from '@/content/nav'
import { FEES } from '@/content/pages/fees'
import { ROUTE_SEO } from '@/content/seo'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { InteriorTemplate } from '@/templates/InteriorTemplate'

const SEO = ROUTE_SEO.fees
const PATH = routes.fees

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

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
          organization(),
        ]}
      />
      <InteriorTemplate page={FEES} variant="letter" prevNext={prevNextFor(PATH)} />
    </>
  )
}
