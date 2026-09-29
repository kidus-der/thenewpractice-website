import { describe, expect, it } from 'vitest'

import { ANSWER_TYPES, answerTypesFor } from './assessment-answers'
import { ASSESSMENTS } from './assessments'

/** Questions that ask whether something has happened: always yes / no / maybe. */
const ASKS_A_FACT = /^(Have|Has) /

describe('ANSWER_TYPES', () => {
  it('gives every questionnaire one answer type per question and nothing else', () => {
    expect(Object.keys(ANSWER_TYPES).sort()).toEqual(ASSESSMENTS.map((a) => a.slug).sort())
    for (const assessment of ASSESSMENTS) {
      expect(answerTypesFor(assessment.slug), assessment.slug).toHaveLength(
        assessment.questions.length
      )
    }
  })

  it('answers every "Have you" and "Has it" question with yes, no or maybe', () => {
    const misfiled = ASSESSMENTS.flatMap((assessment) =>
      assessment.questions
        .map((question, i) => ({ question, type: answerTypesFor(assessment.slug)[i] }))
        .filter(({ question, type }) => ASKS_A_FACT.test(question) && type !== 'yesNoMaybe')
        .map(({ question }) => `${assessment.slug}: ${question}`)
    )
    expect(misfiled).toEqual([])
  })

  it('uses the severity scale where most questions ask about degree or frequency', () => {
    const all = Object.values(ANSWER_TYPES).flat()
    const scale = all.filter((type) => type === 'scale').length
    expect(scale).toBe(105)
    expect(all.length - scale).toBe(45)
  })

  it('throws for a questionnaire it does not know', () => {
    expect(() => answerTypesFor('nowhere')).toThrow(/nowhere/)
  })
})
