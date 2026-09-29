import { describe, expect, it } from 'vitest'

import { answerTypesFor } from '@/content/assessment-answers'
import { ASSESSMENTS } from '@/content/assessments'
import { NAV, assessmentHref, routes } from '@/content/nav'
import { QUESTIONS_PER_ASSESSMENT } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import {
  FACT_SEVERITY,
  SCALE_VALUES,
  assessmentPrevNext,
  assessmentReducer,
  bandForAverage,
  emptyAnswers,
  factLabel,
  fitsType,
  initialAssessmentState,
  isComplete,
  progressLabel,
  scoreAssessment,
  scoreLabel,
  severity,
  type Answer,
  type FactAnswer,
} from './assessment'

const [alcohol] = ASSESSMENTS
if (!alcohol) throw new Error('assessments.ts is empty')
const { scoring } = alcohol
const types = answerTypesFor(alcohol.slug)
const N = QUESTIONS_PER_ASSESSMENT

/** Every question answered at one severity: the scale value, or the fact word nearest it. */
const sheetAt = (scale: number, fact: FactAnswer): readonly (FactAnswer | number)[] =>
  types.map((type) => (type === 'scale' ? scale : fact))

describe('severity', () => {
  it('weighs yes as 10, maybe as 5 and no as 1', () => {
    expect(FACT_SEVERITY).toEqual({ yes: 10, maybe: 5, no: 1 })
    expect(severity('yes')).toBe(10)
    expect(severity('maybe')).toBe(5)
    expect(severity('no')).toBe(1)
  })

  it('takes a scale answer as given', () => {
    expect(SCALE_VALUES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const value of SCALE_VALUES) expect(severity(value)).toBe(value)
  })
})

describe('fitsType', () => {
  it('accepts 1 to 10 on a scale question and nothing else', () => {
    expect(fitsType(1, 'scale')).toBe(true)
    expect(fitsType(10, 'scale')).toBe(true)
    expect(fitsType(0, 'scale')).toBe(false)
    expect(fitsType(11, 'scale')).toBe(false)
    expect(fitsType(2.5, 'scale')).toBe(false)
    expect(fitsType('yes', 'scale')).toBe(false)
  })

  it('accepts yes, no and maybe on a fact question and nothing else', () => {
    expect(fitsType('yes', 'yesNoMaybe')).toBe(true)
    expect(fitsType('maybe', 'yesNoMaybe')).toBe(true)
    expect(fitsType('no', 'yesNoMaybe')).toBe(true)
    expect(fitsType(5, 'yesNoMaybe')).toBe(false)
  })

  it('accepts an unanswered question of either type', () => {
    expect(fitsType(null, 'scale')).toBe(true)
    expect(fitsType(null, 'yesNoMaybe')).toBe(true)
  })
})

describe('bandForAverage', () => {
  it.each([
    [1, 'mild'],
    [3.9, 'mild'],
    [4, 'moderate'],
    [6.9, 'moderate'],
    [7, 'severe'],
    [10, 'severe'],
  ])('places an average of %f in the %s band (1 to 10 split evenly)', (average, key) => {
    expect(bandForAverage(average, scoring.bands)?.key).toBe(key)
  })

  it('returns the client’s own label for each band', () => {
    expect(bandForAverage(2, scoring.bands)?.label).toBe('Mild concern')
    expect(bandForAverage(5, scoring.bands)?.label).toBe('Moderate concern')
    expect(bandForAverage(8, scoring.bands)?.label).toBe('Severe concern')
  })
})

describe('scoreAssessment', () => {
  it('names no average and no band when nothing is answered', () => {
    expect(scoreAssessment(emptyAnswers(N), types, scoring)).toEqual({
      answered: 0,
      average: null,
      band: null,
    })
  })

  it('names no average and no band while any question is unanswered', () => {
    const answers: readonly Answer[] = [...sheetAt(10, 'yes').slice(0, N - 1), null]
    expect(scoreAssessment(answers, types, scoring)).toEqual({
      answered: N - 1,
      average: null,
      band: null,
    })
  })

  it('scores the least severe sheet 1.0, mild', () => {
    const score = scoreAssessment(sheetAt(1, 'no'), types, scoring)
    expect(score).toMatchObject({ answered: N, average: 1 })
    expect(score.band?.key).toBe('mild')
  })

  it('scores the most severe sheet 10.0, severe', () => {
    const score = scoreAssessment(sheetAt(10, 'yes'), types, scoring)
    expect(score).toMatchObject({ answered: N, average: 10 })
    expect(score.band?.key).toBe('severe')
  })

  it('scores maybe and a middle scale value 5.0, moderate', () => {
    const score = scoreAssessment(sheetAt(5, 'maybe'), types, scoring)
    expect(score.average).toBe(5)
    expect(score.band?.key).toBe('moderate')
  })

  it('averages a mixed sheet to one decimal place', () => {
    // alcohol: six scale questions at 3 (18); of the nine yes / no / maybe,
    // questions 2, 5, 6 and 7 yes (40) and the five after them no (5): 63 / 15
    const answers = types.map((type, i) => (type === 'scale' ? 3 : i < 7 ? 'yes' : 'no'))
    expect(types.filter((type) => type === 'scale')).toHaveLength(6)
    expect(scoreAssessment(answers, types, scoring).average).toBe(4.2)
    expect(scoreAssessment(answers, types, scoring).band?.key).toBe('moderate')
  })

  it('bands the average as shown, at both boundaries', () => {
    // 60 / 15 = 4.0 exactly; 59 / 15 = 3.93, shown 3.9
    const at = (total: number): readonly (FactAnswer | number)[] => {
      const base = sheetAt(1, 'no') // 15
      const scaleAt = types.flatMap((type, i) => (type === 'scale' ? [i] : []))
      let remaining = total - N
      return base.map((answer, i) => {
        if (!scaleAt.includes(i) || remaining <= 0) return answer
        const add = Math.min(9, remaining)
        remaining -= add
        return 1 + add
      })
    }
    expect(scoreAssessment(at(60), types, scoring)).toMatchObject({ average: 4 })
    expect(scoreAssessment(at(60), types, scoring).band?.key).toBe('moderate')
    expect(scoreAssessment(at(59), types, scoring)).toMatchObject({ average: 3.9 })
    expect(scoreAssessment(at(59), types, scoring).band?.key).toBe('mild')
  })

  it('refuses an answer sheet of the wrong length', () => {
    expect(() => scoreAssessment([5, 'yes'], types, scoring)).toThrow(/15/)
  })

  it('refuses an answer that does not fit its question', () => {
    const answers = sheetAt(5, 'maybe').map((answer, i) => (i === 1 ? 5 : answer))
    expect(types[1]).toBe('yesNoMaybe')
    expect(() => scoreAssessment(answers, types, scoring)).toThrow(/answer 2/)
  })
})

describe('isComplete', () => {
  it('is true only when every question has an answer', () => {
    expect(isComplete(sheetAt(3, 'no'))).toBe(true)
    expect(isComplete([...sheetAt(3, 'no').slice(1), null])).toBe(false)
    expect(isComplete(emptyAnswers(N))).toBe(false)
  })
})

describe('labels', () => {
  it('fills the tally template', () => {
    expect(progressLabel(3, N)).toBe(
      UI_ASSESSMENT.tally.replace('{answered}', '3').replace('{total}', String(N))
    )
  })

  it('fills the score template with one decimal place', () => {
    expect(scoreLabel(6.2)).toBe(
      UI_ASSESSMENT.score.replace('{average}', '6.2').replace('{max}', '10')
    )
    expect(scoreLabel(4)).toContain('4.0')
  })

  it('reads each fact answer in the interface’s words', () => {
    expect(factLabel('yes')).toBe(UI_ASSESSMENT.yes)
    expect(factLabel('no')).toBe(UI_ASSESSMENT.no)
    expect(factLabel('maybe')).toBe(UI_ASSESSMENT.maybe)
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
    const next = assessmentReducer(initial, { type: 'answer', index: 2, value: 7 })
    expect(next.answers[2]).toBe(7)
    expect(next.answers).not.toBe(initial.answers)
    expect(initial.answers[2]).toBeNull()
    expect(Object.isFrozen(next.answers)).toBe(true)
  })

  it('ignores an answer outside the sheet', () => {
    expect(assessmentReducer(initial, { type: 'answer', index: N, value: 'yes' })).toBe(initial)
    expect(assessmentReducer(initial, { type: 'answer', index: -1, value: 'yes' })).toBe(initial)
  })

  it('reveals only once every question is answered', () => {
    const partial = assessmentReducer(initial, { type: 'answer', index: 0, value: 4 })
    expect(assessmentReducer(partial, { type: 'reveal' })).toBe(partial)
    const complete = sheetAt(6, 'yes').reduce(
      (state, value, index) => assessmentReducer(state, { type: 'answer', index, value }),
      initial
    )
    expect(assessmentReducer(complete, { type: 'reveal' }).revealed).toBe(true)
  })

  it('hides the result again when an answer changes after the reveal', () => {
    const complete = sheetAt(6, 'yes').reduce(
      (state, value, index) => assessmentReducer(state, { type: 'answer', index, value }),
      initial
    )
    const revealed = assessmentReducer(complete, { type: 'reveal' })
    const changed = assessmentReducer(revealed, { type: 'answer', index: 0, value: 2 })
    expect(changed.revealed).toBe(false)
  })

  it('resets to the initial state', () => {
    const complete = sheetAt(10, 'yes').reduce(
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
