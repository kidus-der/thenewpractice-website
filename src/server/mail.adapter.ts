/**
 * Mail adapters. A handler renders an email (src/server/email/) and hands it
 * to one of these, and nothing is kept (contract §1). Resend when the key and
 * recipient are configured; otherwise a structured log line, which is what
 * staging runs until the practice's own Resend account exists
 * (docs/EMAIL-SETUP.md).
 *
 * What reaches Resend is exactly the message: from, to, reply-to, subject,
 * the HTML and plain-text parts, and the mark as one inline attachment. No
 * tags, no metadata. What reaches the log is the email's `facts` (chosen by
 * the handler to carry nothing personal), the provider id and the outcome.
 */
import { Resend } from 'resend'

import { BRAND } from '@/content/brand'
import { ENQUIRY } from '@/content/enquiry'
import type { Env } from '@/lib/env'
import { logger as sharedLogger, type LogFields, type Logger } from '@/lib/logger'
import { MARK_CID } from './email/layout'
import { MARK_PNG_BASE64 } from './email/mark'

/** Which form the email came from; prefixes every log event. */
export type MailKind = 'enquiry' | 'assessment'

export type OutgoingEmail = Readonly<{
  kind: MailKind
  subject: string
  html: string
  text: string
  /** The sender's address, when they gave one, so the practice can simply reply. */
  replyTo?: string
  /** Non-personal facts for the log line (choices, counts, flags; never what a person typed). */
  facts: LogFields
}>

export type MailResult = { ok: true; id: string } | { ok: false; reason: string }

export interface MailAdapter {
  send(email: OutgoingEmail): Promise<MailResult>
}

type ResendAttachment = {
  filename: string
  content: Buffer
  contentType: string
  contentId: string
}

/** The slice of the Resend SDK the adapter uses, so a test can hand in a fake. */
export type ResendClient = {
  emails: {
    send: (payload: {
      from: string
      to: string[]
      replyTo?: string
      subject: string
      html: string
      text: string
      attachments: ResendAttachment[]
    }) => Promise<{ data: { id: string } | null; error: { name: string; message: string } | null }>
  }
}

type ResendDeps = Readonly<{ client?: ResendClient; logger?: Logger }>

const LEADING_WWW = /^www\./

/** The ceiba mark, carried inside the message and shown through `cid:` (email/layout.ts). */
export const MARK_ATTACHMENT: Readonly<ResendAttachment> = Object.freeze({
  filename: 'the-new-practice.png',
  content: Buffer.from(MARK_PNG_BASE64, 'base64'),
  contentType: 'image/png',
  contentId: MARK_CID,
})

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
    async send({ kind, subject, html, text, replyTo, facts }) {
      const failed = (reason: string, error?: unknown): MailResult => {
        logger.error(`${kind}.mail.failed`, { ...facts, reason, ...(error ? { error } : {}) })
        return { ok: false, reason }
      }
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: [to],
          ...(replyTo ? { replyTo } : {}),
          subject,
          html,
          text,
          attachments: [{ ...MARK_ATTACHMENT }],
        })
        if (error) return failed(error.name, error)
        if (!data) return failed('empty-response')
        logger.info(`${kind}.mail.sent`, { ...facts, id: data.id })
        return { ok: true, id: data.id }
      } catch (error) {
        return failed('transport', error)
      }
    },
  }
}

/** No mail service configured: log the email's facts and report success. */
export function createLogAdapter(logger: Logger = sharedLogger()): MailAdapter {
  return {
    async send({ kind, facts }) {
      const id = crypto.randomUUID()
      logger.info(`${kind}.logged`, { ...facts, id })
      return { ok: true, id }
    },
  }
}

/** Picks the adapter for this deployment from the validated environment. */
export function createMailAdapter(env: Env, deps: ResendDeps = {}): MailAdapter {
  const logger = deps.logger ?? sharedLogger()
  if (!env.RESEND_API_KEY) return createLogAdapter(logger)
  if (!env.ENQUIRY_TO_EMAIL) {
    logger.warn('mail.misconfigured', { missing: 'ENQUIRY_TO_EMAIL' })
    return createLogAdapter(logger)
  }
  const from = env.ENQUIRY_FROM_EMAIL
    ? withDisplayName(env.ENQUIRY_FROM_EMAIL)
    : defaultFromAddress(env.NEXT_PUBLIC_SITE_URL)
  return createResendAdapter(env.RESEND_API_KEY, env.ENQUIRY_TO_EMAIL, from, { ...deps, logger })
}
