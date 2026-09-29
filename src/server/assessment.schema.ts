/**
 * The *Send my answers to the practice* schema (round 1, R6). One Zod object
 * shared by the browser (React Hook Form, the visible fields) and the server
 * action (those plus the questionnaire, the answers and the two anti-abuse
 * fields). Messages come from the content layer, so both sides say the same
 * sentence.
 *
 * The contact rule: a name, a preferred channel, and the detail for that
 * channel (an email address or a telephone number); the other detail is
 * optional, and validated when given. Consent is a checkbox that must be
 * ticked.
 *
 * The answers are never trusted from the browser: the server re-reads the
 * questionnaire by slug, checks one answer of the right type per question,
 * and scores the sheet itself.
 */
import { z } from 'zod'

import { ASSESSMENTS } from '@/content/assessments'
import { answerTypesFor } from '@/content/assessment-answers'
import { ASSESSMENT_SEND, ASSESSMENT_SEND_LIMITS } from '@/content/assessment-send'
import { PREFERRED_CONTACT } from '@/content/enquiry'
import type { Assessment } from '@/content/schemas'
import { fitsType, type FactAnswer } from '@/lib/assessment'
import { DIGITS, TELEPHONE, optionalText } from './enquiry.schema'

const E = ASSESSMENT_SEND.errors
const trimmed = z.string().trim()

/** The value a ticked consent box carries, in the browser and in FormData. */
export const CONSENT_VALUE = 'yes'

const fields = {
  name: trimmed
    .min(1, { error: E.name })
    .max(ASSESSMENT_SEND_LIMITS.nameMax, { error: E.nameLength }),
  email: optionalText(trimmed.pipe(z.email({ error: E.email }))),
  telephone: optionalText(trimmed.regex(TELEPHONE, { error: E.telephone })),
  preferredContact: z.enum(PREFERRED_CONTACT, { error: E.preferredContact }),
  /** React Hook Form gives `'yes'` or `false`; FormData gives `'yes'` or nothing. */
  consent: z.preprocess(
    (value) => (value === true || value === CONSENT_VALUE ? CONSENT_VALUE : undefined),
    z.literal(CONSENT_VALUE, { error: E.consent })
  ),
}

type ContactShape = Readonly<{
  email?: unknown
  telephone?: unknown
  preferredContact: (typeof PREFERRED_CONTACT)[number]
}>

const preferenceChosen = z.object({ preferredContact: z.enum(PREFERRED_CONTACT) })

/**
 * The detail for the preferred channel must be given. Run whenever a channel
 * is chosen, even while other fields still fail (Zod skips a refinement on an
 * object with issues unless told otherwise), so every missing thing is named
 * at once.
 */
function withContactRule<T extends z.ZodType<ContactShape>>(schema: T) {
  const when = (payload: { value: unknown }) => preferenceChosen.safeParse(payload.value).success
  return schema
    .refine((value) => value.preferredContact !== 'email' || Boolean(value.email), {
      path: ['email'],
      message: E.email,
      when,
    })
    .refine((value) => value.preferredContact !== 'telephone' || Boolean(value.telephone), {
      path: ['telephone'],
      message: E.telephone,
      when,
    })
}

/** What a person sees and fills in. The browser validates this on blur. */
export const assessmentSendFormSchema = withContactRule(z.object(fields))

const submissionShape = z.object({
  ...fields,
  /** The questionnaire, by slug. */
  slug: z.string().min(1),
  /** The answers, as the JSON array the result was scored from. */
  answers: z.string().min(2),
  /** Honeypot. A person never sees it; it must arrive empty. */
  website: z.string().max(0),
  /** Epoch ms when the send form opened. Required: the form exists only with JavaScript. */
  startedAt: z.string().regex(DIGITS).transform(Number),
})

/** The full submission: the visible fields, the sheet, the honeypot and the timing token. */
export const assessmentSendSchema = withContactRule(submissionShape)

export type AssessmentSendValues = z.input<typeof assessmentSendFormSchema>
export type AssessmentSendSubmission = z.output<typeof assessmentSendSchema>
export type AssessmentSendFieldName = keyof typeof fields
export type AssessmentSendFieldErrors = Partial<Record<AssessmentSendFieldName, string>>

const FIELD_NAMES = Object.keys(fields) as readonly AssessmentSendFieldName[]
const SUBMISSION_KEYS = Object.keys(submissionShape.shape) as readonly string[]

/** Every expected key as a string; a missing or file entry becomes "". */
export function formDataToAssessmentSendInput(
  formData: FormData
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    SUBMISSION_KEYS.map((key) => {
      const value = formData.get(key)
      return [key, typeof value === 'string' ? value : '']
    })
  )
}

export type ParsedAssessmentSend =
  | { ok: true; data: AssessmentSendSubmission }
  | { ok: false; fieldErrors: AssessmentSendFieldErrors; honeypot: boolean; malformed: boolean }

const isFieldName = (key: string): key is AssessmentSendFieldName =>
  (FIELD_NAMES as readonly string[]).includes(key)

/** Validates unknown input; on failure, the first content-layer message per visible field. */
export function parseAssessmentSend(input: unknown): ParsedAssessmentSend {
  const result = assessmentSendSchema.safeParse(input)
  if (result.success) return { ok: true, data: result.data }

  const { fieldErrors: raw } = z.flattenError(result.error)
  const fieldErrors = Object.fromEntries(
    Object.entries(raw)
      .filter(([key, messages]) => isFieldName(key) && messages && messages.length > 0)
      .map(([key, messages]) => [key, messages?.[0]])
  ) as AssessmentSendFieldErrors
  const hidden = ['slug', 'answers', 'startedAt'].some((key) => key in raw)
  return { ok: false, fieldErrors, honeypot: 'website' in raw, malformed: hidden }
}

export type AnswerSheet = Readonly<{
  assessment: Assessment
  answers: readonly (FactAnswer | number)[]
}>

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/**
 * The questionnaire and a complete sheet of answers that fit it, or null:
 * an unknown slug, JSON that is not an array, the wrong number of answers,
 * an unanswered question, or an answer of the wrong type.
 */
export function parseAnswerSheet(
  slug: string,
  raw: string,
  assessments: readonly Assessment[] = ASSESSMENTS
): AnswerSheet | null {
  const assessment = assessments.find((a) => a.slug === slug)
  if (!assessment) return null
  const answers = parseJson(raw)
  if (!Array.isArray(answers)) return null
  const types = answerTypesFor(slug)
  if (answers.length !== types.length || answers.length !== assessment.questions.length) return null
  const fits = answers.every(
    (answer, i) =>
      (typeof answer === 'number' || typeof answer === 'string') &&
      fitsType(answer as FactAnswer | number, types[i] ?? 'scale')
  )
  return fits ? { assessment, answers: answers as (FactAnswer | number)[] } : null
}
