/**
 * The self-assessment scorer's pure core (docs/05 §Self-assessment; ledger,
 * round-1 owner decisions; CONTENT-GAPS C1). Each question is answered on a
 * 1 to 10 severity scale or with yes / no / maybe (`assessment-answers.ts`).
 * Every answer becomes a severity from 1 to 10 (yes 10, maybe 5, no 1, a
 * scale answer as given); the result is their average, placed in the
 * client's three band labels by splitting 1 to 10 evenly. The client's
 * 0 to 15 ranges in `ASSESSMENTS[n].scoring` and the retired
 * `supersededScale` are not read: only the band labels are.
 *
 * Everything is a function of its arguments: the score of an answer sheet,
 * the band an average falls in, the interface labels, and the reducer that
 * is the form's only state. No storage, no network, no clock.
 */
import { ASSESSMENTS } from '@/content/assessments'
import type { AnswerType } from '@/content/assessment-answers'
import { NAV, assessmentHref, routes } from '@/content/nav'
import type { Assessment, BandKey, NavItem } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import type { PrevNext } from '@/lib/prevNext'

export type Scoring = Assessment['scoring']
export type ScoringBand = Scoring['bands'][number]

/** The three words of a yes / no / maybe question, in the order they render. */
export const FACT_ANSWERS = ['yes', 'no', 'maybe'] as const
export type FactAnswer = (typeof FACT_ANSWERS)[number]

export const SCALE_MIN = 1
export const SCALE_MAX = 10
/** 1 to 10, in the order the cells render. */
export const SCALE_VALUES: readonly number[] = Object.freeze(
  Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, i) => SCALE_MIN + i)
)

/** What a yes / no / maybe answer weighs on the 1 to 10 severity scale (owner decision). */
export const FACT_SEVERITY: Readonly<Record<FactAnswer, number>> = { yes: 10, maybe: 5, no: 1 }

/** A number from the scale, a word from yes / no / maybe, or `null` when not yet answered. */
export type Answer = number | FactAnswer | null

export type AssessmentScore = Readonly<{
  answered: number
  /** Average severity to one decimal place; only once every question is answered. */
  average: number | null
  /** Named only once every question is answered. */
  band: ScoringBand | null
}>

/** The bands from least to most concern; the split is even, so the order is all that matters. */
const BAND_ORDER: readonly BandKey[] = ['mild', 'moderate', 'severe']

export const emptyAnswers = (count: number): readonly Answer[] =>
  Object.freeze(Array.from({ length: count }, (): Answer => null))

export const isComplete = (answers: readonly Answer[]): boolean =>
  answers.every((answer) => answer !== null)

const isFactAnswer = (answer: Answer): answer is FactAnswer =>
  typeof answer === 'string' && (FACT_ANSWERS as readonly string[]).includes(answer)

const isScaleAnswer = (answer: Answer): answer is number =>
  typeof answer === 'number' &&
  Number.isInteger(answer) &&
  answer >= SCALE_MIN &&
  answer <= SCALE_MAX

/** True when `answer` is one the question's type offers (or still unanswered). */
export function fitsType(answer: Answer, type: AnswerType): boolean {
  if (answer === null) return true
  return type === 'scale' ? isScaleAnswer(answer) : isFactAnswer(answer)
}

/** The severity of one answer, 1 to 10. */
export function severity(answer: FactAnswer | number): number {
  return typeof answer === 'number' ? answer : FACT_SEVERITY[answer]
}

const toOneDecimal = (value: number): number => Math.round(value * 10) / 10

/**
 * The band an average falls in: 1 to 10 split into three equal parts, so
 * below 4 is the first band, 4 to below 7 the second, 7 and above the third.
 * Null when the bands are not the three the client named.
 */
export function bandForAverage(average: number, bands: readonly ScoringBand[]): ScoringBand | null {
  const width = (SCALE_MAX - SCALE_MIN) / BAND_ORDER.length
  const position = Math.floor((average - SCALE_MIN) / width)
  const key = BAND_ORDER[Math.min(Math.max(position, 0), BAND_ORDER.length - 1)]
  return bands.find((band) => band.key === key) ?? null
}

export function scoreAssessment(
  answers: readonly Answer[],
  types: readonly AnswerType[],
  scoring: Scoring
): AssessmentScore {
  if (answers.length !== types.length) {
    throw new Error(
      `scoreAssessment: ${types.length} questions, received ${answers.length} answers`
    )
  }
  const misfit = answers.findIndex((answer, i) => !fitsType(answer, types[i] ?? 'scale'))
  if (misfit !== -1) {
    throw new Error(
      `scoreAssessment: answer ${misfit + 1} does not fit a ${types[misfit]} question`
    )
  }
  const given = answers.filter((answer): answer is FactAnswer | number => answer !== null)
  if (given.length < answers.length || given.length === 0) {
    return { answered: given.length, average: null, band: null }
  }
  // The band is read from the average as shown, so the two never disagree.
  const average = toOneDecimal(given.map(severity).reduce((a, b) => a + b, 0) / given.length)
  return { answered: given.length, average, band: bandForAverage(average, scoring.bands) }
}

const fill = (template: string, values: Readonly<Record<string, string | number>>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )

/** "3 of 15 answered". */
export const progressLabel = (answered: number, total: number): string =>
  fill(UI_ASSESSMENT.tally, { answered, total })

/** "Average severity 6.2 of 10"; always one decimal place, so 4 reads 4.0. */
export const scoreLabel = (average: number): string =>
  fill(UI_ASSESSMENT.score, { average: average.toFixed(1), max: SCALE_MAX })

/** The word a yes / no / maybe answer shows. */
export const factLabel = (answer: FactAnswer): string => UI_ASSESSMENT[answer]

// ---------------------------------------------------------------------------
// The form's state — a reducer, so the answers live in one immutable value
// ---------------------------------------------------------------------------

export type AssessmentState = Readonly<{
  answers: readonly Answer[]
  revealed: boolean
}>

export type AssessmentAction =
  | Readonly<{ type: 'answer'; index: number; value: FactAnswer | number }>
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
