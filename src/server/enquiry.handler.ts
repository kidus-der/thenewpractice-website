/**
 * The enquiry pipeline, separated from the 'use server' file so it can be
 * exercised with a fake adapter and a captured logger. Validate, check the
 * honeypot and the timing token, render the email (HTML and plain text,
 * src/server/email/), hand it to the adapter, return a result the form can
 * render. Nothing is persisted; nothing a person typed appears in the result
 * or the log.
 */
import type { Logger } from '@/lib/logger'
import { renderEnquiryEmail } from './email/enquiry.email'
import {
  checkTiming,
  formDataToEnquiryInput,
  parseEnquiry,
  type EnquiryFieldErrors,
  type EnquirySubmission,
  type TimingVerdict,
} from './enquiry.schema'
import type { MailAdapter, OutgoingEmail } from './mail.adapter'
import { FAILED, IDLE, SENT, type FormResult } from './results'

export type EnquiryResult = FormResult<keyof EnquiryFieldErrors>

export const INITIAL_ENQUIRY_RESULT: EnquiryResult = IDLE

export type HandlerDeps = Readonly<{
  adapter: MailAdapter
  logger: Logger
  /** The website's host, named in the email's footer. */
  site: string
  now?: () => number
}>

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

type Enquiry = ReturnType<typeof stripAntiAbuseFields>

/** The email for one enquiry, with the facts its log lines may carry. */
export function enquiryEmail(enquiry: Enquiry, receivedAt: Date, site: string): OutgoingEmail {
  return {
    kind: 'enquiry',
    ...renderEnquiryEmail(enquiry, { receivedAt, site }),
    replyTo: enquiry.email,
    facts: {
      enquiringFor: enquiry.enquiringFor,
      preferredContact: enquiry.preferredContact,
      hasTelephone: enquiry.telephone !== undefined,
      messageLength: enquiry.message.length,
    },
  }
}

export async function handleEnquiry(formData: FormData, deps: HandlerDeps): Promise<EnquiryResult> {
  const { adapter, logger, site, now = Date.now } = deps
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

    const receivedAt = now()
    const timing = checkTiming(parsed.data.startedAt, receivedAt)
    if (REJECTING_VERDICTS.has(timing)) {
      logger.warn('enquiry.rejected', { reason: timing })
      return FAILED
    }

    const enquiry = stripAntiAbuseFields(parsed.data)
    const sent = await adapter.send(enquiryEmail(enquiry, new Date(receivedAt), site))
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
