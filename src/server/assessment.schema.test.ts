import { describe, expect, it } from 'vitest'

import { answerTypesFor } from '@/content/assessment-answers'
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import {
  CONSENT_VALUE,
  assessmentSendFormSchema,
  formDataToAssessmentSendInput,
  parseAnswerSheet,
  parseAssessmentSend,
} from './assessment.schema'

const E = ASSESSMENT_SEND.errors
const SHEET = answerTypesFor('alcohol').map((type) => (type === 'scale' ? 5 : 'maybe'))

const input = (overrides: Record<string, string> = {}) => ({
  name: 'Sam Rivera',
  email: 'sam@example.com',
  telephone: '',
  preferredContact: 'email',
  consent: CONSENT_VALUE,
  slug: 'alcohol',
  answers: JSON.stringify(SHEET),
  website: '',
  startedAt: '1700000000000',
  ...overrides,
})

describe('parseAssessmentSend', () => {
  it('accepts a complete submission and reads the timing token as a number', () => {
    const parsed = parseAssessmentSend(input())

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data).toMatchObject({ name: 'Sam Rivera', telephone: undefined })
    expect(parsed.data.startedAt).toBe(1_700_000_000_000)
  })

  it('requires the detail for the preferred channel, and only that one', () => {
    expect(
      parseAssessmentSend(
        input({ email: '', preferredContact: 'email', telephone: '+44 20 7946 0958' })
      )
    ).toMatchObject({ ok: false, fieldErrors: { email: E.email } })
    expect(parseAssessmentSend(input({ preferredContact: 'telephone' }))).toMatchObject({
      ok: false,
      fieldErrors: { telephone: E.telephone },
    })
    expect(
      parseAssessmentSend(
        input({ email: '', preferredContact: 'telephone', telephone: '+1 555 010 0199' })
      ).ok
    ).toBe(true)
  })

  it('validates an optional detail when given', () => {
    expect(parseAssessmentSend(input({ telephone: '555' }))).toMatchObject({
      ok: false,
      fieldErrors: { telephone: E.telephone },
    })
  })

  it('requires a name, a preference and the consent, with the content-layer messages', () => {
    const parsed = parseAssessmentSend(input({ name: ' ', preferredContact: '', consent: '' }))

    expect(parsed).toMatchObject({
      ok: false,
      honeypot: false,
      malformed: false,
      fieldErrors: { name: E.name, preferredContact: E.preferredContact, consent: E.consent },
    })
  })

  it('flags a filled honeypot and a missing timing token apart from field errors', () => {
    expect(parseAssessmentSend(input({ website: 'x' }))).toMatchObject({
      ok: false,
      honeypot: true,
    })
    expect(parseAssessmentSend(input({ startedAt: '' }))).toMatchObject({
      ok: false,
      malformed: true,
      fieldErrors: {},
    })
  })
})

describe('assessmentSendFormSchema (the browser half)', () => {
  it('reads React Hook Form’s ticked and unticked checkbox', () => {
    const values = { name: 'S', email: 's@example.com', preferredContact: 'email' }
    expect(assessmentSendFormSchema.safeParse({ ...values, consent: 'yes' }).success).toBe(true)
    expect(assessmentSendFormSchema.safeParse({ ...values, consent: true }).success).toBe(true)
    expect(assessmentSendFormSchema.safeParse({ ...values, consent: false }).success).toBe(false)
  })
})

describe('formDataToAssessmentSendInput', () => {
  it('reads every expected key, missing ones as empty strings, and nothing else', () => {
    const data = new FormData()
    data.set('name', 'Sam')
    data.set('extra', 'ignored')

    const result = formDataToAssessmentSendInput(data)

    expect(result.name).toBe('Sam')
    expect(result.consent).toBe('')
    expect(result).not.toHaveProperty('extra')
  })
})

describe('parseAnswerSheet', () => {
  it('returns the questionnaire and the answers for a complete sheet that fits it', () => {
    const sheet = parseAnswerSheet('alcohol', JSON.stringify(SHEET))

    expect(sheet?.assessment.slug).toBe('alcohol')
    expect(sheet?.answers).toEqual(SHEET)
  })

  it.each([
    ['an unknown questionnaire', 'nope', JSON.stringify(SHEET)],
    ['JSON that does not parse', 'alcohol', '[1,'],
    ['JSON that is not an array', 'alcohol', '{"0":5}'],
    ['too few answers', 'alcohol', JSON.stringify(SHEET.slice(1))],
    ['an unanswered question', 'alcohol', JSON.stringify([null, ...SHEET.slice(1)])],
    ['a word on a scale question', 'alcohol', JSON.stringify(['yes', ...SHEET.slice(1)])],
    ['a number off the scale', 'alcohol', JSON.stringify([11, ...SHEET.slice(1)])],
    ['a fraction', 'alcohol', JSON.stringify([5.5, ...SHEET.slice(1)])],
    ['markup in an answer', 'alcohol', JSON.stringify(['<b>', ...SHEET.slice(1)])],
  ])('refuses %s', (_label, slug, raw) => {
    expect(parseAnswerSheet(slug, raw)).toBeNull()
  })
})
