// @ts-expect-error -- Vitest is installed by task 4; remove this directive then.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { env, isIndexable, parseEnv, resetEnvCache } from './env'

const STAGING_URL = 'https://thenewpractice-staging.kidusder.com'

describe('parseEnv', () => {
  it('applies development defaults when nothing is set', () => {
    // Arrange
    const raw = {}

    // Act
    const parsed = parseEnv(raw)

    // Assert
    expect(parsed).toEqual({
      SITE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    })
  })

  it('returns the staging configuration verbatim', () => {
    const parsed = parseEnv({ SITE_ENV: 'staging', NEXT_PUBLIC_SITE_URL: STAGING_URL })

    expect(parsed.SITE_ENV).toBe('staging')
    expect(parsed.NEXT_PUBLIC_SITE_URL).toBe(STAGING_URL)
  })

  it('strips a trailing slash from the site URL so paths can be appended', () => {
    const parsed = parseEnv({ NEXT_PUBLIC_SITE_URL: `${STAGING_URL}/` })

    expect(parsed.NEXT_PUBLIC_SITE_URL).toBe(STAGING_URL)
  })

  it('treats an empty string as unset', () => {
    const parsed = parseEnv({ SITE_ENV: '', NEXT_PUBLIC_SITE_URL: '', RESEND_API_KEY: '' })

    expect(parsed.SITE_ENV).toBe('development')
    expect(parsed.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
    expect(parsed.RESEND_API_KEY).toBeUndefined()
  })

  it('keeps the optional mail variables when present', () => {
    const parsed = parseEnv({
      RESEND_API_KEY: 're_test',
      ENQUIRY_TO_EMAIL: 'enquiries@example.com',
    })

    expect(parsed.RESEND_API_KEY).toBe('re_test')
    expect(parsed.ENQUIRY_TO_EMAIL).toBe('enquiries@example.com')
  })

  it('throws naming the variable when SITE_ENV is not a known target', () => {
    expect(() => parseEnv({ SITE_ENV: 'prod' })).toThrow(/SITE_ENV/)
  })

  it('throws when the site URL is not an http(s) URL', () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'thenewpractice.health' })).toThrow(
      /NEXT_PUBLIC_SITE_URL/
    )
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'ftp://thenewpractice.health' })).toThrow(
      /NEXT_PUBLIC_SITE_URL/
    )
  })

  it('throws when the enquiry recipient is not an email address', () => {
    expect(() => parseEnv({ ENQUIRY_TO_EMAIL: 'front desk' })).toThrow(/ENQUIRY_TO_EMAIL/)
  })

  it('does not mutate the record it is given', () => {
    const raw = { SITE_ENV: 'staging', RESEND_API_KEY: '' }

    parseEnv(raw)

    expect(raw).toEqual({ SITE_ENV: 'staging', RESEND_API_KEY: '' })
  })
})

describe('env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    resetEnvCache()
  })

  it('reads process.env once and memoises the result', () => {
    vi.stubEnv('SITE_ENV', 'staging')
    resetEnvCache()

    const first = env()
    vi.stubEnv('SITE_ENV', 'production')
    const second = env()

    expect(first.SITE_ENV).toBe('staging')
    expect(second).toBe(first)
  })

  it('re-reads process.env after the cache is reset', () => {
    vi.stubEnv('SITE_ENV', 'staging')
    resetEnvCache()
    env()

    vi.stubEnv('SITE_ENV', 'production')
    resetEnvCache()

    expect(env().SITE_ENV).toBe('production')
  })
})

describe('isIndexable', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    resetEnvCache()
  })

  it.each([
    ['development', false],
    ['staging', false],
    ['production', true],
  ])('for SITE_ENV=%s returns %s', (siteEnv: string, expected: boolean) => {
    vi.stubEnv('SITE_ENV', siteEnv)
    resetEnvCache()

    expect(isIndexable()).toBe(expected)
  })

  it('is false when SITE_ENV is unset', () => {
    vi.stubEnv('SITE_ENV', '')
    resetEnvCache()

    expect(isIndexable()).toBe(false)
  })
})
