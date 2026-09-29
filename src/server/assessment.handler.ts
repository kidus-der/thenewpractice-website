/**
 * The *Send my answers to the practice* pipeline (round 1, R6), separated
 * from the 'use server' file so it can run against a fake adapter and a
 * captured logger. Validate the contact fields, check the honeypot and the
 * timing token, re-read and re-score the answer sheet on the server, render
 * the email, hand it to the adapter, return a result the form can render.
 *
 * Nothing is persisted. Nothing a person typed or answered appears in the
 * result or the log: the log carries the questionnaire's slug, the preferred
 * channel, which details were given, the timing verdict and the outcome.
 */
import type { Logger } from '@/lib/logger'
import { answerTypesFor } from '@/content/assessment-answers'
import { scoreAssessment } from '@/lib/assessment'
import {
  formDataToAssessmentSendInput,
  parseAnswerSheet,
  parseAssessmentSend,
  type AnswerSheet,
  type AssessmentSendFieldName,
  type AssessmentSendSubmission,
} from './assessment.schema'
import { renderAssessmentEmail } from './email/assessment.email'
import type { HandlerDeps } from './enquiry.handler'
import { checkTiming } from './enquiry.schema'
import type { OutgoingEmail } from './mail.adapter'
import { FAILED, IDLE, SENT, type FormResult } from './results'

export type AssessmentSendResult = FormResult<AssessmentSendFieldName>

export const INITIAL_ASSESSMENT_SEND_RESULT: AssessmentSendResult = IDLE

/** The email for one sheet, or null when the sheet cannot be scored. */
export function assessmentEmail(
  submission: AssessmentSendSubmission,
  sheet: AnswerSheet,
  receivedAt: Date,
  site: string
): OutgoingEmail | null {
  const { assessment, answers } = sheet
  const score = scoreAssessment(answers, answerTypesFor(assessment.slug), assessment.scoring)
  if (score.average === null || score.band === null) return null
  const { name, email, telephone, preferredContact } = submission
  return {
    kind: 'assessment',
    ...renderAssessmentEmail(
      {
        title: assessment.title,
        questions: assessment.questions,
        answers,
        average: score.average,
        bandLabel: score.band.label,
        contact: { name, email, telephone, preferredContact },
      },
      { receivedAt, site }
    ),
    replyTo: email,
    facts: {
      slug: assessment.slug,
      preferredContact,
      hasEmail: email !== undefined,
      hasTelephone: telephone !== undefined,
    },
  }
}

export async function handleAssessmentSend(
  formData: FormData,
  deps: HandlerDeps
): Promise<AssessmentSendResult> {
  const { adapter, logger, site, now = Date.now } = deps
  try {
    const parsed = parseAssessmentSend(formDataToAssessmentSendInput(formData))
    if (!parsed.ok) return rejectInvalid(parsed, logger)

    const receivedAt = now()
    const timing = checkTiming(parsed.data.startedAt, receivedAt)
    if (timing !== 'ok') {
      logger.warn('assessment.rejected', { reason: timing })
      return FAILED
    }

    const sheet = parseAnswerSheet(parsed.data.slug, parsed.data.answers)
    const email = sheet && assessmentEmail(parsed.data, sheet, new Date(receivedAt), site)
    if (!email) {
      logger.warn('assessment.rejected', { reason: 'answers' })
      return FAILED
    }

    const sent = await adapter.send(email)
    if (!sent.ok) {
      logger.error('assessment.failed', { ...email.facts, reason: sent.reason })
      return FAILED
    }
    logger.info('assessment.sent', { ...email.facts, id: sent.id, timing })
    return SENT
  } catch (error) {
    logger.error('assessment.failed', { reason: 'unexpected', error })
    return FAILED
  }
}

function rejectInvalid(
  parsed: Extract<ReturnType<typeof parseAssessmentSend>, { ok: false }>,
  logger: Logger
): AssessmentSendResult {
  if (parsed.honeypot) {
    logger.warn('assessment.rejected', { reason: 'honeypot' })
    return FAILED
  }
  if (parsed.malformed) {
    logger.warn('assessment.rejected', { reason: 'malformed' })
    return FAILED
  }
  logger.info('assessment.invalid', { fields: Object.keys(parsed.fieldErrors) })
  return { status: 'invalid', fieldErrors: parsed.fieldErrors }
}
