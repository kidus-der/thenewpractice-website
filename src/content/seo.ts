/**
 * SEARCH METADATA — docs/09-performance-accessibility.md §Search and AI visibility.
 *
 * Titles and descriptions are ours, written in the brand voice (docs/01 §Voice;
 * CONTENT-GAPS G7): short declaratives, British spelling, none of the
 * forbidden words, no claims the client's copy does not make. Where a sentence
 * of the client's own copy says it better, that sentence is used verbatim.
 *
 * The ™ never appears in metadata: the ledger's rule is once per page at most,
 * in the hero wordmark and the footer lockup, never in running text. A <title>
 * or og:site_name is running text as far as a search result is concerned.
 *
 * Templates call `buildMetadata(ROUTE_SEO.about, …)` (src/lib/seo.ts) for the
 * static routes and the three builders below for collection items.
 */
import { BRAND } from './brand'
import { HOME } from './pages/home'
import { type RouteKey } from './nav'
import type { Assessment, Service, TeamMember } from './schemas'

/** Google truncates around 155–160 characters; we stop at 155. */
export const DESCRIPTION_MAX = 155

export type OpenGraphType = 'website' | 'profile' | 'article'

export type RouteSeo = {
  /** The page's short name, used in llms.txt and breadcrumbs. */
  name: string
  /** The full document title. */
  title: string
  description: string
  /** The line set in bone at the foot of the Open Graph card; null renders the plain lockup. */
  ogTitle: string | null
  type: OpenGraphType
}

const TITLE_SEPARATOR = ' — '

/** `"<Page> — The New Practice"`. */
export const pageTitle = (name: string): string => `${name}${TITLE_SEPARATOR}${BRAND.name}`

// ---------------------------------------------------------------------------
// Sentence handling — pure, shared with src/lib/seo.ts
// ---------------------------------------------------------------------------

const ABBREVIATIONS = new Set(['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'St'])
const SENTENCE_BOUNDARY = /(?<=[.!?…])\s+(?=[A-Z“"(])/
const TRAILING_PUNCTUATION = /[.!?…]$/
const ELLIPSIS = '…'

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

/** Cuts at the last word boundary that keeps room for an ellipsis. */
const cutAtWord = (text: string, max: number): string => {
  const room = text.slice(0, max - ELLIPSIS.length)
  const lastSpace = room.lastIndexOf(' ')
  const kept = lastSpace > 0 ? room.slice(0, lastSpace) : room
  return `${kept.replace(/[,;:]$/, '')}${ELLIPSIS}`
}

/**
 * The leading sentences of `text` that fit within `max` characters. When even
 * the first sentence is too long it is cut at a word boundary with an ellipsis.
 */
export function excerpt(text: string, max: number = DESCRIPTION_MAX): string {
  const parts = sentences(text)
  const kept = parts.reduce<string>((acc, sentence) => {
    const candidate = acc ? `${acc} ${sentence}` : sentence
    return candidate.length <= max ? candidate : acc
  }, '')
  if (kept) return kept
  const first = parts[0] ?? ''
  return first.length <= max ? first : cutAtWord(first, max)
}

// ---------------------------------------------------------------------------
// Site defaults
// ---------------------------------------------------------------------------

/** The client's own opening statement, verbatim: the practice, the place, the model. */
const statement = HOME.sections.find((s) => s.id === 'private-treatment-without-compromise')
const [statementOpening, statementModel] = statement?.paragraphs ?? []
if (!statementOpening || !statementModel) {
  throw new Error('pages/home.ts: the opening statement no longer has its first two paragraphs')
}

export const SEO_DEFAULTS = {
  siteName: BRAND.name,
  title: `${BRAND.name}${TITLE_SEPARATOR}${BRAND.tagline}`,
  description: `${excerpt(statementOpening, DESCRIPTION_MAX)} ${statementModel}`,
  /** The copy is British English; Open Graph wants a territory. */
  locale: 'en_GB',
  language: 'en',
  ogImageAlt: `${BRAND.nameUpper}${TITLE_SEPARATOR}${BRAND.tagline}`,
} as const

/**
 * Structured form of BRAND.locale for schema.org PostalAddress. A postal
 * address cannot be parsed safely out of the display string, so the three
 * parts are spelled here and a test asserts they still appear in it.
 */
export const ADDRESS = {
  locality: 'Puerto Aventuras',
  region: 'Quintana Roo',
  country: 'MX',
} as const

// ---------------------------------------------------------------------------
// Static routes
// ---------------------------------------------------------------------------

const route = (
  name: string,
  description: string,
  overrides: Partial<Pick<RouteSeo, 'title' | 'ogTitle' | 'type'>> = {}
): RouteSeo => ({
  name,
  title: pageTitle(name),
  description,
  ogTitle: name,
  type: 'website',
  ...overrides,
})

const founderLine = `${BRAND.founder.name}, ${BRAND.founder.role.replace('&', 'and')}`

export const ROUTE_SEO: Readonly<Record<RouteKey, RouteSeo>> = {
  home: route('Home', SEO_DEFAULTS.description, { title: SEO_DEFAULTS.title, ogTitle: null }),
  about: route(
    'About',
    'How The New Practice began, from The Kusnacht Practice in 2007 to Puerto Aventuras today. The founder’s message, the ceiba mark and our principles.'
  ),
  process: route(
    'Our Process',
    'From the first telephone call to after care: assessment, a programme designed for one person, a live-in Lead Clinician, and the return home.'
  ),
  personalMessage: route(
    'A Personal Message',
    `A personal message from ${founderLine} of The New Practice, for anyone considering treatment.`
  ),
  fees: route(
    'Fees',
    'The all-inclusive weekly fee for treatment in Puerto Aventuras, and how the cost of treatment at home or elsewhere in the world is set.'
  ),
  residences: route(
    'Residences',
    'A private clinical residence in Puerto Aventuras, on the Riviera Maya, where treatment and everyday life exist together.'
  ),
  clinicalServices: route(
    'Clinical Services',
    'Eleven clinical services, from addiction and trauma to eating disorders, executive burnout, somatic therapies, recovery management and the family program.'
  ),
  team: route(
    'Team',
    `The clinical and operations team at The New Practice, led by ${founderLine}. One client. One team.`
  ),
  selfAssessment: route(
    'Self-Assessment',
    'Ten confidential self-assessments, from alcohol and drugs to work, technology, codependency and family history. Nothing you enter is stored.'
  ),
  contact: route(
    'Contact',
    `Begin the conversation. Every enquiry is handled personally, in complete confidence, by ${founderLine}.`
  ),
  privacy: route(
    'Privacy',
    'How The New Practice handles the personal information of visitors and enquirers.'
  ),
  terms: route('Terms', 'The terms on which The New Practice website is provided.'),
}

// ---------------------------------------------------------------------------
// Collection items — derived from the client's copy
// ---------------------------------------------------------------------------

/** A service page: the first sentence or two of the client's introduction. */
export const serviceSeo = (service: Service): RouteSeo =>
  route(service.title, excerpt(service.intro[0] ?? service.title), { type: 'article' })

/** A profile page: the biography's opening, or name and role when it runs long. */
export function teamSeo(member: TeamMember): RouteSeo {
  const opening = member.paragraphs[0] ?? ''
  const [firstSentence = ''] = sentences(opening)
  const description =
    firstSentence.length <= DESCRIPTION_MAX
      ? excerpt(opening)
      : `${member.name}, ${member.role} at ${BRAND.name}.`
  return route(member.name, description, { type: 'profile' })
}

/** A questionnaire page. The scorer keeps nothing (ledger, owner decisions). */
export const assessmentSeo = (assessment: Assessment): RouteSeo =>
  route(
    assessment.title,
    `${assessment.title}. Fifteen yes-or-no questions, scored here in confidence. Nothing you enter is stored.`
  )
