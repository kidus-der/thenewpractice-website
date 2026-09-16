/**
 * ENQUIRY FORM STRINGS — docs/06-copy-deck.md, docs/01 §Voice.
 *
 * Interface copy for the enquiry template (T7): labels, options, validation
 * messages, the sending state, the confirmation and the failure line. This
 * is structural copy and therefore ours, written in the brand voice: short
 * declaratives, British spelling, no exclamation marks, none of the
 * forbidden words. The page's own prose (lead, sections, founder details)
 * is the client's and lives in pages/contact.ts and brand.ts.
 *
 * The same object feeds the Zod schema (src/server/enquiry.schema.ts) so a
 * message shown by the browser and one returned by the server action are
 * always the same sentence.
 */
export const ENQUIRING_FOR = ['self', 'family', 'professional'] as const
export const PREFERRED_CONTACT = ['email', 'telephone'] as const

export type EnquiringFor = (typeof ENQUIRING_FOR)[number]
export type PreferredContact = (typeof PREFERRED_CONTACT)[number]

export const ENQUIRY_LIMITS = {
  nameMax: 120,
  messageMax: 4000,
} as const

export const ENQUIRY = {
  /** Accessible name of the section that holds the letter copy and the form. */
  sectionLabel: 'Enquiry',
  /** Small letterspaced heading at the top of the form sheet. */
  formHeading: 'Your enquiry',

  fields: {
    name: 'Name',
    email: 'Email',
    telephone: 'Telephone (optional)',
    enquiringFor: 'I am enquiring for',
    message: 'Message',
    preferredContact: 'Preferred contact',
  },

  options: {
    enquiringFor: {
      self: 'Myself',
      family: 'Someone close to me',
      professional: 'A client or colleague',
    },
    preferredContact: {
      email: 'Email',
      telephone: 'Telephone',
    },
  },

  errors: {
    name: 'Please tell us your name.',
    nameLength: `Please keep your name under ${ENQUIRY_LIMITS.nameMax} characters.`,
    email: 'Please enter an email address we can reply to.',
    telephone: 'Please enter a telephone number, including the country code.',
    enquiringFor: 'Please tell us who the enquiry concerns.',
    message: 'Please write a few words about your situation.',
    messageLength: `Please keep your message under ${ENQUIRY_LIMITS.messageMax.toLocaleString('en-GB')} characters.`,
    preferredContact: 'Please tell us how you would prefer to be contacted.',
  },

  submit: 'Send',
  sending: 'Sending',

  /**
   * Revealed line by line once the action has accepted the enquiry. The
   * second line is the client's own sentence (document l.1206); nothing here
   * claims delivery, which the mail adapter cannot promise on every deployment
   * (docs/CONTENT-PROVENANCE-AUDIT.md B2).
   */
  confirmation: [
    'Thank you.',
    'At The New Practice, every enquiry is handled personally, professionally, and with complete confidentiality.',
    'If the matter is urgent, please telephone.',
  ],

  /** Shown under the form when the message could not be sent; the founder's telephone and email follow it. */
  failed: 'Your enquiry could not be sent. Please telephone or write to us directly.',
  /** Joins the telephone and email links after the failure line. */
  failedSeparator: 'or',

  mail: {
    /** Subject prefix; the enquiring-for label follows an em dash. */
    subject: 'Enquiry',
    /** Short forms for the subject line and the log. */
    subjectLabels: {
      self: 'Self',
      family: 'Family',
      professional: 'Professional',
    },
    /** Local part of the sending address when ENQUIRY_FROM_EMAIL is unset. */
    fromLocalPart: 'enquiries',
  },

  /**
   * The honeypot. Never shown to a person; a form-filling bot completes it
   * and the action discards the submission. The label is deliberately
   * plausible.
   */
  honeypot: 'Website',
} as const
