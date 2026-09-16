/**
 * /about — T2 Interior on `pages/about.ts` (docs/05 §T2). The page composes:
 * the ceiba section on sand with the mark drawn on entry; a plate for the
 * sea and one for the jungle, nothing elsewhere; the rail home ← About →
 * Our Process. Everything else is the template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey } from '@/content/media'
import { routes } from '@/content/nav'
import { ABOUT } from '@/content/pages/about'
import { ROUTE_SEO } from '@/content/seo'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { CeibaFigure } from '@/sections/CeibaFigure'
import { InteriorTemplate } from '@/templates/InteriorTemplate'

const SEO = ROUTE_SEO.about
const PATH = routes.about

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The one section where the mark is looked at (docs/01 §The mark). */
const CEIBA_SECTION = 'our-logo-the-ceiba'

/** Two plates: the sea and the jungle. Restraint elsewhere. */
const PLATES = {
  'the-caribbean-sea': 'hero-poster',
  'the-healing-power-of-the-mayan-jungle': 'index-01',
} as const satisfies Record<string, MediaKey>

// A renamed section id fails the build here rather than silently dropping a plate.
assertSectionIds(ABOUT, [CEIBA_SECTION, ...Object.keys(PLATES)])

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
      <InteriorTemplate
        page={ABOUT}
        plates={PLATES}
        grounds={{ [CEIBA_SECTION]: 'mid' }}
        figures={{ [CEIBA_SECTION]: <CeibaFigure /> }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
