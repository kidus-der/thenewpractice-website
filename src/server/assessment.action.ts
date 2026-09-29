'use server'

/**
 * The *Send my answers to the practice* server action (round 1, R6). Called
 * by the opt-in form beneath a self-assessment result through useActionState,
 * and only when the visitor submits it. Everything it does is in
 * assessment.handler.ts; this file binds the process configuration. It never
 * throws to the client and never persists anything.
 */
import { logger } from '@/lib/logger'
import { handleAssessmentSend, type AssessmentSendResult } from './assessment.handler'
import { mailAdapter, siteHost } from './mail.config'

export async function sendAssessment(
  _previous: AssessmentSendResult,
  formData: FormData
): Promise<AssessmentSendResult> {
  return handleAssessmentSend(formData, {
    adapter: mailAdapter(),
    logger: logger(),
    site: siteHost(),
  })
}
