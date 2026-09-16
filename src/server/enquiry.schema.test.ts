import { describe, expect, it } from 'vitest'

import { ENQUIRY, ENQUIRY_LIMITS } from '@/content/enquiry'
import {
  ENQUIRY_MAX_AGE_MS,
  ENQUIRY_MIN_ELAPSED_MS,
  checkTiming,
  enquiryFormSchema,
  enquirySchema,
  formDataToEnquiryInput,
  parseEnquiry,
} from './enquiry.schema'

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  telephone: '+44 20 7946 0958',
  enquiringFor: 'self',
  message: 'I would like to talk about treatment options.',
  preferredContact: 'email',
  website: '',
  startedAt: '1700000000000',
} as const

describe('enquirySchema', () => {
  it('accepts a complete enquiry and coerces the timing token to a number', () => {
    const result = enquirySchema.safeParse(VALID)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.startedAt).toBe(1700000000000)
    expect(result.data.telephone).toBe('+44 20 7946 0958')
  })

  it.each(['+44 20 7946 0958', '+1 (778) 679-3369', '+52 984 123 4567'])(
    'accepts %s, a number with its country code',
    (telephone) => {
      expect(enquirySchema.safeParse({ ...VALID, telephone }).success).toBe(true)
    }
  )

  it('treats an empty telephone as absent', () => {
    const result = enquirySchema.safeParse({ ...VALID, telephone: '' })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.telephone).toBeUndefined()
  })

  it('treats an empty timing token as absent', () => {
    const result = enquirySchema.safeParse({ ...VALID, startedAt: '' })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.startedAt).toBeUndefined()
  })

  it('rejects an enquiry whose honeypot is filled', () => {
    const result = enquirySchema.safeParse({ ...VALID, website: 'https://spam.example' })

    expect(result.success).toBe(false)
  })

  it.each([
    ['name', '', ENQUIRY.errors.name],
    ['name', 'x'.repeat(ENQUIRY_LIMITS.nameMax + 1), ENQUIRY.errors.nameLength],
    ['email', 'not-an-address', ENQUIRY.errors.email],
    ['telephone', 'call me', ENQUIRY.errors.telephone],
    ['telephone', '020 7946 0958', ENQUIRY.errors.telephone],
    ['telephone', '+', ENQUIRY.errors.telephone],
    ['enquiringFor', 'employer', ENQUIRY.errors.enquiringFor],
    ['message', '   ', ENQUIRY.errors.message],
    ['message', 'x'.repeat(ENQUIRY_LIMITS.messageMax + 1), ENQUIRY.errors.messageLength],
    ['preferredContact', 'carrier pigeon', ENQUIRY.errors.preferredContact],
  ])('reports the content-layer message for an invalid %s', (field, value, message) => {
    const parsed = parseEnquiry({ ...VALID, [field]: value })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.fieldErrors[field as keyof typeof parsed.fieldErrors]).toBe(message)
  })

  it('trims surrounding whitespace from the name and message', () => {
    const parsed = parseEnquiry({ ...VALID, name: '  Ada  ', message: '  Hello.  ' })

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.name).toBe('Ada')
    expect(parsed.data.message).toBe('Hello.')
  })

  it('reports every failing field at once, first message per field', () => {
    const parsed = parseEnquiry({ ...VALID, name: '', email: 'nope', message: '' })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(Object.keys(parsed.fieldErrors).sort()).toEqual(['email', 'message', 'name'])
  })

  it('rejects a non-object input without throwing', () => {
    expect(parseEnquiry(null).ok).toBe(false)
    expect(parseEnquiry('string').ok).toBe(false)
  })
})

describe('enquiryFormSchema', () => {
  it('validates only the fields a person sees', () => {
    const result = enquiryFormSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      telephone: '',
      enquiringFor: 'family',
      message: 'Hello.',
      preferredContact: 'telephone',
    })

    expect(result.success).toBe(true)
    expect(Object.keys(enquiryFormSchema.shape).sort()).toEqual([
      'email',
      'enquiringFor',
      'message',
      'name',
      'preferredContact',
      'telephone',
    ])
  })
})

describe('formDataToEnquiryInput', () => {
  it('reads every field from FormData as a string', () => {
    const formData = new FormData()
    for (const [key, value] of Object.entries(VALID)) formData.set(key, value)

    expect(formDataToEnquiryInput(formData)).toEqual(VALID)
  })

  it('maps a missing field to an empty string and ignores file entries', () => {
    const formData = new FormData()
    formData.set('name', 'Ada')
    formData.set('message', new Blob(['x']), 'x.txt')

    const input = formDataToEnquiryInput(formData)

    expect(input.name).toBe('Ada')
    expect(input.email).toBe('')
    expect(input.message).toBe('')
  })
})

describe('checkTiming', () => {
  const now = 1_700_000_000_000

  it('accepts a token between the minimum and the maximum age', () => {
    expect(checkTiming(now - ENQUIRY_MIN_ELAPSED_MS, now)).toBe('ok')
    expect(checkTiming(now - ENQUIRY_MAX_AGE_MS, now)).toBe('ok')
  })

  it('rejects a submission completed too quickly', () => {
    expect(checkTiming(now - ENQUIRY_MIN_ELAPSED_MS + 1, now)).toBe('too-fast')
  })

  it('rejects a token from the future as too fast', () => {
    expect(checkTiming(now + 5_000, now)).toBe('too-fast')
  })

  it('rejects a token older than the maximum age', () => {
    expect(checkTiming(now - ENQUIRY_MAX_AGE_MS - 1, now)).toBe('expired')
  })

  it('reports an absent token so the caller can decide', () => {
    expect(checkTiming(undefined, now)).toBe('absent')
  })
})
