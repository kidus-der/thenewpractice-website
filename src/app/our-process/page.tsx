/**
 * /our-process — T2 Interior on `pages/process.ts` (docs/05 §T2). Eleven
 * sections, so the sticky index shows from 1024px. The page composes: the
 * cenote poster on _Arriving at The New Practice_ and no other image; _A
 * Typical Day_ on sand with its prose rendered as the timeline rule; the
 * rail About ← Our Process → Clinical Services. Everything else is the
 * template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey } from '@/content/media'
import { routes } from '@/content/nav'
import { PROCESS } from '@/content/pages/process'
import { ROUTE_SEO } from '@/content/seo'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { DayTimeline } from '@/sections/DayTimeline'
import { InteriorTemplate } from '@/templates/InteriorTemplate'

const SEO = ROUTE_SEO.process
const PATH = routes.process

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The one section whose content is a progression (docs/04 §6 "Timeline rule"). */
const DAY_SECTION = 'a-typical-day'

/** One plate: arriving, the water. Restraint elsewhere. */
const PLATES = {
  'arriving-at-the-new-practice': 'hero-cenote-poster',
} as const satisfies Record<string, MediaKey>

// A renamed section id fails the build here rather than silently dropping the timeline.
assertSectionIds(PROCESS, [DAY_SECTION, ...Object.keys(PLATES)])

const daySection = PROCESS.sections.find((section) => section.id === DAY_SECTION)
if (!daySection) throw new Error(`pages/process.ts: no section ${DAY_SECTION}`)
/** Narrowed once so the component body reads the paragraphs directly. */
const DAY_PARAGRAPHS = daySection.paragraphs

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
        page={PROCESS}
        plates={PLATES}
        grounds={{ [DAY_SECTION]: 'mid' }}
        bodies={{ [DAY_SECTION]: <DayTimeline paragraphs={DAY_PARAGRAPHS} /> }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
