/**
 * The self-assessment scorer's pure core (docs/05 §Self-assessment; ledger,
 * owner decisions). Each questionnaire carries its own scoring in
 * `ASSESSMENTS[n].scoring` — one point per "yes", 0–15, three bands — and
 * nothing here reads the retired `supersededScale`.
 *
 * Everything is a function of its arguments: the score of an answer sheet,
 * the band a total falls in, the interface labels, and the reducer that is
 * the form's only state. No storage, no network, no clock.
 */
import { ASSESSMENTS } from '@/content/assessments'
import { NAV, assessmentHref, routes } from '@/content/nav'
import type { Assessment, NavItem } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import type { PrevNext } from '@/lib/prevNext'

export type Scoring = Assessment['scoring']
export type ScoringBand = Scoring['bands'][number]
/** `true` = yes, `false` = no, `null` = not yet answered. */
export type Answer = boolean | null

export type AssessmentScore = Readonly<{
  answered: number
  total: number
  /** Named only once every question is answered. */
  band: ScoringBand | null
}>

export const emptyAnswers = (count: number): readonly Answer[] =>
  Object.freeze(Array.from({ length: count }, (): Answer => null))

export const isComplete = (answers: readonly Answer[]): boolean =>
  answers.every((answer) => answer !== null)

/** The band whose range holds `total`, or null when no band does. */
export function bandFor(total: number, bands: readonly ScoringBand[]): ScoringBand | null {
  return bands.find((band) => total >= band.min && total <= band.max) ?? null
}

export function scoreAssessment(answers: readonly Answer[], scoring: Scoring): AssessmentScore {
  if (answers.length !== scoring.max) {
    throw new Error(`scoreAssessment: expected ${scoring.max} answers, received ${answers.length}`)
  }
  const answered = answers.filter((answer) => answer !== null).length
  const total = answers.filter((answer) => answer === true).length * scoring.perYes
  const band = isComplete(answers) ? bandFor(total, scoring.bands) : null
  return { answered, total, band }
}

const fill = (template: string, values: Readonly<Record<string, number>>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )

/** "3 of 15 answered". */
export const progressLabel = (answered: number, total: number): string =>
  fill(UI_ASSESSMENT.tally, { answered, total })

/** "Score 6 of 15". */
export const scoreLabel = (total: number, max: number): string =>
  fill(UI_ASSESSMENT.score, { total, max })

// ---------------------------------------------------------------------------
// The form's state — a reducer, so the answers live in one immutable value
// ---------------------------------------------------------------------------

export type AssessmentState = Readonly<{
  answers: readonly Answer[]
  revealed: boolean
}>

export type AssessmentAction =
  | Readonly<{ type: 'answer'; index: number; value: boolean }>
  | Readonly<{ type: 'reveal' }>
  | Readonly<{ type: 'reset' }>

export const initialAssessmentState = (count: number): AssessmentState => ({
  answers: emptyAnswers(count),
  revealed: false,
})

export function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction
): AssessmentState {
  switch (action.type) {
    case 'answer': {
      if (action.index < 0 || action.index >= state.answers.length) return state
      const answers = Object.freeze(
        state.answers.map((answer, i) => (i === action.index ? action.value : answer))
      )
      // A changed answer withdraws a result that no longer describes the sheet.
      return { answers, revealed: false }
    }
    case 'reveal':
      return isComplete(state.answers) ? { ...state, revealed: true } : state
    case 'reset':
      return initialAssessmentState(state.answers.length)
  }
}

// ---------------------------------------------------------------------------
// The rail — previous / next questionnaire, the ends wrapping to the index
// ---------------------------------------------------------------------------

const toNavItem = (assessment: Assessment): NavItem => ({
  label: assessment.title,
  href: assessmentHref(assessment.slug),
})

function indexItem(): NavItem {
  const item = NAV.primary.find((entry) => entry.href === routes.selfAssessment)
  if (!item) throw new Error('nav.ts: the primary navigation has no Self-Assessment item')
  return item
}

/** The neighbours of a questionnaire in document order; either end is the index page. */
export function assessmentPrevNext(
  slug: string,
  assessments: readonly Assessment[] = ASSESSMENTS
): PrevNext {
  const position = assessments.findIndex((assessment) => assessment.slug === slug)
  if (position === -1) return {}
  const before = assessments[position - 1]
  const after = assessments[position + 1]
  return {
    prev: before ? toNavItem(before) : indexItem(),
    next: after ? toNavItem(after) : indexItem(),
  }
}
