/**
 * CONTENT SCHEMAS — docs/06-copy-deck.md
 *
 * Every content module parses its data through one of these schemas at import
 * time, so a bad edit to a generated file fails the build rather than reaching
 * a template. Shapes follow the structure of the client document: pages hold
 * sections, sections hold paragraphs, an optional list, optional definitions
 * (term + description pairs) and optional subtitled subsections.
 *
 * Rendering order inside a section is fixed by the document and is always:
 * paragraphs → listHeading → list → outro → definitions → subsections.
 */
import { z } from 'zod'

const INVISIBLE = [...String.fromCodePoint(0x200b, 0x2060, 0xfeff)]
const MARKDOWN_RESIDUE = /[*\	]/
const hasResidue = (s: string): boolean =>
  MARKDOWN_RESIDUE.test(s) || INVISIBLE.some((c) => s.includes(c))

/** A clean, verbatim string: non-empty, trimmed, no markdown residue. */
export const text = z
  .string()
  .min(1)
  .refine((s) => s === s.trim(), 'no leading or trailing whitespace')
  .refine((s) => !hasResidue(s), 'no markdown emphasis, escapes or invisible characters')

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case slug')

const order = z.number().int().positive()

export const definitionSchema = z.object({ term: text, description: text })

export const signatureSchema = z.object({
  /** The closing line above the name ("Warm regards,"); a route composes it from the last paragraph. */
  valediction: text.optional(),
  name: text,
  credentials: text.optional(),
  role: text,
  organisation: text.optional(),
})

export const sectionSchema = z.object({
  id: slug,
  title: text.optional(),
  subtitle: text.optional(),
  /** The document's single `Header:` line (About §1). */
  header: text.optional(),
  paragraphs: z.array(text),
  /** The paragraph ending in a colon that introduces the list. */
  listHeading: text.optional(),
  list: z.array(text).optional(),
  /** Paragraphs that follow the list in the document. */
  outro: z.array(text).optional(),
  definitions: z.array(definitionSchema).optional(),
  signature: signatureSchema.optional(),
  get subsections() {
    return z.array(sectionSchema).optional()
  },
})

export const pageSchema = z.object({
  slug: slug,
  title: text,
  eyebrow: text.optional(),
  lead: text.optional(),
  sections: z.array(sectionSchema),
})

/** Founder contact block; values come from brand.ts, never duplicated. */
export const contactBlockSchema = z.object({
  name: text,
  credentials: text.optional(),
  role: text,
  phone: text,
  email: text,
  locale: text,
})

export const heroSchema = z.object({
  title: text,
  subtitle: text,
  cue: text,
  /** The voice-over monologue, spoken words only. */
  audioScript: text,
  /** Path under /public once the recording exists; null renders no toggle. */
  audioSrc: z.string().nullable(),
  /** The client's video and audio direction, kept for the media task. */
  videoBrief: text,
})

export const homePageSchema = pageSchema.extend({ hero: heroSchema, contact: contactBlockSchema })

export const contactPageSchema = pageSchema.extend({
  contact: contactBlockSchema.extend({ organisation: text, website: text }),
})

export const letterPageSchema = pageSchema.extend({ signature: signatureSchema })

export const plateSchema = z.object({ index: text, caption: text, alt: text })

export const residencesPageSchema = pageSchema.extend({
  plates: z.array(plateSchema).length(6),
  amenities: z.array(text).min(1),
})

export const serviceSchema = z.object({
  slug: slug,
  order,
  title: text,
  intro: z.array(text).min(1),
  treatsHeading: text.optional(),
  treats: z.array(text).optional(),
  mayIncludeHeading: text.optional(),
  mayInclude: z.array(text).optional(),
  /** Paragraphs after the lists and before any subsection. */
  outro: z.array(text).optional(),
  definitions: z.array(definitionSchema).optional(),
  subsections: z.array(sectionSchema).optional(),
})

export const teamMemberSchema = z.object({
  slug: slug,
  order,
  name: text,
  credentials: text.optional(),
  role: text,
  paragraphs: z.array(text).min(1),
})

export const QUESTIONS_PER_ASSESSMENT = 15

export const bandKeySchema = z.enum(['mild', 'moderate', 'severe'])

export const scoringBandSchema = z.object({
  key: bandKeySchema,
  min: z.number().int().min(0),
  max: z.number().int().max(QUESTIONS_PER_ASSESSMENT),
  label: text,
  description: text.optional(),
})

export const scoringSchema = z.object({
  perYes: z.literal(1),
  max: z.literal(QUESTIONS_PER_ASSESSMENT),
  bands: z.array(scoringBandSchema).length(3),
})

export const assessmentSchema = z.object({
  slug: slug,
  order,
  title: text,
  questions: z.array(text).length(QUESTIONS_PER_ASSESSMENT),
  scoring: scoringSchema,
  interpretation: text,
})

/** The 0–3 scale from the document's how-to section. Superseded; see CONTENT-GAPS. */
export const supersededScaleSchema = z.object({
  instruction: text,
  scale: z.array(z.object({ value: z.number().int(), label: text })).length(4),
  totalNote: text,
  guideTitle: text,
  guide: z.array(z.object({ range: text, label: text, description: text })).length(4),
})

export const assessmentSeriesSchema = z.object({
  toolLabel: text,
  seriesTitle: text,
  scoringText: text,
  instruction: text,
  supersededScale: supersededScaleSchema,
})

export const navItemSchema = z.object({ label: text, href: z.string().startsWith('/') })

export const navSchema = z.object({
  primary: z.array(navItemSchema).min(1),
  utility: z.array(navItemSchema).min(1),
  footer: z.array(z.object({ heading: text, items: z.array(navItemSchema).min(1) })).min(1),
})

export type Definition = z.infer<typeof definitionSchema>
export type Signature = z.infer<typeof signatureSchema>
export type Section = z.infer<typeof sectionSchema>
export type Page = z.infer<typeof pageSchema>
export type ContactBlock = z.infer<typeof contactBlockSchema>
export type Hero = z.infer<typeof heroSchema>
export type HomePage = z.infer<typeof homePageSchema>
export type ContactPage = z.infer<typeof contactPageSchema>
export type LetterPage = z.infer<typeof letterPageSchema>
export type Plate = z.infer<typeof plateSchema>
export type ResidencesPage = z.infer<typeof residencesPageSchema>
export type Service = z.infer<typeof serviceSchema>
export type TeamMember = z.infer<typeof teamMemberSchema>
export type BandKey = z.infer<typeof bandKeySchema>
export type ScoringBand = z.infer<typeof scoringBandSchema>
export type Assessment = z.infer<typeof assessmentSchema>
export type AssessmentSeries = z.infer<typeof assessmentSeriesSchema>
export type NavItem = z.infer<typeof navItemSchema>
export type Nav = z.infer<typeof navSchema>
