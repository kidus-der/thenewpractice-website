/**
 * /self-assessment — T6 Index on `assessments.ts` (docs/05 §T6). The page
 * composes, in the document's order: the intro section; the disclaimer on
 * sand with its opening sentence as the serif header line; the how-to's one
 * remaining sentence followed by the series' own scoring line (ledger, Task 5
 * findings — the superseded 0–3 scale never renders); the ten questionnaires
 * as rows under the document's own *Available Self-Assessments* heading and
 * its introducing line; *A Confidential Consultation*; the rail; the band.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { ASSESSMENTS, ASSESSMENTS_PAGE, ASSESSMENT_SERIES } from '@/content/assessments'
import { routes } from '@/content/nav'
import type { Section } from '@/content/schemas'
import { ROUTE_SEO } from '@/content/seo'
import { UI_INDEX } from '@/content/ui'
import { appendParagraphs, liftHeader, rowsFromAssessments } from '@/lib/indexPage'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { IndexTemplate } from '@/templates/IndexTemplate'

const SEO = ROUTE_SEO.selfAssessment
const PATH = routes.selfAssessment

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

const DISCLAIMER_SECTION = 'important-disclaimer'
const HOW_TO_SECTION = 'how-to-complete-the-assessment'
const LIST_SECTION = 'available-self-assessments'
assertSectionIds(ASSESSMENTS_PAGE, [DISCLAIMER_SECTION, HOW_TO_SECTION, LIST_SECTION])

const compose = (section: Section): Section => {
  if (section.id === DISCLAIMER_SECTION) return liftHeader(section)
  if (section.id === HOW_TO_SECTION) {
    return appendParagraphs(section, [ASSESSMENT_SERIES.scoringText])
  }
  return section
}

/** The list section's own heading and introducing line; a build error if the document loses them. */
function listHead(section: Section | undefined): { label: string; lead?: string } {
  if (!section?.title) throw new Error(`pages/self-assessment: ${LIST_SECTION} has no title`)
  return { label: section.title, lead: section.listHeading }
}

const listAt = ASSESSMENTS_PAGE.sections.findIndex((s) => s.id === LIST_SECTION)
const LIST_HEAD = listHead(ASSESSMENTS_PAGE.sections[listAt])

const BEFORE = ASSESSMENTS_PAGE.sections.slice(0, listAt).map(compose)
const AFTER = ASSESSMENTS_PAGE.sections.slice(listAt + 1)
const ROWS = rowsFromAssessments(ASSESSMENTS, UI_INDEX.assessmentLength)

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
      <IndexTemplate
        page={ASSESSMENTS_PAGE}
        before={BEFORE}
        after={AFTER}
        grounds={{ [DISCLAIMER_SECTION]: 'mid' }}
        list={{ id: LIST_SECTION, ...LIST_HEAD, rows: ROWS }}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
