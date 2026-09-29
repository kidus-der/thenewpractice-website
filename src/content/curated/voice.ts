/**
 * VOICE RULES FOR COPY WE WRITE — docs/01-brand-strategy.md §Voice, docs/06 rule 3.
 *
 * Pure: a string in, the list of rules it breaks out. content.checks.ts runs
 * it over every string that is ours (the `ours()` strings of the curation
 * layer, the interface strings, the placeholder pages). The client's own
 * sentences are never run through it: their dashes and their words are theirs.
 */

/** The one tolerated marker (Task 21). Everything after it is checked. */
export const PLACEHOLDER_PREFIX = 'PLACEHOLDER — '

/** docs/01 §Voice: forbidden in copy we write. Matched as whole words, any case, plural or inflected. */
export const FORBIDDEN_WORDS = [
  'journey',
  'transformative',
  'bespoke',
  'luxury',
  'unparalleled',
  'world-class',
  'cutting-edge',
  'oasis',
  'sanctuary',
  'elevate',
  'curated',
  'paradise',
  'escape',
] as const

/** En dash, em dash, horizontal bar, figure dash, minus sign. Hyphens are fine. */
const DASH = /[‒–—―−]/
const EXCLAMATION = /[!¡]/

/** `elevate` → elevates, elevated, elevating; `luxury` → luxuries; `oasis` → oases. */
function inflections(word: string): string {
  if (word.endsWith('e')) return `${word.slice(0, -1)}(?:e|es|ed|ing)`
  if (word.endsWith('y')) return `${word.slice(0, -1)}(?:y|ys|ies)`
  if (word.endsWith('is')) return `${word.slice(0, -2)}(?:is|es)`
  return `${word}(?:s|es)?`
}

const forbiddenPattern = (word: string): RegExp =>
  new RegExp(`(?<![\\p{L}-])${inflections(word)}(?![\\p{L}-])`, 'iu')

const FORBIDDEN = FORBIDDEN_WORDS.map((word) => ({ word, pattern: forbiddenPattern(word) }))

/** The rules `text` breaks, as short labels; empty when it reads in the house voice. */
export function voiceProblems(text: string): readonly string[] {
  if (text.length === 0 || text !== text.trim()) return ['empty or untrimmed']
  const body = text.startsWith(PLACEHOLDER_PREFIX) ? text.slice(PLACEHOLDER_PREFIX.length) : text
  return [
    ...(DASH.test(body) ? ['en or em dash'] : []),
    ...(EXCLAMATION.test(body) ? ['exclamation mark'] : []),
    ...FORBIDDEN.filter(({ pattern }) => pattern.test(body)).map(
      ({ word }) => `forbidden word “${word}”`
    ),
  ]
}
