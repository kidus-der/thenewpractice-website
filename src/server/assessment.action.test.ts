import { afterEach, describe, expect, it, vi } from 'vitest'

import { answerTypesFor } from '@/content/assessment-answers'
import { resetEnvCache } from '@/lib/env'
import { INITIAL_ASSESSMENT_SEND_RESULT } from './assessment.handler'
import { sendAssessment } from './assessment.action'
import { ENQUIRY_MIN_ELAPSED_MS } from './enquiry.schema'

afterEach(() => {
  resetEnvCache()
  vi.restoreAllMocks()
})

describe('sendAssessment (server action)', () => {
  it('runs the handler against the process configuration: the log adapter in development', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const data = new FormData()
    data.set('name', 'Sam')
    data.set('email', 'sam@example.com')
    data.set('preferredContact', 'email')
    data.set('consent', 'yes')
    data.set('slug', 'work')
    data.set(
      'answers',
      JSON.stringify(answerTypesFor('work').map((t) => (t === 'scale' ? 3 : 'no')))
    )
    data.set('website', '')
    data.set('startedAt', String(Date.now() - ENQUIRY_MIN_ELAPSED_MS - 1))

    const result = await sendAssessment(INITIAL_ASSESSMENT_SEND_RESULT, data)

    expect(result).toEqual({ status: 'sent' })
    const written = stdout.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('"event":"assessment.logged"')
    expect(written).not.toContain('sam@example.com')
  })

  it('returns failed for an empty submission without throwing', async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    const result = await sendAssessment(INITIAL_ASSESSMENT_SEND_RESULT, new FormData())

    expect(result.status).toBe('failed')
  })
})
