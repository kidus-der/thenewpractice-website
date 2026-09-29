/**
 * The enquiry email (round 1, R6): every field of the contact form under its
 * own label, the message last with its line breaks kept, the time it arrived
 * on the practice's clock. HTML and plain text say the same thing. Reply-to
 * is the enquirer (set by the adapter).
 */
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import { BRAND } from '@/content/brand'
import { EMAIL } from '@/content/email'
import { ENQUIRY, type EnquiringFor, type PreferredContact } from '@/content/enquiry'
import {
  actionLink,
  blockHeading,
  detailRows,
  escapeHtml,
  escapeMultiline,
  fill,
  paragraph,
  renderLayout,
  SUBJECT_SEPARATOR,
  type DetailRow,
  type RenderedEmail,
} from './layout'
import { formatPracticeTime } from './time'

export type EnquiryEmailInput = Readonly<{
  name: string
  email: string
  telephone?: string
  enquiringFor: EnquiringFor
  message: string
  preferredContact: PreferredContact
}>

export type RenderOptions = Readonly<{
  receivedAt: Date
  /** The website's host, named in the footer. */
  site: string
  /** Overrides the mark's cid: source (the preview uses a data URI). */
  markSrc?: string
}>

type Line = readonly [label: string, text: string, html: string]

function lines(enquiry: EnquiryEmailInput, received: string): readonly Line[] {
  const enquiringFor = ENQUIRY.options.enquiringFor[enquiry.enquiringFor]
  const preferred = ENQUIRY.options.preferredContact[enquiry.preferredContact]
  const all: readonly (Line | null)[] = [
    [ENQUIRY.fields.name, enquiry.name, escapeHtml(enquiry.name)],
    [ENQUIRY.fields.email, enquiry.email, actionLink(`mailto:${enquiry.email}`, enquiry.email)],
    enquiry.telephone
      ? [
          ASSESSMENT_SEND.fields.telephone,
          enquiry.telephone,
          actionLink(`tel:${enquiry.telephone.replace(/[^\d+]/g, '')}`, enquiry.telephone),
        ]
      : null,
    [ENQUIRY.fields.enquiringFor, enquiringFor, escapeHtml(enquiringFor)],
    [ENQUIRY.fields.preferredContact, preferred, escapeHtml(preferred)],
    [EMAIL.received, received, escapeHtml(received)],
  ]
  return all.filter((line): line is Line => line !== null)
}

export function enquirySubject(enquiry: Pick<EnquiryEmailInput, 'enquiringFor'>): string {
  return `${ENQUIRY.mail.subject}${SUBJECT_SEPARATOR}${ENQUIRY.mail.subjectLabels[enquiry.enquiringFor]}`
}

export function renderEnquiryEmail(
  enquiry: EnquiryEmailInput,
  { receivedAt, site, markSrc }: RenderOptions
): RenderedEmail {
  const subject = enquirySubject(enquiry)
  const received = formatPracticeTime(receivedAt)
  const details = lines(enquiry, received)
  const reply = fill(EMAIL.replyNote, { name: enquiry.name })
  const footer = fill(EMAIL.footer, { site })

  const rows: readonly DetailRow[] = details.map(([label, , valueHtml]) => ({ label, valueHtml }))
  const html = renderLayout({
    title: subject,
    preheader: fill(EMAIL.enquiry.preheader, { name: enquiry.name }),
    eyebrow: EMAIL.enquiry.eyebrow,
    heading: enquiry.name,
    introHtml: escapeHtml(EMAIL.enquiry.intro),
    bodyHtml: [
      detailRows(rows),
      blockHeading(ENQUIRY.fields.message),
      paragraph(escapeMultiline(enquiry.message)),
    ].join('\n'),
    footerHtml: [escapeHtml(reply), escapeHtml(footer)],
    markSrc,
    wordmark: BRAND.nameUpper,
  })

  const text = [
    `${BRAND.name}`,
    `${EMAIL.enquiry.eyebrow}`,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    `${ENQUIRY.fields.message}:`,
    enquiry.message,
    '',
    '---',
    reply,
    footer,
    '',
  ].join('\n')

  return { subject, html, text }
}
