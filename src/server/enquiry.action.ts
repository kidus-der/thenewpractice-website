'use server'

/**
 * The one server action on the site. Called by the enquiry form through
 * useActionState (and by a plain POST when JavaScript is off). Everything it
 * does is in enquiry.handler.ts; this file only binds the process
 * configuration. It never throws to the client and never persists anything.
 */
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { handleEnquiry, type EnquiryResult } from './enquiry.handler'
import { createMailAdapter, type MailAdapter } from './mail.adapter'

let adapter: MailAdapter | undefined

const mailAdapter = (): MailAdapter => {
  adapter ??= createMailAdapter(env())
  return adapter
}

export async function submitEnquiry(
  _previous: EnquiryResult,
  formData: FormData
): Promise<EnquiryResult> {
  return handleEnquiry(formData, { adapter: mailAdapter(), logger: logger() })
}
