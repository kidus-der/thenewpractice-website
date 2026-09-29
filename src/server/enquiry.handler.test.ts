import { describe, expect, it, vi } from 'vitest'

import { ENQUIRY } from '@/content/enquiry'
import { createLogger, type Logger } from '@/lib/logger'
import { ENQUIRY_MAX_AGE_MS, ENQUIRY_MIN_ELAPSED_MS } from './enquiry.schema'
import { INITIAL_ENQUIRY_RESULT, handleEnquiry } from './enquiry.handler'
import type { MailAdapter, MailResult } from './mail.adapter'

const NOW = 1_700_000_000_000

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData()
  const values = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    telephone: '',
    enquiringFor: 'self',
    message: 'A few words.',
    preferredContact: 'email',
    website: '',
    startedAt: String(NOW - ENQUIRY_MIN_ELAPSED_MS - 1000),
    ...overrides,
  }
  for (const [k, v] of Object.entries(values)) data.set(k, v)
  return data
}

function fakeAdapter(result: MailResult | Error = { ok: true, id: 'id_1' }) {
  const send = vi.fn<MailAdapter['send']>(async () => {
    if (result instanceof Error) throw result
    return result
  })
  const adapter: MailAdapter = { send }
  return { adapter, send }
}

function captureLogger(): { logger: Logger; lines: () => readonly Record<string, unknown>[] } {
  const raw: string[] = []
  const logger = createLogger({ write: (line) => void raw.push(line) })
  return { logger, lines: () => raw.map((l) => JSON.parse(l) as Record<string, unknown>) }
}

const deps = (adapter: MailAdapter, logger: Logger) => ({
  adapter,
  logger,
  site: 'thenewpractice.health',
  now: () => NOW,
})

describe('handleEnquiry', () => {
  it('renders the enquiry as an email, sends it through the adapter and reports sent', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleEnquiry(form(), deps(adapter, logger))

    expect(result).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    const sent = send.mock.calls[0]?.[0]
    expect(sent).toMatchObject({
      kind: 'enquiry',
      subject: 'Enquiry: Self',
      replyTo: 'ada@example.com',
      facts: { enquiringFor: 'self', preferredContact: 'email', hasTelephone: false },
    })
    expect(sent?.html).toContain('Ada Lovelace')
    expect(sent?.text).toContain('A few words.')
    expect(sent?.text).toContain('thenewpractice.health')
    expect(JSON.stringify(sent?.facts)).not.toMatch(/Ada|example\.com|few words/)
    expect(sent?.text).not.toContain(String(NOW))
    expect(lines().some((l) => l.event === 'enquiry.sent' && l.id === 'id_1')).toBe(true)
  })

  it('returns field errors from the content layer for an invalid field and does not send', async () => {
    const { adapter, send } = fakeAdapter()

    const result = await handleEnquiry(
      form({ email: 'nope' }),
      deps(adapter, captureLogger().logger)
    )

    expect(result).toEqual({ status: 'invalid', fieldErrors: { email: ENQUIRY.errors.email } })
    expect(send).not.toHaveBeenCalled()
  })

  it('never echoes what a person typed in the result', async () => {
    const { adapter } = fakeAdapter()

    const result = await handleEnquiry(
      form({ name: 'SECRET-NAME', email: 'nope', message: 'SECRET-MESSAGE' }),
      deps(adapter, captureLogger().logger)
    )

    expect(JSON.stringify(result)).not.toMatch(/SECRET/)
  })

  it('discards a submission whose honeypot is filled, reporting failed and logging the reason', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleEnquiry(
      form({ website: 'http://spam.example' }),
      deps(adapter, logger)
    )

    expect(result).toEqual({ status: 'failed' })
    expect(send).not.toHaveBeenCalled()
    expect(lines().find((l) => l.event === 'enquiry.rejected')).toMatchObject({
      reason: 'honeypot',
    })
  })

  it('rejects a submission completed too quickly', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleEnquiry(
      form({ startedAt: String(NOW - 500) }),
      deps(adapter, logger)
    )

    expect(result).toEqual({ status: 'failed' })
    expect(send).not.toHaveBeenCalled()
    expect(lines().find((l) => l.event === 'enquiry.rejected')).toMatchObject({
      reason: 'too-fast',
    })
  })

  it('rejects an expired timing token', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleEnquiry(
      form({ startedAt: String(NOW - ENQUIRY_MAX_AGE_MS - 1) }),
      deps(adapter, logger)
    )

    expect(result).toEqual({ status: 'failed' })
    expect(send).not.toHaveBeenCalled()
    expect(lines().find((l) => l.event === 'enquiry.rejected')).toMatchObject({ reason: 'expired' })
  })

  it('accepts a submission without a timing token (no JavaScript) when the honeypot is clean', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleEnquiry(form({ startedAt: '' }), deps(adapter, logger))

    expect(result).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    expect(lines().find((l) => l.event === 'enquiry.sent')).toMatchObject({ timing: 'absent' })
  })

  it('reports failed when the adapter cannot send', async () => {
    const { adapter } = fakeAdapter({ ok: false, reason: 'transport' })
    const { logger, lines } = captureLogger()

    const result = await handleEnquiry(form(), deps(adapter, logger))

    expect(result).toEqual({ status: 'failed' })
    expect(lines().find((l) => l.event === 'enquiry.failed')).toMatchObject({ reason: 'transport' })
  })

  it('reports failed and never throws when the adapter throws', async () => {
    const { adapter } = fakeAdapter(new Error('kaboom'))
    const { logger, lines } = captureLogger()

    await expect(handleEnquiry(form(), deps(adapter, logger))).resolves.toEqual({
      status: 'failed',
    })
    expect(lines().find((l) => l.event === 'enquiry.failed')?.error).toEqual({
      name: 'Error',
      message: 'kaboom',
    })
  })

  it('logs lengths, never the text, on the sent line', async () => {
    const { adapter } = fakeAdapter()
    const { logger, lines } = captureLogger()

    await handleEnquiry(form({ message: 'DO NOT LOG ME' }), deps(adapter, logger))

    const all = JSON.stringify(lines())
    expect(all).not.toContain('DO NOT LOG ME')
    expect(all).not.toContain('ada@example.com')
    expect(all).not.toContain('Ada Lovelace')
  })

  it('exposes an idle initial result for useActionState', () => {
    expect(INITIAL_ENQUIRY_RESULT).toEqual({ status: 'idle' })
  })
})
