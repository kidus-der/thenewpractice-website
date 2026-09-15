/**
 * Pure helpers for the residences template (docs/05 §T5). The privacy
 * statement's sentence is read from the About page rather than written here,
 * so the only words on the residences page that are not marked PLACEHOLDER
 * are the client's own; the carousel's plates are the page's captions paired
 * with the manifest's frames, alt and credit.
 */
import { ABOUT } from '@/content/pages/about'
import { MEDIA, type MediaKey } from '@/content/media'
import type { Page, ResidencesPage, Section } from '@/content/schemas'
import { numeral } from '@/lib/interior'

/** The About section the discretion sentence lives in (pages/about.ts §Privacy, Safety and Peace). */
export const DISCRETION_SECTION = 'privacy-safety-and-peace'
/** The sentence is the one that names discretion; the position is not relied on. */
export const DISCRETION_WORD = /discretion/i

/** docs/05 §T5: six 3:4 plates. */
export const RESIDENCE_PLATE_COUNT = 6

export type ResidencePlate = Readonly<{
  index: string
  caption: string
  media: MediaKey
  alt: string
  credit: string
}>

/**
 * The client's own sentence about discretion, verbatim, or undefined when the
 * ingestion has moved it — the template then renders the plate without a
 * statement rather than an invented line.
 */
export function discretionStatement(page: Page = ABOUT): string | undefined {
  const section = findSection(page.sections, DISCRETION_SECTION)
  return section?.paragraphs.find((paragraph) => DISCRETION_WORD.test(paragraph))
}

/** Depth-first over sections and their subsections (the About section is one level down). */
function findSection(sections: readonly Section[], id: string): Section | undefined {
  for (const section of sections) {
    if (section.id === id) return section
    const nested = findSection(section.subsections ?? [], id)
    if (nested) return nested
  }
  return undefined
}

/** `01 / 06` — the caption's counter in the eyebrow register. */
export const plateCounter = (index: string, total: number): string => `${index} / ${numeral(total)}`

/** The page's six plates paired, in order, with their frames. Fails loudly on a mismatch. */
export function residencePlates(
  plates: ResidencesPage['plates'],
  media: readonly MediaKey[]
): readonly ResidencePlate[] {
  if (plates.length !== RESIDENCE_PLATE_COUNT || media.length !== RESIDENCE_PLATE_COUNT) {
    throw new Error(
      `residences: expected ${RESIDENCE_PLATE_COUNT} plates and 6 media keys, got ${plates.length} and ${media.length}`
    )
  }
  return plates.flatMap((plate, i) => {
    const key = media[i]
    if (!key) return []
    const frame = MEDIA[key]
    return [
      {
        index: plate.index,
        caption: plate.caption,
        media: key,
        alt: frame.alt,
        credit: frame.credit,
      },
    ]
  })
}
