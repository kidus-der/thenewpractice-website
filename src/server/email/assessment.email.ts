/**
 * The self-assessment email (round 1, R6): sent only when a visitor chooses
 * *Send my answers to the practice* beneath their result. The questionnaire's
 * title, the average severity and the band in the client's label, the
 * sender's contact details and preferred contact, the time on the practice's
 * clock, then every question with its answer, in the client's order. HTML and
 * plain text say the same thing. Reply-to is the sender's email when given.
 */
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import { BRAND } from '@/content/brand'
import { EMAIL } from '@/content/email'
import { ENQUIRY, type PreferredContact } from '@/content/enquiry'
import { SCALE_MAX, factLabel, scoreLabel, type FactAnswer } from '@/lib/assessment'
import type { RenderOptions } from './enquiry.email'
import {
  actionLink,
  blockHeading,
  detailRows,
  displayLine,
  escapeHtml,
  fill,
  numberedRows,
  paragraph,
  renderLayout,
  SUBJECT_SEPARATOR,
  type RenderedEmail,
} from './layout'
import { formatPracticeTime } from './time'

export type AssessmentContact = Readonly<{
  name: string
  email?: string
  telephone?: string
  preferredContact: PreferredContact
}>

export type AssessmentEmailInput = Readonly<{
  /** The questionnaire's title, the client's. */
  title: string
  /** The client's questions, in order. */
  questions: readonly string[]
  /** One answer per question, in the same order. */
  answers: readonly (FactAnswer | number)[]
  /** Average severity to one decimal, as the result showed it. */
  average: number
  /** The band in the client's label, as the result showed it. */
  bandLabel: string
  contact: AssessmentContact
}>

/** "7 of 10" for a scale answer, the word for yes / no / maybe. */
export function answerLabel(answer: FactAnswer | number): string {
  return typeof answer === 'number'
    ? fill(EMAIL.assessment.scaleAnswer, { value: answer, max: SCALE_MAX })
    : factLabel(answer)
}

const numeral = (index: number): string => String(index + 1).padStart(2, '0')

export function assessmentSubject(title: string): string {
  return `${EMAIL.assessment.subject}${SUBJECT_SEPARATOR}${title}`
}

type Line = readonly [label: string, text: string, html: string]

function contactLines(
  { name, email, telephone, preferredContact }: AssessmentContact,
  received: string
) {
  const preferred = ENQUIRY.options.preferredContact[preferredContact]
  const all: readonly (Line | null)[] = [
    [ASSESSMENT_SEND.fields.name, name, escapeHtml(name)],
    email ? [ASSESSMENT_SEND.fields.email, email, actionLink(`mailto:${email}`, email)] : null,
    telephone
      ? [
          ASSESSMENT_SEND.fields.telephone,
          telephone,
          actionLink(`tel:${telephone.replace(/[^\d+]/g, '')}`, telephone),
        ]
      : null,
    [ASSESSMENT_SEND.fields.preferredContact, preferred, escapeHtml(preferred)],
    [EMAIL.received, received, escapeHtml(received)],
  ]
  return all.filter((line): line is Line => line !== null)
}

export function renderAssessmentEmail(
  input: AssessmentEmailInput,
  { receivedAt, site, markSrc }: RenderOptions
): RenderedEmail {
  if (input.answers.length !== input.questions.length) {
    throw new Error(
      `renderAssessmentEmail: ${input.questions.length} questions, ${input.answers.length} answers`
    )
  }
  const { name } = input.contact
  const subject = assessmentSubject(input.title)
  const score = scoreLabel(input.average)
  const details = contactLines(input.contact, formatPracticeTime(receivedAt))
  const answers = input.questions.map((text, i) => ({
    numeral: numeral(i),
    text,
    answer: answerLabel(input.answers[i] as FactAnswer | number),
  }))
  const reply = input.contact.email ? fill(EMAIL.replyNote, { name }) : EMAIL.assessment.noEmailNote
  const intro = fill(EMAIL.assessment.intro, { name })
  const footer = fill(EMAIL.footer, { site })

  const html = renderLayout({
    title: subject,
    preheader: fill(EMAIL.assessment.preheader, { name }),
    eyebrow: EMAIL.assessment.eyebrow,
    heading: input.title,
    introHtml: escapeHtml(intro),
    bodyHtml: [
      blockHeading(EMAIL.assessment.resultHeading),
      paragraph(escapeHtml(score), 12),
      displayLine(input.bandLabel, 4),
      blockHeading(EMAIL.assessment.contactHeading),
      detailRows(details.map(([label, , valueHtml]) => ({ label, valueHtml }))),
      blockHeading(EMAIL.assessment.answersHeading),
      numberedRows(answers),
    ].join('\n'),
    footerHtml: [escapeHtml(reply), escapeHtml(footer)],
    markSrc,
    wordmark: BRAND.nameUpper,
  })

  const text = [
    BRAND.name,
    `${EMAIL.assessment.eyebrow}${SUBJECT_SEPARATOR}${input.title}`,
    '',
    intro,
    '',
    `${EMAIL.assessment.resultHeading}:`,
    score,
    input.bandLabel,
    '',
    `${EMAIL.assessment.contactHeading}:`,
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    `${EMAIL.assessment.answersHeading}:`,
    ...answers.map(({ numeral: n, text: q, answer }) => `${n}. ${q}\n    ${answer}`),
    '',
    '---',
    reply,
    footer,
    '',
  ].join('\n')

  return { subject, html, text }
}
