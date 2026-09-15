/**
 * The enquiry pipeline, separated from the 'use server' file so it can be
 * exercised with a fake adapter and a captured logger. Validate, check the
 * honeypot and the timing token, hand the enquiry to the adapter, return a
 * result the form can render. Nothing is persisted; nothing a person typed
 * appears in the result or the log.
 */
import type { Logger } from '@/lib/logger'
import {
  checkTiming,
  formDataToEnquiryInput,
  parseEnquiry,
  type EnquiryFieldErrors,
  type EnquirySubmission,
  type TimingVerdict,
} from './enquiry.schema'
import type { MailAdapter } from './mail.adapter'

export type EnquiryResult =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: EnquiryFieldErrors }
  | { status: 'failed' }

export const INITIAL_ENQUIRY_RESULT: EnquiryResult = { status: 'idle' }

type HandlerDeps = Readonly<{ adapter: MailAdapter; logger: Logger; now?: () => number }>

const SENT: EnquiryResult = { status: 'sent' }
const FAILED: EnquiryResult = { status: 'failed' }

/** Anti-abuse verdicts that end the request. An absent token (no JavaScript) is allowed through. */
const REJECTING_VERDICTS: ReadonlySet<TimingVerdict> = new Set(['too-fast', 'expired'])

const stripAntiAbuseFields = (submission: EnquirySubmission) => ({
  name: submission.name,
  email: submission.email,
  telephone: submission.telephone,
  enquiringFor: submission.enquiringFor,
  message: submission.message,
  preferredContact: submission.preferredContact,
})

export async function handleEnquiry(formData: FormData, deps: HandlerDeps): Promise<EnquiryResult> {
  const { adapter, logger, now = Date.now } = deps
  try {
    const parsed = parseEnquiry(formDataToEnquiryInput(formData))
    if (!parsed.ok) {
      if (parsed.honeypot) {
        logger.warn('enquiry.rejected', { reason: 'honeypot' })
        return FAILED
      }
      logger.info('enquiry.invalid', { fields: Object.keys(parsed.fieldErrors) })
      return { status: 'invalid', fieldErrors: parsed.fieldErrors }
    }

    const timing = checkTiming(parsed.data.startedAt, now())
    if (REJECTING_VERDICTS.has(timing)) {
      logger.warn('enquiry.rejected', { reason: timing })
      return FAILED
    }

    const enquiry = stripAntiAbuseFields(parsed.data)
    const sent = await adapter.send(enquiry)
    if (!sent.ok) {
      logger.error('enquiry.failed', { reason: sent.reason, enquiringFor: enquiry.enquiringFor })
      return FAILED
    }
    logger.info('enquiry.sent', {
      id: sent.id,
      timing,
      enquiringFor: enquiry.enquiringFor,
      preferredContact: enquiry.preferredContact,
    })
    return SENT
  } catch (error) {
    logger.error('enquiry.failed', { reason: 'unexpected', error })
    return FAILED
  }
}
