/**
 * Self-assessment — the T2 variant for `/self-assessment/[slug]` (docs/05
 * §Self-assessment, plan §3.3; ledger, owner decisions). The interior
 * composition with a questionnaire where the long-read body would be:
 *
 *   PageIntro (Self-Assessment · 0N, the questionnaire title, the series'
 *   own scoring line as the lead) → the client's *Important Disclaimer* on
 *   sand, on every questionnaire, above the questions → the questions on
 *   bone: the eyebrow lockup, the series' instruction line, then the scorer
 *   → the rail (previous / next questionnaire, the ends wrapping to the
 *   index) → the closing band.
 *
 * Server component; the scorer is the only client code. The template holds
 * no copy of its own: the route passes the questionnaire, the two sections
 * of the series page it composes, the series' two lines and the eyebrow.
 */
import './AssessmentTemplate.css'
import { SectionHeader } from '@/components/SectionHeader'
import type { Assessment, NavItem, Section } from '@/content/schemas'
import { UI_ASSESSMENT, UI_INDEX } from '@/content/ui'
import { liftHeader } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { Reveal } from '@/motion/Reveal'
import { AssessmentForm } from '@/sections/AssessmentForm'
import { ContentSection } from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { PageIntro } from '@/sections/PageIntro'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type AssessmentTemplateProps = {
  assessment: Assessment
  /** The series' *Important Disclaimer*; its first sentence becomes the serif header line. */
  disclaimer: Section
  /** The series' *A Confidential Consultation*, shown with the result. */
  consultation: Section
  /** The series name for the title-page eyebrow (the navigation label). */
  seriesName: string
  /** The series' scoring line, the title page's lead. */
  lead: string
  /** The series' instruction line, above the questions. */
  instruction: string
  enquire: NavItem
  prevNext: PrevNext
}

const INTRO = 0
const DISCLAIMER = 1
const QUESTIONS = 2
const BAND = 3

export function AssessmentTemplate({
  assessment,
  disclaimer,
  consultation,
  seriesName,
  lead,
  instruction,
  enquire,
  prevNext,
}: AssessmentTemplateProps) {
  const titleId = `${assessment.slug}-title`
  const questionsId = `${assessment.slug}-questions`
  const questionsTitleId = `${questionsId}-title`
  const eyebrow = `${seriesName} ${UI_ASSESSMENT.eyebrowSeparator} ${numeral(assessment.order)}`

  return (
    <main id="main" className="assessment-page">
      <PageIntro
        id={titleId}
        numeral={numeral(INTRO)}
        eyebrow={eyebrow}
        headline={assessment.title}
        lead={lead}
      />

      <ContentSection section={liftHeader(disclaimer)} numeral={numeral(DISCLAIMER)} ground="mid" />

      <section
        id={questionsId}
        className="assessment-questions"
        data-ground="light"
        data-n={numeral(QUESTIONS)}
        aria-labelledby={questionsTitleId}
      >
        <div className="shell grid12">
          <div className="p-lead assessment-questions__head">
            <SectionHeader
              n={numeral(QUESTIONS)}
              label={UI_INDEX.assessmentLength}
              id={questionsTitleId}
            />
            <Reveal as="p" className="t-eyebrow assessment-questions__instruction">
              {instruction}
            </Reveal>
          </div>
          <div className="assessment-questions__form">
            <AssessmentForm assessment={assessment} consultation={consultation} enquire={enquire} />
          </div>
        </div>
      </section>

      <PrevNextRail {...prevNext} />
      <EnquireBand numeral={numeral(BAND)} />
    </main>
  )
}
