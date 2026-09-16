/**
 * /residences — T5 Residences on `pages/residences.ts` (docs/05 §T5). The
 * page composes: the canopy poster as the full-bleed plate; the six
 * residence frames in the carousel, `residence-04` cropped from the top
 * (ledger, Task 2b: a table and stools sit at its bottom edge); the second
 * section on sand; the discretion band under the privacy statement; the
 * rail Team ← Residences → Self-Assessment.
 *
 * Every string in the page module is structural PLACEHOLDER (CONTENT-GAPS
 * G1), so on any deployment that is not production the intro carries a
 * review flag the client can see; in production the flag cannot render, the
 * page is noindex and nothing links to it.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey } from '@/content/media'
import { routes } from '@/content/nav'
import { RESIDENCES } from '@/content/pages/residences'
import { ROUTE_SEO } from '@/content/seo'
import { UI_RESIDENCES } from '@/content/ui'
import { env } from '@/lib/env'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import type { ObjectPositions } from '@/sections/PlateCarousel'
import { ResidencesTemplate } from '@/templates/ResidencesTemplate'

const SEO = ROUTE_SEO.residences
const PATH = routes.residences

// noIndex while the copy is PLACEHOLDER (nav.ts NOINDEX_ROUTES); production
// also leaves the route out of the navigation (src/lib/placeholderRoutes.ts).
export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH, noIndex: true })

const HERO: MediaKey = 'hero-canopy-poster'
const BAND: MediaKey = 'band-discretion'
const CAROUSEL = [
  'residence-01',
  'residence-02',
  'residence-03',
  'residence-04',
  'residence-05',
  'residence-06',
] as const satisfies readonly MediaKey[]
const OBJECT_POSITIONS: ObjectPositions = { 'residence-04': 'top' }

/** The middle section on sand: bone / sand / bone (docs/02 §Ground rhythm). */
const SAND_SECTION = 'the-day'

// A renamed section id fails the build here rather than silently dropping the ground.
assertSectionIds(RESIDENCES, [SAND_SECTION])

const TRAIL = [
  { name: ROUTE_SEO.home.name, path: routes.home },
  { name: SEO.name, path: PATH },
] as const

/** Staging and development see the flag; production cannot. */
const copyPendingNotice = (): string | undefined =>
  env().SITE_ENV === 'production' ? undefined : UI_RESIDENCES.copyPending

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
      <ResidencesTemplate
        page={RESIDENCES}
        hero={HERO}
        carousel={CAROUSEL}
        objectPositions={OBJECT_POSITIONS}
        band={BAND}
        grounds={{ [SAND_SECTION]: 'mid' }}
        prevNext={prevNextFor(PATH)}
        notice={copyPendingNotice()}
      />
    </>
  )
}
