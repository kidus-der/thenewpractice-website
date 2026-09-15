import { afterEach, describe, expect, it, vi } from 'vitest'

import { resetEnvCache } from '@/lib/env'
import { INITIAL_ENQUIRY_RESULT } from './enquiry.handler'
import { ENQUIRY_MIN_ELAPSED_MS } from './enquiry.schema'
import { submitEnquiry } from './enquiry.action'

afterEach(() => {
  resetEnvCache()
  vi.restoreAllMocks()
})

describe('submitEnquiry (server action)', () => {
  it('runs the handler against the process configuration — the log adapter in development', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const data = new FormData()
    data.set('name', 'Ada')
    data.set('email', 'ada@example.com')
    data.set('enquiringFor', 'professional')
    data.set('message', 'Hello.')
    data.set('preferredContact', 'email')
    data.set('website', '')
    data.set('startedAt', String(Date.now() - ENQUIRY_MIN_ELAPSED_MS - 1))

    const result = await submitEnquiry(INITIAL_ENQUIRY_RESULT, data)

    expect(result).toEqual({ status: 'sent' })
    const written = stdout.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('"event":"enquiry.logged"')
    expect(written).not.toContain('ada@example.com')
  })

  it('returns invalid for an empty submission without throwing', async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    const result = await submitEnquiry(INITIAL_ENQUIRY_RESULT, new FormData())

    expect(result.status).toBe('invalid')
  })
})
