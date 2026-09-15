/**
 * The letter page (docs/05 §T2, `/a-personal-message`). The client closes
 * the letter with "Warm regards," as its final paragraph and then the
 * signature lines. A printed letter sets that valediction with the
 * signature, not with the body, so the route lifts it out of the prose and
 * into the signature block. Pure; the content module is never edited.
 */
import type { LetterPage, Section } from '@/content/schemas'

/** A valediction is a short closing line that ends in a comma ("Warm regards,"). */
const VALEDICTION = /^[^.!?]{1,40},$/

export type LetterBody = Readonly<{ section: Section }>

/**
 * The letter's single section with the closing line moved into its
 * signature. Throws when the page does not look like a letter — one section
 * ending in a valediction — so an ingestion change fails the build rather
 * than rendering "Warm regards," as a paragraph above nothing.
 */
export function letterSection(page: LetterPage): Section {
  const [section, ...rest] = page.sections
  if (!section || rest.length) {
    throw new Error(`pages/${page.slug}: a letter has exactly one section`)
  }
  const valediction = section.paragraphs.at(-1)
  if (!valediction || !VALEDICTION.test(valediction)) {
    throw new Error(`pages/${page.slug}: the last paragraph is not a valediction`)
  }
  return {
    ...section,
    paragraphs: section.paragraphs.slice(0, -1),
    signature: { ...page.signature, valediction },
  }
}
