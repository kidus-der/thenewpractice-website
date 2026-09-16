/**
 * The enquiry schema — one Zod object shared by the browser (React Hook Form
 * via zodResolver, the visible fields only) and the server action (every
 * field, including the two anti-abuse ones). Messages come from the content
 * layer so the browser and the server always say the same sentence.
 */
import { z } from 'zod'

import { ENQUIRING_FOR, ENQUIRY, ENQUIRY_LIMITS, PREFERRED_CONTACT } from '@/content/enquiry'

/** A submission finished faster than this is not a person. */
export const ENQUIRY_MIN_ELAPSED_MS = 3_000
/** A form left open longer than this is re-rendered rather than trusted. */
export const ENQUIRY_MAX_AGE_MS = 2 * 60 * 60 * 1_000

/**
 * A leading plus and country code, then digits, spaces and the usual
 * punctuation: loose E.164. The plus is required because the field's error
 * message asks for the country code (provenance audit, B6).
 */
const TELEPHONE = /^\+\d[\d\s().-]{5,23}$/
const DIGITS = /^\d+$/

const trimmed = z.string().trim()

const optionalText = (schema: z.ZodString) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional()
  )

/** What a person sees and fills in. The client validates this on blur. */
export const enquiryFormSchema = z.object({
  name: trimmed
    .min(1, { error: ENQUIRY.errors.name })
    .max(ENQUIRY_LIMITS.nameMax, { error: ENQUIRY.errors.nameLength }),
  email: trimmed.pipe(z.email({ error: ENQUIRY.errors.email })),
  telephone: optionalText(trimmed.regex(TELEPHONE, { error: ENQUIRY.errors.telephone })),
  enquiringFor: z.enum(ENQUIRING_FOR, { error: ENQUIRY.errors.enquiringFor }),
  message: trimmed
    .min(1, { error: ENQUIRY.errors.message })
    .max(ENQUIRY_LIMITS.messageMax, { error: ENQUIRY.errors.messageLength }),
  preferredContact: z.enum(PREFERRED_CONTACT, { error: ENQUIRY.errors.preferredContact }),
})

/** The full submission: the visible fields plus the honeypot and the timing token. */
export const enquirySchema = enquiryFormSchema.extend({
  /** Honeypot. A person never sees it; it must arrive empty. */
  website: z.string().max(0),
  /** Epoch milliseconds written by the browser when the form mounted; absent without JavaScript. */
  startedAt: optionalText(z.string().regex(DIGITS)).transform((value) =>
    value === undefined ? undefined : Number(value)
  ),
})

export type EnquiryFormValues = z.input<typeof enquiryFormSchema>
export type EnquiryFormOutput = z.output<typeof enquiryFormSchema>
export type EnquirySubmission = z.output<typeof enquirySchema>
export type EnquiryFieldName = keyof EnquiryFormOutput
export type EnquiryFieldErrors = Partial<Record<EnquiryFieldName, string>>

export const ENQUIRY_FIELD_NAMES = Object.keys(
  enquiryFormSchema.shape
) as readonly EnquiryFieldName[]
const SUBMISSION_KEYS = Object.keys(
  enquirySchema.shape
) as readonly (keyof typeof enquirySchema.shape)[]

export type EnquiryInput = Readonly<Record<keyof typeof enquirySchema.shape, string>>

/** Every expected key as a string; a missing or file entry becomes "". */
export function formDataToEnquiryInput(formData: FormData): EnquiryInput {
  return Object.fromEntries(
    SUBMISSION_KEYS.map((key) => {
      const value = formData.get(key)
      return [key, typeof value === 'string' ? value : '']
    })
  ) as EnquiryInput
}

export type ParsedEnquiry =
  | { ok: true; data: EnquirySubmission }
  | { ok: false; fieldErrors: EnquiryFieldErrors; honeypot: boolean }

const isFieldName = (key: string): key is EnquiryFieldName =>
  (ENQUIRY_FIELD_NAMES as readonly string[]).includes(key)

/** Validates unknown input; on failure, the first content-layer message per visible field. */
export function parseEnquiry(input: unknown): ParsedEnquiry {
  const result = enquirySchema.safeParse(input)
  if (result.success) return { ok: true, data: result.data }

  const { fieldErrors: raw } = z.flattenError(result.error)
  const fieldErrors = Object.fromEntries(
    Object.entries(raw)
      .filter(
        ([key, messages]) => isFieldName(key) && messages !== undefined && messages.length > 0
      )
      .map(([key, messages]) => [key, messages?.[0]])
  ) as EnquiryFieldErrors
  return { ok: false, fieldErrors, honeypot: 'website' in raw }
}

export type TimingVerdict = 'ok' | 'too-fast' | 'expired' | 'absent'

/** Pure: how the timing token relates to `now`. The handler decides what to do with the verdict. */
export function checkTiming(startedAt: number | undefined, now: number): TimingVerdict {
  if (startedAt === undefined) return 'absent'
  const elapsed = now - startedAt
  if (elapsed < ENQUIRY_MIN_ELAPSED_MS) return 'too-fast'
  if (elapsed > ENQUIRY_MAX_AGE_MS) return 'expired'
  return 'ok'
}
