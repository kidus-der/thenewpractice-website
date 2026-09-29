/**
 * /self-assessment — the tab page (docs/05 §T6 *Self-assessment*; round 1,
 * R5). The client's two sentences on what the questionnaires are for, one
 * picture, and the ten questionnaires directly beneath under the client's own
 * heading, with the first sentence of their disclaimer as one line. The text
 * is chosen in the curation layer (`curated/self-assessment.ts`); the how-to
 * becomes each questionnaire's instruction, and the full disclaimer and *A
 * Confidential Consultation* are read with each result.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { ASSESSMENTS } from '@/content/assessments'
import {
  SELF_ASSESSMENT_CURATED,
  SELF_ASSESSMENT_DISCLAIMER,
  SELF_ASSESSMENT_INTRO,
  SELF_ASSESSMENT_LIST,
} from '@/content/curated/self-assessment'
import { routes } from '@/content/nav'
import type { Section } from '@/content/schemas'
import { ROUTE_SEO } from '@/content/seo'
import { rowsFromAssessments } from '@/lib/indexPage'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { AssessmentIndexTemplate } from '@/templates/AssessmentIndexTemplate'

const SEO = ROUTE_SEO.selfAssessment
const PATH = routes.selfAssessment
const PLATE = 'assessment-index'

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** A build error, not a blank block, if the curation loses a section. */
function curated(id: string): Section {
  const section = SELF_ASSESSMENT_CURATED.sections.find((s) => s.id === id)
  if (!section) throw new Error(`curated/self-assessment: no section ${id}`)
  return section
}

function firstParagraph(id: string): string {
  const [paragraph] = curated(id).paragraphs
  if (!paragraph) throw new Error(`curated/self-assessment: ${id} has no paragraph`)
  return paragraph
}

function listLabel(): string {
  const { title } = curated(SELF_ASSESSMENT_LIST)
  if (!title) throw new Error(`curated/self-assessment: ${SELF_ASSESSMENT_LIST} has no title`)
  return title
}

const DESCRIPTION = firstParagraph(SELF_ASSESSMENT_INTRO)
const DISCLAIMER = firstParagraph(SELF_ASSESSMENT_DISCLAIMER)
const LIST = {
  id: SELF_ASSESSMENT_LIST,
  label: listLabel(),
  rows: rowsFromAssessments(ASSESSMENTS),
}

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
      <AssessmentIndexTemplate
        slug={SELF_ASSESSMENT_CURATED.slug}
        title={SELF_ASSESSMENT_CURATED.title}
        description={DESCRIPTION}
        plate={PLATE}
        list={LIST}
        disclaimer={DISCLAIMER}
        prevNext={prevNextFor(PATH)}
      />
    </>
  )
}
