/**
 * Pure helpers for the interior template (docs/05 §T2). Section numerals,
 * the sticky index's items and threshold, plate ratios, and a build-time
 * guard for the section ids a page composes against.
 */
import type { Page, Section } from '@/content/schemas'

/** docs/05 §T2: the sticky index appears on pages with at least this many sections. */
export const STICKY_INDEX_MIN_SECTIONS = 5

export type IndexItem = Readonly<{ id: string; title: string; numeral: string }>

/** docs/02 §Treatment — the only aspect ratios on the site. */
export type PlateRatio = '3:4' | '16:9' | '21:9'

const RATIOS: readonly (readonly [PlateRatio, number])[] = [
  ['3:4', 3 / 4],
  ['16:9', 16 / 9],
  ['21:9', 21 / 9],
]

/** `0` → `00`, `7` → `07`. The section grammar's two-digit numeral. */
export const numeral = (n: number): string => String(n).padStart(2, '0')

/** The titled sections of a page, numbered by position (untitled sections still count). */
export function sectionsToIndex(sections: readonly Section[]): readonly IndexItem[] {
  return sections.flatMap((section, i) =>
    section.title ? [{ id: section.id, title: section.title, numeral: numeral(i + 1) }] : []
  )
}

export const hasStickyIndex = (sections: readonly Section[]): boolean =>
  sections.length >= STICKY_INDEX_MIN_SECTIONS

/** The standing ratio nearest to a frame's own proportions. */
export function plateRatio(width: number, height: number): PlateRatio {
  if (width <= 0 || height <= 0) throw new Error(`plateRatio: invalid frame ${width}×${height}`)
  const actual = width / height
  const [nearest] = RATIOS.reduce((best, candidate) =>
    Math.abs(candidate[1] - actual) < Math.abs(best[1] - actual) ? candidate : best
  )
  return nearest
}

const allSectionIds = (sections: readonly Section[]): readonly string[] =>
  sections.flatMap((s) => [s.id, ...allSectionIds(s.subsections ?? [])])

/**
 * A page composes plates and figures against section ids; if the content
 * ingestion renames one, fail the build rather than silently drop the plate.
 */
export function assertSectionIds(page: Page, ids: readonly string[]): void {
  const known = new Set(allSectionIds(page.sections))
  const missing = ids.filter((id) => !known.has(id))
  if (missing.length) {
    throw new Error(`pages/${page.slug}: no section with id ${missing.join(', ')}`)
  }
}

/** The two light grounds a body section may sit on (ContentSection's `Ground`). */
export type SectionGround = 'light' | 'mid'

/**
 * docs/02 §Ground rhythm, site-wide since Task 13: a sand block never follows
 * another sand block — the later one yields to bone, so two sand bands never
 * merge into one. Given the sections in order and the grounds a route asked
 * for (unlisted sections are bone), returns the ground each section renders
 * on. `preceding` is the ground of whatever block sits directly above the
 * first section, when that block is not one of these sections.
 */
export function resolveGrounds(
  sections: readonly Section[],
  requested: Readonly<Record<string, SectionGround>> | undefined,
  preceding: SectionGround = 'light'
): readonly SectionGround[] {
  return sections.reduce<readonly SectionGround[]>((acc, section) => {
    const above = acc.at(-1) ?? preceding
    const wants = requested?.[section.id] ?? 'light'
    return [...acc, wants === 'mid' && above === 'mid' ? 'light' : wants]
  }, [])
}

/**
 * A description split from the client's `Name: description` lines begins
 * lowercase; the definitions block capitalises its first character at render
 * (ledger, Task 13 triage). Display only — the content module stays verbatim.
 */
export function capitaliseFirst(text: string): string {
  const first = text.codePointAt(0)
  if (first === undefined) return text
  const head = String.fromCodePoint(first)
  return head.toLocaleUpperCase('en-GB') + text.slice(head.length)
}
