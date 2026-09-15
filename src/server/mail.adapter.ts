/**
 * Mail adapters. The action hands a validated enquiry to one of these and
 * keeps nothing (contract §1). Resend when the key and recipient are
 * configured; otherwise a structured log line, which is what staging runs
 * until the practice's own Resend account exists.
 */
import { Resend } from 'resend'

import { BRAND } from '@/content/brand'
import { ENQUIRY } from '@/content/enquiry'
import type { Env } from '@/lib/env'
import { logger as sharedLogger, type Logger } from '@/lib/logger'
import type { EnquiryFormOutput } from './enquiry.schema'

export type Enquiry = EnquiryFormOutput

export type MailResult = { ok: true; id: string } | { ok: false; reason: string }

export interface MailAdapter {
  send(enquiry: Enquiry): Promise<MailResult>
}

/** The slice of the Resend SDK the adapter uses, so a test can hand in a fake. */
export type ResendClient = {
  emails: {
    send: (payload: {
      from: string
      to: string[]
      replyTo: string
      subject: string
      text: string
    }) => Promise<{ data: { id: string } | null; error: { name: string; message: string } | null }>
  }
}

type ResendDeps = Readonly<{ client?: ResendClient; logger?: Logger }>

const SUBJECT_SEPARATOR = ' — '
const LEADING_WWW = /^www\./

/** Non-personal facts safe to log beside the redacted fields. */
const summary = (enquiry: Enquiry) => ({
  enquiringFor: enquiry.enquiringFor,
  preferredContact: enquiry.preferredContact,
  hasTelephone: enquiry.telephone !== undefined,
  email: enquiry.email,
  message: enquiry.message,
})

/** The plain-text email: each field under its label, the message last. */
export function renderEnquiryText(enquiry: Enquiry): string {
  const lines: readonly (readonly [string, string | undefined])[] = [
    [ENQUIRY.fields.name, enquiry.name],
    [ENQUIRY.fields.email, enquiry.email],
    [ENQUIRY.fields.telephone, enquiry.telephone],
    [ENQUIRY.fields.enquiringFor, ENQUIRY.options.enquiringFor[enquiry.enquiringFor]],
    [ENQUIRY.fields.preferredContact, ENQUIRY.options.preferredContact[enquiry.preferredContact]],
  ]
  const header = lines
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
  return `${header}\n\n${ENQUIRY.fields.message}:\n${enquiry.message}\n`
}

const subjectFor = (enquiry: Enquiry): string =>
  `${ENQUIRY.mail.subject}${SUBJECT_SEPARATOR}${ENQUIRY.mail.subjectLabels[enquiry.enquiringFor]}`

const withDisplayName = (address: string): string => `${BRAND.name} <${address}>`

/** `The New Practice <enquiries@thenewpractice.health>` from the public site URL. */
export function defaultFromAddress(siteUrl: string): string {
  const host = new URL(siteUrl).hostname.replace(LEADING_WWW, '')
  return withDisplayName(`${ENQUIRY.mail.fromLocalPart}@${host}`)
}

export function createResendAdapter(
  apiKey: string,
  to: string,
  from: string,
  { client, logger = sharedLogger() }: ResendDeps = {}
): MailAdapter {
  const resend: ResendClient = client ?? new Resend(apiKey)
  return {
    async send(enquiry) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: [to],
          replyTo: enquiry.email,
          subject: subjectFor(enquiry),
          text: renderEnquiryText(enquiry),
        })
        if (error) {
          logger.error('enquiry.mail.failed', { ...summary(enquiry), reason: error.name, error })
          return { ok: false, reason: error.name }
        }
        if (!data) {
          logger.error('enquiry.mail.failed', { ...summary(enquiry), reason: 'empty-response' })
          return { ok: false, reason: 'empty-response' }
        }
        logger.info('enquiry.mail.sent', { ...summary(enquiry), id: data.id })
        return { ok: true, id: data.id }
      } catch (error) {
        logger.error('enquiry.mail.failed', { ...summary(enquiry), reason: 'transport', error })
        return { ok: false, reason: 'transport' }
      }
    },
  }
}

/** No mail service configured: log the redacted event and report success. */
export function createLogAdapter(logger: Logger = sharedLogger()): MailAdapter {
  return {
    async send(enquiry) {
      const id = crypto.randomUUID()
      logger.info('enquiry.logged', { ...summary(enquiry), id })
      return { ok: true, id }
    },
  }
}

/** Picks the adapter for this deployment from the validated environment. */
export function createMailAdapter(env: Env, deps: ResendDeps = {}): MailAdapter {
  const logger = deps.logger ?? sharedLogger()
  if (!env.RESEND_API_KEY) return createLogAdapter(logger)
  if (!env.ENQUIRY_TO_EMAIL) {
    logger.warn('enquiry.mail.misconfigured', { missing: 'ENQUIRY_TO_EMAIL' })
    return createLogAdapter(logger)
  }
  const from = env.ENQUIRY_FROM_EMAIL
    ? withDisplayName(env.ENQUIRY_FROM_EMAIL)
    : defaultFromAddress(env.NEXT_PUBLIC_SITE_URL)
  return createResendAdapter(env.RESEND_API_KEY, env.ENQUIRY_TO_EMAIL, from, { ...deps, logger })
}
