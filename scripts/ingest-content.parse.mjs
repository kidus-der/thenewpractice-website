/**
 * Line-level parsing of the client document: normalisation, markdown
 * stripping, tokenisation and the paragraph rules. No knowledge of pages.
 */
import { JOIN_MIN_LENGTH, TERM_MAX_LENGTH } from './ingest-content.config.mjs'

/** Sentence-final characters; a line ending in one of these never joins the next. */
const TERMINAL = /[.?!…:”’)]$/
const INVISIBLE = new RegExp(`[${String.fromCodePoint(0x200b, 0x2060, 0xfeff)}]`, 'g')
const NBSP = new RegExp(String.fromCodePoint(0xa0), 'g')
const COMBINING_MARKS = new RegExp(
  `[${String.fromCodePoint(0x300)}-${String.fromCodePoint(0x36f)}]`,
  'g'
)
const STRUCTURAL = new Set(['blank', 'hr', 'marker', 'section', 'subtitle'])

/** Word-processor residue: CR, zero-width characters, non-breaking spaces, trailing spaces. */
export function normaliseLine(raw) {
  return raw.replace(/\r$/, '').replace(INVISIBLE, '').replace(NBSP, ' ').replace(/\s+$/, '')
}

/**
 * Strip markdown, keep content. Emphasis runs and the one escaped asterisk
 * pair (a bracketing note) go; pandoc escapes (`\-`, `\.`, `\+`, `\_`) are
 * unescaped; links reduce to their text; internal whitespace collapses.
 */
export function clean(raw) {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\\\*/g, '')
    .replace(/\*/g, '')
    .replace(/\\([-.+_])/g, '$1')
    .replace(/[\t ]+/g, ' ')
    .trim()
}

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function classify(line, n, markers) {
  if (line === '') return { type: 'blank', n }
  if (line === '---') return { type: 'hr', n }
  const text = clean(line)
  if (markers[text]) return { type: 'marker', n, text, page: markers[text] }
  if (/^\* /.test(line)) return { type: 'item', n, text: clean(line.slice(2)) }
  const section = text.match(/^Section (\d+)(?: Title)?:\s*(.+)$/)
  if (section) return { type: 'section', n, number: Number(section[1]), text: section[2] }
  const labelled = text.match(/^(Subtitle|Header|BODY):\s*(.*)$/)
  if (labelled) return { type: labelled[1].toLowerCase(), n, text: labelled[2] }
  return { type: 'text', n, text, raw: line }
}

export function tokenize(source, markers) {
  return source.split('\n').map((raw, i) => classify(normaliseLine(raw), i + 1, markers))
}

/** Split tokens into pages keyed by the marker that opens each. */
export function splitPages(tokens) {
  return tokens.reduce((pages, token) => {
    if (token.type === 'marker') return { ...pages, [token.page]: [] }
    const keys = Object.keys(pages)
    const current = keys.at(-1)
    if (current === undefined) return pages
    return { ...pages, [current]: [...pages[current], token] }
  }, {})
}

/** Split a page into its preamble and numbered sections. */
export function splitSections(tokens) {
  return tokens.reduce(
    (acc, token) => {
      if (token.type === 'section') {
        return {
          ...acc,
          sections: [...acc.sections, { number: token.number, title: token.text, tokens: [] }],
        }
      }
      const last = acc.sections.at(-1)
      if (last === undefined) return { ...acc, preamble: [...acc.preamble, token] }
      const updated = { ...last, tokens: [...last.tokens, token] }
      return { ...acc, sections: [...acc.sections.slice(0, -1), updated] }
    },
    { preamble: [], sections: [] }
  )
}

/** Split a token run at `Subtitle:` lines; `Header:` lines attach to their group. */
export function splitGroups(tokens) {
  const start = [{ subtitle: undefined, header: undefined, tokens: [] }]
  return tokens.reduce((groups, token) => {
    if (token.type === 'subtitle')
      return [...groups, { subtitle: token.text, header: undefined, tokens: [] }]
    const last = groups.at(-1)
    const updated =
      token.type === 'header'
        ? { ...last, header: token.text }
        : { ...last, tokens: [...last.tokens, token] }
    return [...groups.slice(0, -1), updated]
  }, start)
}

function continues(paragraph) {
  return paragraph.length >= JOIN_MIN_LENGTH && /[a-z,;-]$/.test(paragraph)
}

/**
 * Hard-broken lines inside one chunk are one paragraph only when the earlier
 * line is long and stops mid-sentence (a wrapped line); a trailing hyphen
 * joins without a space. Short lines and finished sentences stay separate.
 */
export function linesToParagraphs(lines) {
  return lines.reduce((acc, line) => {
    const last = acc.at(-1)
    if (last === undefined || !continues(last)) return [...acc, line]
    const glue = last.endsWith('-') ? '' : ' '
    return [...acc.slice(0, -1), `${last}${glue}${line}`]
  }, [])
}

export function isTerm(text) {
  return text.length <= TERM_MAX_LENGTH && !TERMINAL.test(text)
}

function isContent(token) {
  return !STRUCTURAL.has(token.type) && token.type !== 'header'
}

/** Consecutive content tokens of one kind (items, or prose lines) between blank lines. */
function splitRuns(tokens) {
  return tokens.reduce((runs, token) => {
    if (!isContent(token)) return runs.at(-1)?.length === 0 ? runs : [...runs, []]
    const last = runs.at(-1)
    const kind = (t) => (t.type === 'item' ? 'list' : 'prose')
    if (last === undefined || last.length === 0) return [...runs.slice(0, -1), [token]]
    if (kind(last[0]) !== kind(token)) return [...runs, [token]]
    return [...runs.slice(0, -1), [...last, token]]
  }, [])
}

/**
 * Ordered blocks: `list`, `definition` (a short title line directly over a
 * sentence, as in the philosophy pillars and the principles) or `paragraphs`.
 */
export function toBlocks(tokens) {
  return splitRuns(tokens)
    .filter((run) => run.length > 0)
    .map((run) => {
      if (run[0].type === 'item') return { type: 'list', items: run.map((t) => t.text) }
      const paragraphs = linesToParagraphs(run.map((t) => t.text))
      const [first, second] = paragraphs
      if (paragraphs.length === 2 && isTerm(first) && TERMINAL.test(second)) {
        return { type: 'definition', term: first, description: second }
      }
      return { type: 'paragraphs', paragraphs }
    })
}

export function lineRange(tokens) {
  const numbers = tokens.map((t) => t.n)
  return { from: Math.min(...numbers), to: Math.max(...numbers) }
}

export function assert(condition, message) {
  if (!condition) throw new Error(`ingest-content: ${message}`)
}
