/**
 * Pure helpers for the home template (docs/05 §T1). Everything here is a
 * function of the content module, so the template can compose the five
 * sections by id and the tests can pin the behaviour without a DOM.
 */
import type { HomePage, Section } from '@/content/schemas'
import type { MediaKey } from '@/content/media'

/** The five section ids the template composes against, in page order. */
export const HOME_SECTION_IDS = {
  statement: 'private-treatment-without-compromise',
  longRead: 'recovery-without-interruption',
  conditions: 'who-we-help',
  philosophy: 'our-philosophy',
  conversation: 'begin-the-conversation',
} as const

/** The manifesto is the philosophy section's one subsection. */
export const MANIFESTO_ID = 'why-the-new-practice'

export type HomeSections = Readonly<{
  statement: Section
  longRead: Section
  conditions: Section
  philosophy: Section
  manifesto: Section
  conversation: Section
}>

function sectionById(page: HomePage, id: string): Section {
  const section = page.sections.find((s) => s.id === id)
  if (!section) throw new Error(`pages/home.ts: no section with id "${id}"`)
  return section
}

/**
 * Resolves the five sections and the manifesto subsection by id. Throws at
 * build time if the ingestion renames one, rather than rendering a hole.
 */
export function homeSections(page: HomePage): HomeSections {
  const philosophy = sectionById(page, HOME_SECTION_IDS.philosophy)
  const manifesto = philosophy.subsections?.find((s) => s.id === MANIFESTO_ID)
  if (!manifesto) {
    throw new Error(`pages/home.ts: "${HOME_SECTION_IDS.philosophy}" has no "${MANIFESTO_ID}"`)
  }
  return {
    statement: sectionById(page, HOME_SECTION_IDS.statement),
    longRead: sectionById(page, HOME_SECTION_IDS.longRead),
    conditions: sectionById(page, HOME_SECTION_IDS.conditions),
    philosophy,
    manifesto,
    conversation: sectionById(page, HOME_SECTION_IDS.conversation),
  }
}

const SENTENCE_END = /(?<=[.!?])\s+/

/**
 * "One Client. One Team. One Purpose." → three lines, one sentence each,
 * in the client's own casing. A subtitle with a single sentence is one line.
 */
export function triadLines(subtitle: string): readonly string[] {
  return subtitle
    .split(SENTENCE_END)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export type PullLine = Readonly<{ body: string; pull: string | null }>

/**
 * Splits the final sentence off a paragraph so the template can set it as
 * the serif-italic pull line. A one-sentence paragraph has no pull line: the
 * body would otherwise be empty.
 */
export function splitPullLine(paragraph: string): PullLine {
  const sentences = paragraph.trim().split(SENTENCE_END)
  if (sentences.length < 2) return { body: paragraph.trim(), pull: null }
  const pull = sentences.at(-1) ?? ''
  const body = sentences.slice(0, -1).join(' ')
  return { body, pull }
}

/** The plate for a list row: the given plates cycled in order. */
export function plateForRow(index: number, plates: readonly MediaKey[]): MediaKey {
  const plate = plates[index % plates.length]
  if (!plate) throw new Error('plateForRow: no plates supplied')
  return plate
}
