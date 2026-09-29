/**
 * SEND MY ANSWERS — round 1, R6 (docs/05 §Self-assessment, docs/09 §3).
 *
 * Interface copy for the opt-in beneath a self-assessment result: the action
 * that reveals the form, its labels, the one-line consent, the validation
 * messages, and the sent and failed states. Ours, in the house voice, and
 * checked by content.checks.ts. Where the enquiry form already says the same
 * thing (a name, an email address, a telephone number, a preferred channel)
 * the sentence is the enquiry's, so the two forms never disagree.
 *
 * The same object feeds the Zod schema (src/server/assessment.schema.ts), so
 * the browser and the server action always return the same sentence.
 */
import { BRAND } from './brand'
import { ENQUIRY, ENQUIRY_LIMITS } from './enquiry'

export const ASSESSMENT_SEND = {
  /** The line action beneath the result that reveals the form. */
  open: 'Send my answers to the practice',
  /** Accessible name of the form. */
  formLabel: 'Send my answers to the practice',
  /** The first line of the revealed form: what goes where, and what is kept. */
  intro:
    'Your answers, your result and the details below go to the practice by email. Nothing is kept on this website.',

  fields: {
    name: ENQUIRY.fields.name,
    email: 'Email',
    telephone: 'Telephone',
    preferredContact: ENQUIRY.fields.preferredContact,
  },
  /** Under the preferred-contact choice: which of the two details is needed. */
  contactHint: 'Please give at least the detail for the way you would prefer to be contacted.',
  /** The one-line consent, a checkbox. */
  consent: `I agree to send my answers and these details to ${BRAND.name}.`,

  errors: {
    name: ENQUIRY.errors.name,
    nameLength: ENQUIRY.errors.nameLength,
    email: ENQUIRY.errors.email,
    telephone: ENQUIRY.errors.telephone,
    preferredContact: ENQUIRY.errors.preferredContact,
    consent: 'Please confirm that you would like to send your answers.',
  },

  submit: ENQUIRY.submit,
  sending: ENQUIRY.sending,

  /**
   * Revealed once the action has accepted the answers. Nothing here claims
   * the practice has read them, which the mail adapter cannot promise.
   */
  confirmation: [
    'Thank you.',
    'Your answers are on their way to the practice.',
    'If the matter is urgent, please telephone.',
  ],
  /** Shown under the form when the answers could not be sent; the founder's telephone and email follow it. */
  failed: 'Your answers could not be sent. Please telephone or write to us directly.',
  failedSeparator: ENQUIRY.failedSeparator,

  /** The honeypot's label; never shown to a person. */
  honeypot: ENQUIRY.honeypot,
} as const

export const ASSESSMENT_SEND_LIMITS = { nameMax: ENQUIRY_LIMITS.nameMax } as const
