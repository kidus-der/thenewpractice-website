import { describe, expect, it, vi } from 'vitest'

import { ASSESSMENTS } from '@/content/assessments'
import { answerTypesFor } from '@/content/assessment-answers'
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import { createLogger, type Logger } from '@/lib/logger'
import { answerLabel } from './email/assessment.email'
import { INITIAL_ASSESSMENT_SEND_RESULT, handleAssessmentSend } from './assessment.handler'
import { ENQUIRY_MAX_AGE_MS, ENQUIRY_MIN_ELAPSED_MS } from './enquiry.schema'
import type { MailAdapter, MailResult } from './mail.adapter'

const NOW = 1_700_000_000_000
const alcohol = ASSESSMENTS.find((a) => a.slug === 'alcohol')
if (!alcohol) throw new Error('fixture: no alcohol questionnaire')
/** 10 on every scale and yes on every fact: the severe band. */
const SHEET = answerTypesFor('alcohol').map((type, i) => (type === 'scale' ? 10 - (i % 2) : 'yes'))

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData()
  const values = {
    name: 'Sam Rivera',
    email: 'sam@example.com',
    telephone: '+1 555 010 0199',
    preferredContact: 'telephone',
    consent: 'yes',
    slug: 'alcohol',
    answers: JSON.stringify(SHEET),
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
  return { adapter: { send } as MailAdapter, send }
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

const PERSONAL = /Sam|Rivera|example\.com|555 010/

describe('handleAssessmentSend', () => {
  it('scores the sheet on the server, sends one email with exactly the answers, reports sent', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleAssessmentSend(form(), deps(adapter, logger))

    expect(result).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    const email = send.mock.calls[0]?.[0]
    expect(email).toMatchObject({
      kind: 'assessment',
      subject: `Self-assessment: ${alcohol.title}`,
      replyTo: 'sam@example.com',
      facts: { slug: 'alcohol', preferredContact: 'telephone', hasEmail: true, hasTelephone: true },
    })
    const text = email?.text ?? ''
    expect(text).toContain('Average severity 9.8 of 10')
    expect(text).toContain(alcohol.scoring.bands.find((b) => b.key === 'severe')?.label)
    const answerLines = text.split('\n').filter((line) => line.startsWith('    '))
    expect(answerLines.map((l) => l.trim())).toEqual(SHEET.map((a) => answerLabel(a)))
    alcohol.questions.forEach((question) => expect(text).toContain(question))
    expect(JSON.stringify(lines())).not.toMatch(PERSONAL)
    expect(lines().find((l) => l.event === 'assessment.sent')).toMatchObject({
      id: 'id_1',
      slug: 'alcohol',
      timing: 'ok',
    })
  })

  it('sends without reply-to when only a telephone was given', async () => {
    const { adapter, send } = fakeAdapter()

    await handleAssessmentSend(form({ email: '' }), deps(adapter, captureLogger().logger))

    expect(send.mock.calls[0]?.[0].replyTo).toBeUndefined()
    expect(send.mock.calls[0]?.[0].facts).toMatchObject({ hasEmail: false })
  })

  it('returns content-layer field errors and does not send', async () => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleAssessmentSend(
      form({ telephone: '', consent: '' }),
      deps(adapter, logger)
    )

    expect(result).toEqual({
      status: 'invalid',
      fieldErrors: {
        telephone: ASSESSMENT_SEND.errors.telephone,
        consent: ASSESSMENT_SEND.errors.consent,
      },
    })
    expect(send).not.toHaveBeenCalled()
    const fields = lines().find((l) => l.event === 'assessment.invalid')?.fields as string[]
    expect([...fields].sort()).toEqual(['consent', 'telephone'])
  })

  it.each([
    ['honeypot', { website: 'http://spam.example' }],
    ['too-fast', { startedAt: String(NOW - 500) }],
    ['expired', { startedAt: String(NOW - ENQUIRY_MAX_AGE_MS - 1) }],
    ['malformed', { startedAt: '' }],
    ['answers', { answers: JSON.stringify(SHEET.slice(1)) }],
    ['answers', { slug: 'not-a-questionnaire' }],
  ])('rejects %s without sending, reporting failed', async (reason, overrides) => {
    const { adapter, send } = fakeAdapter()
    const { logger, lines } = captureLogger()

    const result = await handleAssessmentSend(form(overrides), deps(adapter, logger))

    expect(result).toEqual({ status: 'failed' })
    expect(send).not.toHaveBeenCalled()
    expect(lines().find((l) => l.event === 'assessment.rejected')).toMatchObject({ reason })
  })

  it('reports failed when the adapter cannot send, logging only the facts', async () => {
    const { adapter } = fakeAdapter({ ok: false, reason: 'transport' })
    const { logger, lines } = captureLogger()

    const result = await handleAssessmentSend(form(), deps(adapter, logger))

    expect(result).toEqual({ status: 'failed' })
    expect(lines().find((l) => l.event === 'assessment.failed')).toMatchObject({
      reason: 'transport',
      slug: 'alcohol',
    })
    expect(JSON.stringify(lines())).not.toMatch(PERSONAL)
  })

  it('reports failed and never throws when the adapter throws', async () => {
    const { adapter } = fakeAdapter(new Error('kaboom'))
    const { logger, lines } = captureLogger()

    await expect(handleAssessmentSend(form(), deps(adapter, logger))).resolves.toEqual({
      status: 'failed',
    })
    expect(lines().find((l) => l.event === 'assessment.failed')?.reason).toBe('unexpected')
  })

  it('never echoes what a person typed in the result', async () => {
    const result = await handleAssessmentSend(
      form({ name: 'SECRET', email: 'SECRET@nope', consent: '' }),
      deps(fakeAdapter().adapter, captureLogger().logger)
    )

    expect(JSON.stringify(result)).not.toContain('SECRET')
  })

  it('exposes an idle initial result for useActionState', () => {
    expect(INITIAL_ASSESSMENT_SEND_RESULT).toEqual({ status: 'idle' })
  })
})
