/**
 * THE CURATION LAYER — docs/06-copy-deck.md §Curation.
 *
 * The generated modules keep the client's full text; this decides what
 * renders. A curation names the client's paragraphs, list items, sections and
 * sentences by id and index, and adds our own strings through `ours()`. The
 * result has the same shape as its source (a `Page` stays a `Page`, a
 * `Section` a `Section`), so the templates render it unchanged.
 *
 * Nothing here throws. A reference to client text that is not there is left
 * out of the value and recorded in `problems`; every `ours()` string is
 * recorded in `ours`. content.checks.ts reads both from `CURATIONS`
 * (curated/index.ts): a broken reference or an `ours()` string that breaks
 * the house voice (curated/voice.ts) fails `npm test` and `npm run verify`.
 *
 * Pure and dependency-free (no Zod), so a curated module is safe to import
 * from a client component.
 */
import type { Definition, Page, Section } from '../schemas'
import { sentences } from '../sentences'

// ---------------------------------------------------------------------------
// Picks
// ---------------------------------------------------------------------------

/** A string we wrote. Checked against the house voice; never a clinical claim. */
export type Ours = { readonly kind: 'ours'; readonly text: string }

/** Some sentences of the client string at `at`, in the order given, joined by a space. */
export type SentencePick = {
  readonly kind: 'sentences'
  readonly at: number
  readonly which: readonly number[]
}

/** One entry of an array field: a client string by index, some of its sentences, or ours. */
export type ItemPick = number | SentencePick | Ours

/** A single field: keep the client's, drop it (`null`), some of its sentences (`only`), or ours. */
export type TextPick = 'keep' | null | SentencePick | Ours

/** Every item of an array field, in the client's order. */
export const ALL = 'all'
export type ItemPicks = readonly ItemPick[] | typeof ALL

export type DefinitionPick =
  number | { readonly at: number; readonly term?: TextPick; readonly description?: TextPick }

export const ours = (text: string): Ours => ({ kind: 'ours', text })

export const sentencesOf = (at: number, which: readonly number[]): SentencePick => ({
  kind: 'sentences',
  at,
  which,
})

/** Sentences of a single-string field (a lead, a title, a definition's description). */
export const only = (which: readonly number[]): SentencePick => sentencesOf(0, which)

/**
 * Which parts of a client section render. `id` names the source section.
 * Single fields (title, subtitle, header, signature) are kept when omitted;
 * array fields (paragraphs, list, outro, definitions, subsections) are
 * dropped when omitted. `listHeading` follows the list unless set.
 */
export type SectionSpec = {
  readonly id: string
  readonly title?: TextPick
  readonly subtitle?: TextPick
  readonly header?: TextPick
  readonly paragraphs?: ItemPicks
  readonly listHeading?: TextPick
  readonly list?: ItemPicks
  readonly outro?: ItemPicks
  readonly definitions?: readonly DefinitionPick[] | typeof ALL
  readonly signature?: 'keep' | null
  readonly subsections?: readonly SectionSpec[]
}

/** The page's own fields are kept when omitted; `sections` lists what renders, in render order. */
export type PageSpec = {
  readonly title?: TextPick
  readonly eyebrow?: TextPick
  readonly lead?: TextPick
  readonly sections: readonly SectionSpec[]
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type OursString = { readonly where: string; readonly text: string }

export type Curation<V> = {
  readonly name: string
  readonly value: V
  /** Every `ours()` string, where it sits. */
  readonly ours: readonly OursString[]
  /** Every reference to client text that did not resolve. Empty in a good curation. */
  readonly problems: readonly string[]
}

export type Curator = {
  /** An array field: the picks resolved against `source`. */
  texts: (source: readonly string[] | undefined, picks: ItemPicks, where: string) => string[]
  /** A single field; `undefined` when dropped or unresolved. */
  text: (source: string | undefined, pick: TextPick, where: string) => string | undefined
  section: (source: Section, spec: SectionSpec, where: string) => Section
  sections: (source: readonly Section[], specs: readonly SectionSpec[], where: string) => Section[]
  page: <P extends Page>(source: P, spec: PageSpec) => P
}

// ---------------------------------------------------------------------------
// The curator
// ---------------------------------------------------------------------------

type Log = { ours: OursString[]; problems: string[] }

/** Only the fields that have a value, so an omitted field is absent rather than `undefined`. */
const defined = <T extends object>(fields: T): T =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as T

const nonEmpty = <T>(items: readonly T[]): readonly T[] | undefined =>
  items.length > 0 ? items : undefined

function pickSentences(source: string, pick: SentencePick, where: string, log: Log) {
  const parts = sentences(source)
  if (pick.which.length === 0) {
    log.problems.push(`${where}: a sentence pick names no sentences`)
    return undefined
  }
  const missing = pick.which.filter((i) => parts[i] === undefined)
  if (missing.length > 0) {
    log.problems.push(
      `${where}: no sentence ${missing.join(', ')} (the client text has ${parts.length})`
    )
    return undefined
  }
  return pick.which.map((i) => parts[i]).join(' ')
}

function resolveItem(source: readonly string[], pick: ItemPick, where: string, log: Log) {
  if (typeof pick === 'object' && pick.kind === 'ours') {
    log.ours.push({ where, text: pick.text })
    return pick.text
  }
  const at = typeof pick === 'number' ? pick : pick.at
  const client = source[at]
  if (client === undefined) {
    log.problems.push(`${where}: no client text at index ${at} (the source has ${source.length})`)
    return undefined
  }
  return typeof pick === 'number' ? client : pickSentences(client, pick, `${where}[${at}]`, log)
}

function duplicateIndexes(picks: readonly ItemPick[]): readonly number[] {
  const indexes = picks.filter((p): p is number => typeof p === 'number')
  return indexes.filter((n, i) => indexes.indexOf(n) !== i)
}

function makeTexts(log: Log): Curator['texts'] {
  return (source, picks, where) => {
    const items = source ?? []
    if (picks === ALL) {
      if (source === undefined) log.problems.push(`${where}: nothing to keep`)
      return [...items]
    }
    const dupes = duplicateIndexes(picks)
    if (dupes.length > 0) log.problems.push(`${where}: index ${dupes.join(', ')} picked twice`)
    return picks.flatMap((pick, i) => resolveItem(items, pick, `${where}[${i}]`, log) ?? [])
  }
}

function makeText(log: Log): Curator['text'] {
  return (source, pick, where) => {
    if (pick === null) return undefined
    if (pick === 'keep') {
      if (source === undefined) log.problems.push(`${where}: nothing to keep`)
      return source
    }
    if (pick.kind === 'ours') return resolveItem([], pick, where, log)
    if (source === undefined) {
      log.problems.push(`${where}: no client text to take sentences from`)
      return undefined
    }
    if (pick.at !== 0)
      log.problems.push(`${where}: a single field takes only(), not index ${pick.at}`)
    return pick.at === 0 ? pickSentences(source, pick, where, log) : undefined
  }
}

/** A single field whose omission means "keep the client's, if there is one". */
const keepByDefault = (
  text: Curator['text'],
  source: string | undefined,
  pick: TextPick | undefined,
  where: string
): string | undefined => (pick === undefined ? source : text(source, pick, where))

function pickDefinitions(
  curator: Pick<Curator, 'text'>,
  source: readonly Definition[] | undefined,
  picks: readonly DefinitionPick[] | typeof ALL,
  where: string,
  log: Log
): Definition[] {
  const items = source ?? []
  if (picks === ALL) {
    if (source === undefined) log.problems.push(`${where}: nothing to keep`)
    return [...items]
  }
  return picks.flatMap((pick, i) => {
    const at = typeof pick === 'number' ? pick : pick.at
    const client = items[at]
    if (client === undefined) {
      log.problems.push(`${where}[${i}]: no client definition at index ${at}`)
      return []
    }
    if (typeof pick === 'number') return [client]
    const term = keepByDefault(curator.text, client.term, pick.term, `${where}[${at}].term`)
    const description = keepByDefault(
      curator.text,
      client.description,
      pick.description,
      `${where}[${at}].description`
    )
    return term && description ? [{ term, description }] : []
  })
}

function makeSection(log: Log, texts: Curator['texts'], text: Curator['text']) {
  const curator = { text }
  const section = (source: Section, spec: SectionSpec, where: string): Section => {
    const at = (field: string) => `${where}.${field}`
    const arr = (field: 'paragraphs' | 'list' | 'outro', from: readonly string[] | undefined) =>
      spec[field] === undefined ? [] : texts(from, spec[field], at(field))
    const paragraphs = arr('paragraphs', source.paragraphs)
    const list = arr('list', source.list)
    const listHeading =
      spec.listHeading === undefined
        ? list.length > 0
          ? source.listHeading
          : undefined
        : text(source.listHeading, spec.listHeading, at('listHeading'))
    return defined({
      id: source.id,
      title: keepByDefault(text, source.title, spec.title, at('title')),
      subtitle: keepByDefault(text, source.subtitle, spec.subtitle, at('subtitle')),
      header: keepByDefault(text, source.header, spec.header, at('header')),
      paragraphs,
      listHeading,
      list: nonEmpty(list),
      outro: nonEmpty(arr('outro', source.outro)),
      definitions: nonEmpty(
        spec.definitions === undefined
          ? []
          : pickDefinitions(curator, source.definitions, spec.definitions, at('definitions'), log)
      ),
      signature: spec.signature === null ? undefined : source.signature,
      subsections: nonEmpty(
        spec.subsections === undefined
          ? []
          : sections(source.subsections ?? [], spec.subsections, at('subsections'))
      ),
    } as Section)
  }
  const sections = (
    source: readonly Section[],
    specs: readonly SectionSpec[],
    where: string
  ): Section[] =>
    specs.flatMap((spec) => {
      const found = source.find((s) => s.id === spec.id)
      if (found === undefined) {
        log.problems.push(`${where}: no client section “${spec.id}”`)
        return []
      }
      return [section(found, spec, `${where}.${spec.id}`)]
    })
  return { section, sections }
}

function makeCurator(log: Log): Curator {
  const texts = makeTexts(log)
  const text = makeText(log)
  const { section, sections } = makeSection(log, texts, text)
  const page = <P extends Page>(source: P, spec: PageSpec): P => {
    const title = keepByDefault(text, source.title, spec.title, 'title') ?? source.title
    return defined({
      ...source,
      title,
      eyebrow: keepByDefault(text, source.eyebrow, spec.eyebrow, 'eyebrow'),
      lead: keepByDefault(text, source.lead, spec.lead, 'lead'),
      sections: sections(source.sections, spec.sections, 'sections'),
    })
  }
  return { texts, text, section, sections, page }
}

/**
 * Runs `build` with a curator and returns what it built, every `ours()`
 * string it used and every reference that did not resolve. `name` is how the
 * checks report it: use the module and export, e.g. `about`.
 */
export function curate<V>(name: string, build: (c: Curator) => V): Curation<V> {
  const log: Log = { ours: [], problems: [] }
  const value = build(makeCurator(log))
  return {
    name,
    value,
    ours: log.ours.map((o) => ({ ...o, where: `${name}.${o.where}` })),
    problems: log.problems.map((p) => `${name}.${p}`),
  }
}

/** The common case: one client page, curated section by section. */
export const curatePage = <P extends Page>(name: string, source: P, spec: PageSpec): Curation<P> =>
  curate(name, (c) => c.page(source, spec))

/** True for a value `curate()` returned; the registry test uses it to find curations. */
export function isCuration(value: unknown): value is Curation<unknown> {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as Partial<Curation<unknown>>
  return (
    typeof candidate.name === 'string' &&
    'value' in candidate &&
    Array.isArray(candidate.ours) &&
    Array.isArray(candidate.problems)
  )
}
