/**
 * /our-process — T2 Interior in the spread layout on the curated
 * `pages/process.ts` (docs/05 §T2, curated/process.ts). Seven short sections,
 * five of them spreads with their round-1 pictures, alternating sides; _A
 * Typical Day_ on sand with its prose rendered as the timeline rule; the rail
 * About ← Our Process → A Personal Message. Everything else is the template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey } from '@/content/media'
import { routes } from '@/content/nav'
import { PROCESS_CURATED } from '@/content/curated/process'
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

/** One picture per section that earns one (design/ROUND1-IMAGE-SLOTS.md); the
 *  assessment and the return home read as text between them. */
const PLATES = {
  'the-new-practice-experience': 'process-first-conversation',
  'why-we-have-a-lead-clinician': 'process-lead-clinician',
  [DAY_SECTION]: 'process-typical-day',
  'family-participation': 'process-family',
  'nutrition-as-therapy': 'process-nutrition',
} as const satisfies Record<string, MediaKey>

// A renamed section id fails the build here rather than silently dropping the timeline.
assertSectionIds(PROCESS_CURATED, [DAY_SECTION, ...Object.keys(PLATES)])

const daySection = PROCESS_CURATED.sections.find((section) => section.id === DAY_SECTION)
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
        page={PROCESS_CURATED}
        layout="spread"
        plates={PLATES}
        grounds={{ [DAY_SECTION]: 'mid' }}
        bodies={{ [DAY_SECTION]: <DayTimeline paragraphs={DAY_PARAGRAPHS} /> }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
