/**
 * EMAIL STRINGS — round 1, R6 (docs/EMAIL-SETUP.md, docs/09 §3, docs/01 §Voice).
 *
 * The words of the two emails the practice receives: an enquiry from the
 * contact form, and a self-assessment a visitor chose to send. Ours, written
 * in the house voice (plain, British, no dashes, no exclamation marks, none
 * of the forbidden words) and checked by content.checks.ts with every other
 * string of ours. Field labels are the forms' own (ENQUIRY.fields,
 * ASSESSMENT_SEND.fields) so the email and the form never disagree; the
 * questionnaire titles, questions and band labels are the client's.
 *
 * `{name}`-style tokens are filled by the templates (src/server/email/), and
 * the filled line is escaped as a whole before it reaches the HTML.
 */

/** The practice's clock: Puerto Aventuras keeps Cancun time all year (no daylight saving). */
export const PRACTICE_TIME_ZONE = 'America/Cancun'

export const EMAIL = {
  /** Label beside the time the submission reached the website. */
  received: 'Received',
  /** Follows the formatted time, so the reader knows whose clock it is. */
  timeZoneNote: 'Riviera Maya time',
  /** The closing line of every email; `{site}` is the website's host. */
  footer: 'Sent from {site}. The website keeps no copy of what was submitted.',
  /** Under the details when the sender gave an email address. */
  replyNote: 'Reply to this email to write to {name} directly.',

  enquiry: {
    eyebrow: 'Enquiry',
    /** The hidden line an inbox shows beside the subject. */
    preheader: 'An enquiry through the website from {name}.',
    intro: 'Received through the enquiry form on the website.',
  },

  assessment: {
    /** Subject prefix; the questionnaire's title follows. */
    subject: 'Self-assessment',
    eyebrow: 'Self-assessment',
    preheader: 'Self-assessment answers from {name}.',
    intro:
      '{name} completed this questionnaire on the website and chose to send the answers to the practice.',
    /** Heading over the sender's name, email, telephone and preferred contact. */
    contactHeading: 'Contact details',
    /** Heading over the average severity and the band. */
    resultHeading: 'Result',
    /** Heading over the questions and their answers. */
    answersHeading: 'Answers',
    /** A 1 to 10 answer, e.g. "7 of 10". */
    scaleAnswer: '{value} of {max}',
    /** In place of the reply note when only a telephone number was given. */
    noEmailNote: 'No email address was given. Please reply by telephone.',
  },
} as const
