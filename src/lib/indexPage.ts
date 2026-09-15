/**
 * Pure helpers for the index template (docs/05 §T6). The rows of each
 * collection as links, and the two small compositions an index route makes
 * on its page module: lifting an untitled opening paragraph into the title
 * page's lead, and lifting a section's first sentence into its serif header
 * line. Every function returns a new object; nothing here mutates content.
 */
import type { MediaKey } from '@/content/media'
import { assessmentHref, serviceHref, teamHref } from '@/content/nav'
import type { Assessment, Page, Section, Service, TeamMember } from '@/content/schemas'

export type IndexRow = Readonly<{
  href: string
  /** The row's name in the Didone. */
  title: string
  /** One line beneath the title in the eyebrow register (a role, a length). */
  meta?: string
  /** The hover plate for this row. Absent until a collection has plates. */
  media?: MediaKey
}>

const byOrder = <T extends { order: number }>(items: readonly T[]): readonly T[] =>
  [...items].sort((a, b) => a.order - b.order)

/** The eleven services: title only. Services carry no plates yet (ledger, Task 12). */
export const rowsFromServices = (services: readonly Service[]): readonly IndexRow[] =>
  byOrder(services).map((service) => ({
    href: serviceHref(service.slug),
    title: service.title,
  }))

/** The team: name over role. No portraits until the client supplies them (docs/02). */
export const rowsFromTeam = (team: readonly TeamMember[]): readonly IndexRow[] =>
  byOrder(team).map((member) => ({
    href: teamHref(member.slug),
    title: member.name,
    meta: member.role,
  }))

/** The ten questionnaires: title over the shared length line the route passes in. */
export const rowsFromAssessments = (
  assessments: readonly Assessment[],
  meta: string
): readonly IndexRow[] =>
  byOrder(assessments).map((assessment) => ({
    href: assessmentHref(assessment.slug),
    title: assessment.title,
    meta,
  }))

export const hasRowImages = (rows: readonly IndexRow[]): boolean =>
  rows.some((row) => row.media !== undefined)

/**
 * The first paragraph of `sectionId` becomes the page lead on the title page;
 * the section keeps the rest, or disappears when nothing is left. A page
 * whose named section has no paragraph is returned as is.
 */
export function liftLead(page: Page, sectionId: string): Page {
  const index = page.sections.findIndex((section) => section.id === sectionId)
  const target = page.sections[index]
  const [lead, ...rest] = target?.paragraphs ?? []
  if (!target || lead === undefined) return page

  const remainder: Section = { ...target, paragraphs: rest }
  const sections = page.sections.flatMap((section, i) =>
    i !== index ? [section] : rest.length ? [remainder] : []
  )
  return { ...page, lead, sections }
}

/** The section's first paragraph set as its serif header line (docs/05 §T2 `header`). */
export function liftHeader(section: Section): Section {
  const [header, ...paragraphs] = section.paragraphs
  if (header === undefined) return section
  return { ...section, header, paragraphs }
}

/** The section with further lines after the document's own paragraphs. */
export const appendParagraphs = (section: Section, extra: readonly string[]): Section => ({
  ...section,
  paragraphs: [...section.paragraphs, ...extra],
})
