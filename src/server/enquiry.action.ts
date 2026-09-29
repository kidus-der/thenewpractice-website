'use server'

/**
 * The enquiry form's server action. Called by the enquiry form through
 * useActionState (and by a plain POST when JavaScript is off). Everything it
 * does is in enquiry.handler.ts; this file only binds the process
 * configuration. It never throws to the client and never persists anything.
 */
import { logger } from '@/lib/logger'
import { handleEnquiry, type EnquiryResult } from './enquiry.handler'
import { mailAdapter, siteHost } from './mail.config'

export async function submitEnquiry(
  _previous: EnquiryResult,
  formData: FormData
): Promise<EnquiryResult> {
  return handleEnquiry(formData, { adapter: mailAdapter(), logger: logger(), site: siteHost() })
}
