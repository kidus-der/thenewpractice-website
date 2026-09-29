/**
 * SENTENCES — pure prose splitting, no imports.
 *
 * Shared by the metadata builders (seo.ts, src/lib/seo.ts), the provenance
 * check (content.checks.ts) and the curation layer (curated/core.ts), which
 * picks the client's sentences by index. One splitter, so a sentence index
 * means the same thing everywhere.
 */

const ABBREVIATIONS = new Set(['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'St'])
const SENTENCE_BOUNDARY = /(?<=[.!?…])\s+(?=[A-Z“"(])/
const TRAILING_PUNCTUATION = /[.!?…]$/

const endsWithAbbreviation = (piece: string): boolean => {
  const lastWord = piece.split(/\s+/).at(-1) ?? ''
  return ABBREVIATIONS.has(lastWord.replace(TRAILING_PUNCTUATION, ''))
}

/** Splits prose into sentences without breaking after "Dr." and friends. */
export function sentences(text: string): readonly string[] {
  const pieces = text.trim().split(SENTENCE_BOUNDARY)
  return pieces.reduce<readonly string[]>((acc, piece) => {
    const previous = acc.at(-1)
    if (previous !== undefined && endsWithAbbreviation(previous)) {
      return [...acc.slice(0, -1), `${previous} ${piece}`]
    }
    return [...acc, piece]
  }, [])
}
