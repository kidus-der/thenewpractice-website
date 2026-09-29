/**
 * /about — T2 Interior in the spread layout on the curated `pages/about.ts`
 * (docs/05 §T2, curated/about.ts). The page composes: every section but the
 * principles as a spread with its round-1 picture, alternating sides; the
 * ceiba section on sand with the mark drawn on entry beside the tree; the
 * rail home ← About → Our Process. Everything else is the template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey } from '@/content/media'
import { routes } from '@/content/nav'
import { ABOUT_CURATED } from '@/content/curated/about'
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

/** One picture per section (design/ROUND1-IMAGE-SLOTS.md). The founder's
 *  bench by the sea sits between the practice's room and the marina, two
 *  sections away from the walk at the waterline. */
const PLATES = {
  [CEIBA_SECTION]: 'about-ceiba',
  'about-the-new-practice': 'about-practice',
  'a-message-from-the-founder': 'about-founder',
  'puerto-aventuras': 'about-place',
  'the-caribbean-sea': 'about-sea',
  'the-healing-power-of-the-mayan-jungle': 'about-jungle',
} as const satisfies Record<string, MediaKey>

// A renamed section id fails the build here rather than silently dropping a plate.
assertSectionIds(ABOUT_CURATED, [CEIBA_SECTION, ...Object.keys(PLATES)])

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
        page={ABOUT_CURATED}
        layout="spread"
        plates={PLATES}
        grounds={{ [CEIBA_SECTION]: 'mid' }}
        figures={{ [CEIBA_SECTION]: <CeibaFigure /> }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
