/**
 * /self-assessment/[slug] — the ten questionnaires on the self-assessment
 * template (docs/05 §Self-assessment). One static page per entry in
 * `ASSESSMENTS`; an unknown slug is a 404. The page composes the series'
 * disclaimer and consultation sections around the questionnaire, passes the
 * series' two lines, and wires metadata and structured data — a WebPage, the
 * breadcrumb home → Self-Assessment → title, and the organisation. No
 * MedicalTest or Quiz schema: the scorer is a screening aid in the client's
 * own words, and the description already says nothing is stored.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { ASSESSMENTS, ASSESSMENTS_PAGE, ASSESSMENT_SERIES } from '@/content/assessments'
import { NAV, assessmentHref, routes } from '@/content/nav'
import type { Assessment, NavItem, Section } from '@/content/schemas'
import { ROUTE_SEO, assessmentSeo } from '@/content/seo'
import { assessmentPrevNext } from '@/lib/assessment'
import { assertSectionIds } from '@/lib/interior'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { AssessmentTemplate } from '@/templates/AssessmentTemplate'

type Params = Promise<{ slug: string }>

const DISCLAIMER_SECTION = 'important-disclaimer'
const CONSULTATION_SECTION = 'a-confidential-consultation'
assertSectionIds(ASSESSMENTS_PAGE, [DISCLAIMER_SECTION, CONSULTATION_SECTION])

/** A build error, not a blank block, if the ingestion renames a section. */
function sectionById(id: string): Section {
  const section = ASSESSMENTS_PAGE.sections.find((s) => s.id === id)
  if (!section) throw new Error(`pages/self-assessment: no section with id ${id}`)
  return section
}

const DISCLAIMER = sectionById(DISCLAIMER_SECTION)
const CONSULTATION = sectionById(CONSULTATION_SECTION)
const INDEX_SEO = ROUTE_SEO.selfAssessment

function enquireItem(): NavItem {
  const [item] = NAV.utility
  if (!item) throw new Error('nav.ts has no utility item for the assessment result')
  return item
}
const ENQUIRE = enquireItem()

const findAssessment = (slug: string): Assessment | undefined =>
  ASSESSMENTS.find((assessment) => assessment.slug === slug)

export const dynamicParams = false

export function generateStaticParams() {
  return ASSESSMENTS.map((assessment) => ({ slug: assessment.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const assessment = findAssessment(slug)
  if (!assessment) notFound()
  return buildMetadata({ ...assessmentSeo(assessment), path: assessmentHref(slug) })
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params
  const assessment = findAssessment(slug)
  if (!assessment) notFound()

  const seo = assessmentSeo(assessment)
  const path = assessmentHref(slug)
  const trail = [
    { name: ROUTE_SEO.home.name, path: routes.home },
    { name: INDEX_SEO.name, path: routes.selfAssessment },
    { name: seo.name, path },
  ]

  return (
    <>
      <JsonLd
        data={[
          webPage({ title: seo.title, description: seo.description, path }),
          breadcrumb(trail),
          organization(),
        ]}
      />
      <AssessmentTemplate
        assessment={assessment}
        disclaimer={DISCLAIMER}
        consultation={CONSULTATION}
        seriesName={INDEX_SEO.name}
        lead={ASSESSMENT_SERIES.scoringText}
        instruction={ASSESSMENT_SERIES.instruction}
        enquire={ENQUIRE}
        prevNext={assessmentPrevNext(slug)}
      />
    </>
  )
}
