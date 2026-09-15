import { describe, expect, it } from 'vitest'

import { ASSESSMENTS } from '@/content/assessments'
import { NAV, assessmentHref, routes } from '@/content/nav'
import { QUESTIONS_PER_ASSESSMENT } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import {
  assessmentPrevNext,
  assessmentReducer,
  bandFor,
  emptyAnswers,
  initialAssessmentState,
  isComplete,
  progressLabel,
  scoreAssessment,
  scoreLabel,
  type Answer,
} from './assessment'

const [alcohol] = ASSESSMENTS
if (!alcohol) throw new Error('assessments.ts is empty')
const { scoring } = alcohol
const N = QUESTIONS_PER_ASSESSMENT

/** `yes` answers, then `no` for the rest. */
const yesTimes = (count: number): readonly boolean[] =>
  Array.from({ length: N }, (_, i) => i < count)

describe('bandFor', () => {
  it.each([
    [0, 'mild'],
    [4, 'mild'],
    [5, 'moderate'],
    [9, 'moderate'],
    [10, 'severe'],
    [15, 'severe'],
  ])('places a total of %i in the %s band', (total, key) => {
    expect(bandFor(total, scoring.bands)?.key).toBe(key)
  })

  it('returns null outside every band', () => {
    expect(bandFor(-1, scoring.bands)).toBeNull()
    expect(bandFor(16, scoring.bands)).toBeNull()
  })
})

describe('scoreAssessment', () => {
  it('counts nothing and names no band when nothing is answered', () => {
    expect(scoreAssessment(emptyAnswers(N), scoring)).toEqual({ answered: 0, total: 0, band: null })
  })

  it('names no band while any question is unanswered', () => {
    const answers: readonly Answer[] = [...yesTimes(N).slice(0, N - 1), null]
    const score = scoreAssessment(answers, scoring)
    expect(score.answered).toBe(N - 1)
    expect(score.total).toBe(N - 1)
    expect(score.band).toBeNull()
  })

  it('scores every yes as severe', () => {
    const score = scoreAssessment(yesTimes(N), scoring)
    expect(score).toMatchObject({ answered: N, total: N })
    expect(score.band?.key).toBe('severe')
  })

  it('scores every no as mild', () => {
    const score = scoreAssessment(yesTimes(0), scoring)
    expect(score).toMatchObject({ answered: N, total: 0 })
    expect(score.band?.key).toBe('mild')
  })

  it('scores six yeses as moderate, four as mild, ten as severe', () => {
    expect(scoreAssessment(yesTimes(6), scoring).band?.key).toBe('moderate')
    expect(scoreAssessment(yesTimes(4), scoring).band?.key).toBe('mild')
    expect(scoreAssessment(yesTimes(10), scoring).band?.key).toBe('severe')
  })

  it('refuses an answer sheet of the wrong length', () => {
    expect(() => scoreAssessment([true, false], scoring)).toThrow(/15/)
  })
})

describe('isComplete', () => {
  it('is true only when every answer is a boolean', () => {
    expect(isComplete(yesTimes(3))).toBe(true)
    expect(isComplete([...yesTimes(3).slice(1), null])).toBe(false)
    expect(isComplete(emptyAnswers(N))).toBe(false)
  })
})

describe('labels', () => {
  it('fills the tally template', () => {
    expect(progressLabel(3, N)).toBe(
      UI_ASSESSMENT.tally.replace('{answered}', '3').replace('{total}', String(N))
    )
  })

  it('fills the score template', () => {
    expect(scoreLabel(6, N)).toBe(
      UI_ASSESSMENT.score.replace('{total}', '6').replace('{max}', String(N))
    )
  })
})

describe('assessmentReducer', () => {
  const initial = initialAssessmentState(N)

  it('starts with every answer null and the result hidden', () => {
    expect(initial.answers).toHaveLength(N)
    expect(initial.answers.every((a) => a === null)).toBe(true)
    expect(initial.revealed).toBe(false)
  })

  it('records an answer in a new array and leaves the previous state untouched', () => {
    const next = assessmentReducer(initial, { type: 'answer', index: 2, value: true })
    expect(next.answers[2]).toBe(true)
    expect(next.answers).not.toBe(initial.answers)
    expect(initial.answers[2]).toBeNull()
    expect(Object.isFrozen(next.answers)).toBe(true)
  })

  it('ignores an answer outside the sheet', () => {
    expect(assessmentReducer(initial, { type: 'answer', index: N, value: true })).toBe(initial)
    expect(assessmentReducer(initial, { type: 'answer', index: -1, value: true })).toBe(initial)
  })

  it('reveals only once every question is answered', () => {
    const partial = assessmentReducer(initial, { type: 'answer', index: 0, value: true })
    expect(assessmentReducer(partial, { type: 'reveal' })).toBe(partial)
    const complete = yesTimes(6).reduce(
      (state, value, index) => assessmentReducer(state, { type: 'answer', index, value }),
      initial
    )
    expect(assessmentReducer(complete, { type: 'reveal' }).revealed).toBe(true)
  })

  it('hides the result again when an answer changes after the reveal', () => {
    const complete = yesTimes(6).reduce(
      (state, value, index) => assessmentReducer(state, { type: 'answer', index, value }),
      initial
    )
    const revealed = assessmentReducer(complete, { type: 'reveal' })
    const changed = assessmentReducer(revealed, { type: 'answer', index: 0, value: false })
    expect(changed.revealed).toBe(false)
  })

  it('resets to the initial state', () => {
    const complete = yesTimes(N).reduce(
      (state, value, index) => assessmentReducer(state, { type: 'answer', index, value }),
      initial
    )
    const revealed = assessmentReducer(complete, { type: 'reveal' })
    expect(assessmentReducer(revealed, { type: 'reset' })).toEqual(initial)
  })
})

describe('assessmentPrevNext', () => {
  const index = NAV.primary.find((item) => item.href === routes.selfAssessment)
  if (!index) throw new Error('nav.ts has no Self-Assessment item')
  const first = ASSESSMENTS[0]
  const second = ASSESSMENTS[1]
  const last = ASSESSMENTS.at(-1)
  const penultimate = ASSESSMENTS.at(-2)
  if (!first || !second || !last || !penultimate) throw new Error('fewer than two assessments')

  it('wraps the first questionnaire back to the index', () => {
    const { prev, next } = assessmentPrevNext(first.slug)
    expect(prev).toEqual(index)
    expect(next).toEqual({ label: second.title, href: assessmentHref(second.slug) })
  })

  it('wraps the last questionnaire forward to the index', () => {
    const { prev, next } = assessmentPrevNext(last.slug)
    expect(prev).toEqual({ label: penultimate.title, href: assessmentHref(penultimate.slug) })
    expect(next).toEqual(index)
  })

  it('returns nothing for an unknown slug', () => {
    expect(assessmentPrevNext('nowhere')).toEqual({})
  })
})
