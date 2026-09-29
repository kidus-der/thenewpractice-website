/**
 * Self-assessment — the T2 variant for `/self-assessment/[slug]` (docs/05
 * §Self-assessment, plan §3.3; round 1, R5: least friction to reach and to
 * complete). The questions start in the first viewport:
 *
 *   PageIntro (Self-Assessment · 0N, the questionnaire title, the series'
 *   instruction line as the lead) → the questions on bone, no heading of
 *   their own, straight after the title → the rail (previous / next
 *   questionnaire, the ends wrapping to the index) → the closing band.
 *
 * The series' *Important Disclaimer* and *A Confidential Consultation* are
 * passed through to the result, where they are read in full. Server
 * component; the scorer is the only client code. The template holds no copy
 * of its own.
 */
import './AssessmentTemplate.css'
import type { AnswerType } from '@/content/assessment-answers'
import type { Assessment, NavItem, Section } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import { numeral } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { AssessmentForm } from '@/sections/AssessmentForm'
import { EnquireBand } from '@/sections/EnquireBand'
import { PageIntro } from '@/sections/PageIntro'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type AssessmentTemplateProps = {
  assessment: Assessment
  /** One per question: the 1 to 10 scale or yes / no / maybe. */
  answerTypes: readonly AnswerType[]
  /** The series' *Important Disclaimer*, read in full with the result. */
  disclaimer: Section
  /** The series' *A Confidential Consultation*, shown with the result. */
  consultation: Section
  /** The series name for the title-page eyebrow (the navigation label). */
  seriesName: string
  /** The series' instruction line, the title page's lead. */
  instruction: string
  enquire: NavItem
  prevNext: PrevNext
}

const INTRO = 0
const QUESTIONS = 1
const BAND = 2

export function AssessmentTemplate({
  assessment,
  answerTypes,
  disclaimer,
  consultation,
  seriesName,
  instruction,
  enquire,
  prevNext,
}: AssessmentTemplateProps) {
  const titleId = `${assessment.slug}-title`
  const eyebrow = `${seriesName} ${UI_ASSESSMENT.eyebrowSeparator} ${numeral(assessment.order)}`

  return (
    <main id="main" className="assessment-page">
      <PageIntro
        id={titleId}
        numeral={numeral(INTRO)}
        eyebrow={eyebrow}
        headline={assessment.title}
        lead={instruction}
      />

      <section
        id={`${assessment.slug}-questions`}
        className="assessment-questions"
        data-ground="light"
        data-n={numeral(QUESTIONS)}
        aria-label={UI_ASSESSMENT.sectionLabel}
      >
        <div className="shell grid12">
          <div className="p-list assessment-questions__form">
            <AssessmentForm
              assessment={assessment}
              answerTypes={answerTypes}
              disclaimer={disclaimer}
              consultation={consultation}
              enquire={enquire}
            />
          </div>
        </div>
      </section>

      <PrevNextRail {...prevNext} />
      <EnquireBand numeral={numeral(BAND)} />
    </main>
  )
}
