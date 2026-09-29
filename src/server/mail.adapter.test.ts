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
import { MARK_CID } from './email/layout'
import {
  MARK_ATTACHMENT,
  createLogAdapter,
  createMailAdapter,
  createResendAdapter,
  defaultFromAddress,
  type OutgoingEmail,
  type ResendClient,
} from './mail.adapter'

const EMAIL_FIXTURE: OutgoingEmail = {
  kind: 'enquiry',
  subject: 'Enquiry: Family',
  html: '<p>Ada Lovelace wrote a few words.</p>',
  text: 'Ada Lovelace wrote a few words.',
  replyTo: 'ada@example.com',
  facts: { enquiringFor: 'family', preferredContact: 'telephone', hasTelephone: true },
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
): ResendClient & { calls: Record<string, unknown>[] } {
  const calls: Record<string, unknown>[] = []
  return {
    calls,
    emails: {
      send: vi.fn(async (payload: Record<string, unknown>) => {
        calls.push(payload)
        if (result instanceof Error) throw result
        return result
      }),
    },
  }
}

describe('createResendAdapter', () => {
  it('sends HTML and plain text to the practice, reply-to the sender, the mark inline', async () => {
    const client = fakeClient({ data: { id: 'msg_1' }, error: null })
    const { logger, lines } = captureLogger()
    const adapter = createResendAdapter('re_key', TO, FROM, { client, logger })

    const result = await adapter.send(EMAIL_FIXTURE)

    expect(result).toEqual({ ok: true, id: 'msg_1' })
    expect(client.calls[0]).toEqual({
      from: FROM,
      to: [TO],
      replyTo: EMAIL_FIXTURE.replyTo,
      subject: EMAIL_FIXTURE.subject,
      html: EMAIL_FIXTURE.html,
      text: EMAIL_FIXTURE.text,
      attachments: [MARK_ATTACHMENT],
    })
    const [attachment] = client.calls[0]?.attachments as (typeof MARK_ATTACHMENT)[]
    expect(attachment?.contentId).toBe(MARK_CID)
    expect(attachment?.content.subarray(1, 4).toString()).toBe('PNG')
    const sent = lines().find((l) => l.event === 'enquiry.mail.sent')
    expect(sent).toMatchObject({ id: 'msg_1', enquiringFor: 'family' })
    expect(JSON.stringify(lines())).not.toMatch(/Ada|few words|example\.com/)
  })

  it('omits reply-to when the sender gave no email address', async () => {
    const client = fakeClient({ data: { id: 'msg_2' }, error: null })
    const adapter = createResendAdapter('re_key', TO, FROM, {
      client,
      logger: captureLogger().logger,
    })

    await adapter.send({ ...EMAIL_FIXTURE, kind: 'assessment', replyTo: undefined })

    expect(client.calls[0]).not.toHaveProperty('replyTo')
  })

  it('returns a failure with the API error name and logs only the facts', async () => {
    const client = fakeClient({ data: null, error: { name: 'validation_error', message: 'bad' } })
    const { logger, lines } = captureLogger()
    const adapter = createResendAdapter('re_key', TO, FROM, { client, logger })

    const result = await adapter.send({ ...EMAIL_FIXTURE, kind: 'assessment' })

    expect(result).toEqual({ ok: false, reason: 'validation_error' })
    const line = lines().find((l) => l.event === 'assessment.mail.failed')
    expect(line?.level).toBe('error')
    expect(JSON.stringify(line)).not.toMatch(/Ada|few words|example\.com/)
  })

  it('returns a transport failure when the SDK throws, without rethrowing', async () => {
    const client = fakeClient(new Error('ECONNRESET'))
    const { logger, lines } = captureLogger()
    const adapter = createResendAdapter('re_key', TO, FROM, { client, logger })

    const result = await adapter.send(EMAIL_FIXTURE)

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

    expect(await adapter.send(EMAIL_FIXTURE)).toEqual({ ok: false, reason: 'empty-response' })
  })

  it('constructs the Resend client from the API key when none is injected', async () => {
    resendMock.send.mockResolvedValueOnce({ data: { id: 'real' }, error: null })

    const adapter = createResendAdapter('re_key', TO, FROM, { logger: captureLogger().logger })
    const result = await adapter.send(EMAIL_FIXTURE)

    expect(result).toEqual({ ok: true, id: 'real' })
    expect(resendMock.construct).toHaveBeenCalledWith('re_key')
    expect(resendMock.send).toHaveBeenCalledTimes(1)
  })
})

describe('createLogAdapter', () => {
  it('logs the facts, never the message, and reports success with an id', async () => {
    const { logger, lines } = captureLogger()
    const adapter = createLogAdapter(logger)

    const result = await adapter.send(EMAIL_FIXTURE)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.id).toMatch(/[0-9a-f-]{36}/)
    const line = lines().find((l) => l.event === 'enquiry.logged')
    expect(line).toMatchObject({
      level: 'info',
      enquiringFor: 'family',
      preferredContact: 'telephone',
      hasTelephone: true,
    })
    expect(JSON.stringify(line)).not.toMatch(/Ada|few words|example\.com/)
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
    await adapter.send(EMAIL_FIXTURE)

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
    await adapter.send(EMAIL_FIXTURE)

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
    await adapter.send(EMAIL_FIXTURE)

    expect(client.calls[0]).toMatchObject({ from: `${BRAND.name} <hello@verified.example>` })
  })

  it('falls back to the log adapter and warns when the key is set without a recipient', async () => {
    const { logger, lines } = captureLogger()
    const env: Env = { ...base, RESEND_API_KEY: 're_key' }

    const adapter = createMailAdapter(env, { logger })
    await adapter.send(EMAIL_FIXTURE)

    expect(lines().some((l) => l.event === 'mail.misconfigured' && l.level === 'warn')).toBe(true)
    expect(lines().some((l) => l.event === 'enquiry.logged')).toBe(true)
  })
})
