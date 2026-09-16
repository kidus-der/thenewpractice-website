/**
 * SEARCH METADATA — docs/09-performance-accessibility.md §Search and AI visibility.
 *
 * Titles are the page names. Every description is a sentence of the client's
 * own document, verbatim (docs/CONTENT-PROVENANCE-AUDIT.md A9–A20; the line
 * cited beside each), or is prefixed `PLACEHOLDER — ` where the page itself is
 * a stub. content.checks.ts holds the guard: a description that is neither is
 * a failing build. Nothing here states a fact the document does not.
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

/** Marks the three routes whose copy the client has not yet supplied (G1, G3). */
const PLACEHOLDER = 'PLACEHOLDER — '

export const ROUTE_SEO: Readonly<Record<RouteKey, RouteSeo>> = {
  home: route('Home', SEO_DEFAULTS.description, { title: SEO_DEFAULTS.title, ogTitle: null }),
  // l.126 — the About page's own header.
  about: route('About', 'A New Standard in Private Behavioural Healthcare'),
  // l.254 — the first line of Our Process.
  process: route(
    'Our Process',
    'For many people, making the first telephone call is the most difficult step in building a new life.'
  ),
  // l.1269 — from the founder's letter.
  personalMessage: route(
    'A Personal Message',
    'Sometimes a single conversation can change the direction of a life.'
  ),
  // l.1285, second sentence — the Cost section.
  fees: route(
    'Fees',
    'Costs for treatment in your home or another clinical residence in the world will be provided on a case-by-case basis.'
  ),
  // PLACEHOLDER page (G1); the sentence is l.291.
  residences: route(
    'Residences',
    `${PLACEHOLDER}On arrival, you will be welcomed into your private residence in Puerto Aventuras.`
  ),
  // l.404 — the Clinical Services subtitle.
  clinicalServices: route(
    'Clinical Services',
    'Individualized Treatment for Complex Human Problems'
  ),
  // l.723 — the first line of Our Team.
  team: route(
    'Team',
    'The quality of any treatment program is ultimately determined by the quality of the people delivering it.'
  ),
  // l.954 — the Self-Assessment subtitle.
  selfAssessment: route(
    'Self-Assessment',
    'Understanding Yourself Is the First Step Toward Recovery'
  ),
  // l.1206, first sentence — the Contact page.
  contact: route(
    'Contact',
    'At The New Practice, every enquiry is handled personally, professionally, and with complete confidentiality.'
  ),
  // PLACEHOLDER pages (G3): no policy or terms exist yet.
  privacy: route(
    'Privacy',
    `${PLACEHOLDER}How The New Practice handles the personal information of visitors and enquirers.`
  ),
  terms: route('Terms', `${PLACEHOLDER}The terms on which The New Practice website is provided.`),
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

/** The document's own scoring line, l.1020, verbatim; it follows every questionnaire. */
const SCORING_LINE = 'Scoring: Give yourself 1 point for each “yes” answer. Total score: 0–15.'

/** A questionnaire page: its title, then the client's scoring line. */
export const assessmentSeo = (assessment: Assessment): RouteSeo =>
  route(assessment.title, `${assessment.title}. ${SCORING_LINE}`)
