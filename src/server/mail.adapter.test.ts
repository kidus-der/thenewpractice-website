import { describe, expect, it, vi } from 'vitest'

const resendMock = vi.hoisted(() => ({ send: vi.fn(), construct: vi.fn() }))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendMock.send }
    constructor(apiKey: string) {
      resendMock.construct(apiKey)
    }
  },
}))

import { BRAND } from '@/content/brand'
import { ENQUIRY } from '@/content/enquiry'
import { createLogger, type Logger } from '@/lib/logger'
import type { Env } from '@/lib/env'
import {
  createLogAdapter,
  createMailAdapter,
  createResendAdapter,
  defaultFromAddress,
  renderEnquiryText,
  type Enquiry,
  type ResendClient,
} from './mail.adapter'

const ENQUIRY_FIXTURE: Enquiry = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  telephone: '+44 20 7946 0958',
  enquiringFor: 'family',
  message: 'A few words about the situation.\nSecond line.',
  preferredContact: 'telephone',
}

const TO = 'enquiries@example.com'
const FROM = 'The New Practice <enquiries@thenewpractice.health>'

function captureLogger(): { logger: Logger; lines: () => readonly Record<string, unknown>[] } {
  const raw: string[] = []
  const logger = createLogger({ write: (line) => void raw.push(line) })
  return { logger, lines: () => raw.map((l) => JSON.parse(l) as Record<string, unknown>) }
}

function fakeClient(
  result: Awaited<ReturnType<ResendClient['emails']['send']>> | Error
): ResendClient & { calls: unknown[] } {
  const calls: unknown[] = []
  return {
    calls,
    emails: {
      send: vi.fn(async (payload: unknown) => {
        calls.push(payload)
        if (result instanceof Error) throw result
        return result
      }),
    },
  }
}

describe('renderEnquiryText', () => {
  it('lays out every field under its label, in form order', () => {
    const text = renderEnquiryText(ENQUIRY_FIXTURE)

    const order = [
      ENQUIRY.fields.name,
      ENQUIRY.fields.email,
      ENQUIRY.fields.telephone,
      ENQUIRY.fields.enquiringFor,
      ENQUIRY.fields.preferredContact,
      ENQUIRY.fields.message,
    ].map((label) => text.indexOf(label))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(text).toContain(ENQUIRY_FIXTURE.name)
    expect(text).toContain(ENQUIRY_FIXTURE.message)
    expect(text).toContain(ENQUIRY.options.enquiringFor.family)
    expect(text).toContain(ENQUIRY.options.preferredContact.telephone)
  })

  it('omits the telephone line when none was given', () => {
    const text = renderEnquiryText({ ...ENQUIRY_FIXTURE, telephone: undefined })

    expect(text).not.toContain(ENQUIRY.fields.telephone)
  })
})

describe('createResendAdapter', () => {
  it('sends a plain-text email to the practice with the enquirer as reply-to', async () => {
    const client = fakeClient({ data: { id: 'msg_1' }, error: null })
    const { logger, lines } = captureLogger()
    const adapter = createResendAdapter('re_key', TO, FROM, { client, logger })

    const result = await adapter.send(ENQUIRY_FIXTURE)

    expect(result).toEqual({ ok: true, id: 'msg_1' })
    expect(client.calls[0]).toMatchObject({
      from: FROM,
      to: [TO],
      replyTo: ENQUIRY_FIXTURE.email,
      subject: `${ENQUIRY.mail.subject} — ${ENQUIRY.mail.subjectLabels.family}`,
    })
    const payload = client.calls[0] as Record<string, unknown>
    expect(typeof payload.text).toBe('string')
    expect(payload.html).toBeUndefined()
    expect(payload.react).toBeUndefined()
    expect(lines().some((l) => l.event === 'enquiry.mail.sent' && l.id === 'msg_1')).toBe(true)
  })

  it('returns a failure with the API error name and logs it redacted', async () => {
    const client = fakeClient({ data: null, error: { name: 'validation_error', message: 'bad' } })
    const { logger, lines } = captureLogger()
    const adapter = createResendAdapter('re_key', TO, FROM, { client, logger })

    const result = await adapter.send(ENQUIRY_FIXTURE)

    expect(result).toEqual({ ok: false, reason: 'validation_error' })
    const line = lines().find((l) => l.event === 'enquiry.mail.failed')
    expect(line?.level).toBe('error')
    expect(JSON.stringify(line)).not.toContain(ENQUIRY_FIXTURE.email)
    expect(JSON.stringify(line)).not.toContain('few words')
  })

  it('returns a transport failure when the SDK throws, without rethrowing', async () => {
    const client = fakeClient(new Error('ECONNRESET'))
    const { logger, lines } = captureLogger()
    const adapter = createResendAdapter('re_key', TO, FROM, { client, logger })

    const result = await adapter.send(ENQUIRY_FIXTURE)

    expect(result).toEqual({ ok: false, reason: 'transport' })
    expect(lines().find((l) => l.event === 'enquiry.mail.failed')?.error).toEqual({
      name: 'Error',
      message: 'ECONNRESET',
    })
  })

  it('returns a failure when the SDK reports neither data nor error', async () => {
    const client = fakeClient({ data: null, error: null })
    const adapter = createResendAdapter('re_key', TO, FROM, {
      client,
      logger: captureLogger().logger,
    })

    expect(await adapter.send(ENQUIRY_FIXTURE)).toEqual({ ok: false, reason: 'empty-response' })
  })

  it('constructs the Resend client from the API key when none is injected', async () => {
    resendMock.send.mockResolvedValueOnce({ data: { id: 'real' }, error: null })

    const adapter = createResendAdapter('re_key', TO, FROM, { logger: captureLogger().logger })
    const result = await adapter.send(ENQUIRY_FIXTURE)

    expect(result).toEqual({ ok: true, id: 'real' })
    expect(resendMock.construct).toHaveBeenCalledWith('re_key')
    expect(resendMock.send).toHaveBeenCalledTimes(1)
  })
})

describe('createLogAdapter', () => {
  it('logs the redacted enquiry and reports success with an id', async () => {
    const { logger, lines } = captureLogger()
    const adapter = createLogAdapter(logger)

    const result = await adapter.send(ENQUIRY_FIXTURE)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.id).toMatch(/[0-9a-f-]{36}/)
    const line = lines().find((l) => l.event === 'enquiry.logged')
    expect(line).toMatchObject({
      level: 'info',
      enquiringFor: 'family',
      preferredContact: 'telephone',
      email: { redacted: true, length: ENQUIRY_FIXTURE.email.length },
      message: { redacted: true, length: ENQUIRY_FIXTURE.message.length },
    })
    expect(JSON.stringify(line)).not.toContain('Ada')
  })
})

describe('defaultFromAddress', () => {
  it('derives enquiries@<host> from the public site URL, with the practice name', () => {
    expect(defaultFromAddress('https://thenewpractice.health')).toBe(
      `${BRAND.name} <${ENQUIRY.mail.fromLocalPart}@thenewpractice.health>`
    )
  })

  it('drops a leading www.', () => {
    expect(defaultFromAddress('https://www.thenewpractice.health/')).toContain(
      '@thenewpractice.health>'
    )
  })
})

describe('createMailAdapter', () => {
  const base: Env = { SITE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }

  it('chooses the log adapter when no API key is configured', async () => {
    const { logger, lines } = captureLogger()

    const adapter = createMailAdapter(base, { logger })
    await adapter.send(ENQUIRY_FIXTURE)

    expect(lines().some((l) => l.event === 'enquiry.logged')).toBe(true)
  })

  it('chooses Resend when the key and recipient are configured, with the derived from address', async () => {
    const client = fakeClient({ data: { id: 'x' }, error: null })
    const env: Env = {
      ...base,
      NEXT_PUBLIC_SITE_URL: 'https://thenewpractice.health',
      RESEND_API_KEY: 're_key',
      ENQUIRY_TO_EMAIL: TO,
    }

    const adapter = createMailAdapter(env, { logger: captureLogger().logger, client })
    await adapter.send(ENQUIRY_FIXTURE)

    expect(client.calls[0]).toMatchObject({ from: defaultFromAddress(env.NEXT_PUBLIC_SITE_URL) })
  })

  it('prefers ENQUIRY_FROM_EMAIL when set', async () => {
    const client = fakeClient({ data: { id: 'x' }, error: null })
    const env: Env = {
      ...base,
      RESEND_API_KEY: 're_key',
      ENQUIRY_TO_EMAIL: TO,
      ENQUIRY_FROM_EMAIL: 'hello@verified.example',
    }

    const adapter = createMailAdapter(env, { logger: captureLogger().logger, client })
    await adapter.send(ENQUIRY_FIXTURE)

    expect(client.calls[0]).toMatchObject({ from: `${BRAND.name} <hello@verified.example>` })
  })

  it('falls back to the log adapter and warns when the key is set without a recipient', async () => {
    const { logger, lines } = captureLogger()
    const env: Env = { ...base, RESEND_API_KEY: 're_key' }

    const adapter = createMailAdapter(env, { logger })
    await adapter.send(ENQUIRY_FIXTURE)

    expect(
      lines().some((l) => l.event === 'enquiry.mail.misconfigured' && l.level === 'warn')
    ).toBe(true)
    expect(lines().some((l) => l.event === 'enquiry.logged')).toBe(true)
  })
})
