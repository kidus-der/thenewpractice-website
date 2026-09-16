/**
 * CONTENT CHECKS — shared by content.test.ts (Vitest) and scripts/check-content.ts
 * (plain Node, until Task 4 installs Vitest).
 *
 * Each check is a pure function of the content layer returning a verdict; the
 * two runners only differ in how they report it.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  ABOUT,
  ASSESSMENTS,
  ASSESSMENTS_PAGE,
  ASSESSMENT_SERIES,
  CONTACT,
  FEES,
  HOME,
  NAV,
  PERSONAL_MESSAGE,
  PRIVACY,
  PROCESS,
  RESIDENCES,
  SERVICES,
  SERVICES_PAGE,
  TEAM,
  TEAM_PAGE,
  TERMS,
  allRoutes,
  assessmentSchema,
  assessmentSeriesSchema,
  contactPageSchema,
  homePageSchema,
  letterPageSchema,
  navSchema,
  pageSchema,
  residencesPageSchema,
  serviceSchema,
  teamMemberSchema,
} from './index'
import { QUESTIONS_PER_ASSESSMENT } from './schemas'
import { ROUTE_SEO, assessmentSeo, sentences, serviceSeo } from './seo'

export type Check = { name: string; ok: boolean; detail: string }

export const EXPECTED_SERVICE_SLUGS = [
  'addiction-treatment',
  'trauma-and-complex-trauma',
  'mental-health',
  'eating-disorders',
  'executive-health-and-burnout',
  'biochemical-restoration',
  'somatic-therapies-and-nervous-system-regulation',
  'inner-child-work',
  'recovery-management-and-after-care',
  'interventions-and-crisis-response',
  'family-program',
] as const

export const EXPECTED_TEAM_SLUGS = [
  'lowell-monkhouse',
  'nathaniel-bruce',
  'elena-vasquez-whitfield',
  'justin-nolan',
  'iona-hames',
  'richard-warren',
  'patricia-heyland',
  'caroline-adams',
  'katia-rhainds',
  'nicolas-neduchal',
  'fernando-escobosa-garcia',
] as const

const EXPECTED_ASSESSMENTS = 10

/** Module name → value, for the string walkers. */
const MODULES: Record<string, unknown> = {
  home: HOME,
  about: ABOUT,
  process: PROCESS,
  'personal-message': PERSONAL_MESSAGE,
  fees: FEES,
  contact: CONTACT,
  residences: RESIDENCES,
  legal: { privacy: PRIVACY, terms: TERMS },
  services: SERVICES,
  'services-page': SERVICES_PAGE,
  team: TEAM,
  'team-page': TEAM_PAGE,
  assessments: ASSESSMENTS,
  'assessments-page': ASSESSMENTS_PAGE,
  'assessment-series': ASSESSMENT_SERIES,
  nav: NAV,
}

/** Paths (module + dotted key path) where a PLACEHOLDER string is permitted. */
const PLACEHOLDER_ALLOWED = [/^residences(\.|$)/, /^contact\.contact\.website$/, /^legal(\.|$)/]

const FORBIDDEN_RESIDUE = [
  { label: 'asterisk', pattern: /\*/ },
  { label: 'backslash escape', pattern: /\\/ },
  { label: 'tab', pattern: /\t/ },
  {
    label: 'invisible character',
    pattern: new RegExp(`[${String.fromCodePoint(0x200b, 0x2060, 0xfeff, 0xa0)}]`),
  },
]

type StringVisit = { path: string; value: string }

function walkStrings(value: unknown, path: string): readonly StringVisit[] {
  if (typeof value === 'string') return [{ path, value }]
  if (Array.isArray(value)) return value.flatMap((item, i) => walkStrings(item, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => walkStrings(item, `${path}.${key}`))
  }
  return []
}

function allStrings(): readonly StringVisit[] {
  return Object.entries(MODULES).flatMap(([name, value]) => walkStrings(value, name))
}

function check(name: string, problems: readonly string[]): Check {
  return { name, ok: problems.length === 0, detail: problems.join('\n') }
}

function parses(): Check {
  const results = [
    ['home', homePageSchema.safeParse(HOME)],
    ['about', pageSchema.safeParse(ABOUT)],
    ['process', pageSchema.safeParse(PROCESS)],
    ['personal-message', letterPageSchema.safeParse(PERSONAL_MESSAGE)],
    ['fees', pageSchema.safeParse(FEES)],
    ['contact', contactPageSchema.safeParse(CONTACT)],
    ['residences', residencesPageSchema.safeParse(RESIDENCES)],
    ['privacy', pageSchema.safeParse(PRIVACY)],
    ['terms', pageSchema.safeParse(TERMS)],
    ['services-page', pageSchema.safeParse(SERVICES_PAGE)],
    ['team-page', pageSchema.safeParse(TEAM_PAGE)],
    ['assessments-page', pageSchema.safeParse(ASSESSMENTS_PAGE)],
    ['assessment-series', assessmentSeriesSchema.safeParse(ASSESSMENT_SERIES)],
    ['nav', navSchema.safeParse(NAV)],
    ...SERVICES.map((s) => [`service ${s.slug}`, serviceSchema.safeParse(s)] as const),
    ...TEAM.map((m) => [`team ${m.slug}`, teamMemberSchema.safeParse(m)] as const),
    ...ASSESSMENTS.map((a) => [`assessment ${a.slug}`, assessmentSchema.safeParse(a)] as const),
  ] as const
  return check(
    'every module parses against its schema',
    results.filter(([, r]) => !r.success).map(([name, r]) => `${name}: ${r.error?.message}`)
  )
}

function sameOrder(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): string[] {
  if (actual.length !== expected.length) return [`${label}: ${actual.length} ≠ ${expected.length}`]
  return actual.flatMap((slug, i) =>
    slug === expected[i] ? [] : [`${label}[${i}]: ${slug} ≠ ${expected[i]}`]
  )
}

function servicesCount(): Check {
  return check(
    `${EXPECTED_SERVICE_SLUGS.length} services in document order`,
    sameOrder(
      SERVICES.map((s) => s.slug),
      EXPECTED_SERVICE_SLUGS,
      'services'
    )
  )
}

function teamCount(): Check {
  const orderProblems = TEAM.flatMap((m, i) =>
    m.order === i + 1 ? [] : [`${m.slug}.order = ${m.order}`]
  )
  return check(`${EXPECTED_TEAM_SLUGS.length} team members in document order`, [
    ...sameOrder(
      TEAM.map((m) => m.slug),
      EXPECTED_TEAM_SLUGS,
      'team'
    ),
    ...orderProblems,
  ])
}

function assessmentsCount(): Check {
  const problems = [
    ...(ASSESSMENTS.length === EXPECTED_ASSESSMENTS ? [] : [`assessments: ${ASSESSMENTS.length}`]),
    ...ASSESSMENTS.flatMap((a) =>
      a.questions.length === QUESTIONS_PER_ASSESSMENT
        ? []
        : [`${a.slug}: ${a.questions.length} questions`]
    ),
  ]
  return check(
    `${EXPECTED_ASSESSMENTS} assessments × ${QUESTIONS_PER_ASSESSMENT} questions`,
    problems
  )
}

function noMarkdownResidue(): Check {
  const problems = allStrings().flatMap(({ path, value }) =>
    FORBIDDEN_RESIDUE.filter((r) => r.pattern.test(value)).map((r) => `${path}: ${r.label}`)
  )
  return check('no string carries markdown residue', problems)
}

function noStrayWhitespace(): Check {
  const problems = allStrings()
    .filter(({ value }) => value !== value.trim() || value.length === 0)
    .map(({ path }) => `${path}: leading/trailing whitespace or empty`)
  return check('no string starts or ends with whitespace', problems)
}

function navResolves(): Check {
  const known = new Set(allRoutes())
  const hrefs = [...NAV.primary, ...NAV.utility, ...NAV.footer.flatMap((g) => g.items)].map(
    (i) => i.href
  )
  return check(
    'every nav href resolves to a route',
    hrefs.filter((h) => !known.has(h)).map((h) => `unknown href ${h}`)
  )
}

function placeholdersConfined(): Check {
  const problems = allStrings()
    .filter(({ value }) => value.includes('PLACEHOLDER'))
    .filter(({ path }) => !PLACEHOLDER_ALLOWED.some((rule) => rule.test(path)))
    .map(({ path }) => `${path}: PLACEHOLDER outside residences / contact.website / legal`)
  return check('PLACEHOLDER copy only where content is known to be missing', problems)
}

function residencesMarked(): Check {
  const unmarked = walkStrings(RESIDENCES, 'residences')
    .filter(({ path }) => !/\.(slug|id|index)$/.test(path))
    .filter(({ value }) => !value.startsWith('PLACEHOLDER'))
    .map(({ path }) => path)
  return check('every residences string is prefixed PLACEHOLDER', unmarked)
}

/** The legal stubs, like residences, are ours until counsel writes them. */
function legalMarked(): Check {
  const unmarked = walkStrings({ privacy: PRIVACY, terms: TERMS }, 'legal')
    .filter(({ path }) => !/\.(slug|id)$/.test(path))
    .filter(({ value }) => !value.startsWith('PLACEHOLDER'))
    .map(({ path }) => path)
  return check('every legal string is prefixed PLACEHOLDER', unmarked)
}

// ---------------------------------------------------------------------------
// Provenance — every metadata description is the client's sentence
// ---------------------------------------------------------------------------

/** The client's document, at the repository root (the runners start there). */
const SOURCE_DOCUMENT = 'Final Website Instructions_DRAFT Sept 1 2026 .docx.md'
const PLACEHOLDER_PREFIX = 'PLACEHOLDER — '
const MARKDOWN_MARKS = /[*_#>`\\]/g
const SINGLE_QUOTES = /[‘’‚‛′]/g
const DOUBLE_QUOTES = /[“”„‟″]/g
const DASHES = /[‐‑‒–—―−]/g
const TRAILING_PUNCTUATION = /[.!?…]+$/

/** As docs/CONTENT-PROVENANCE-AUDIT.md normalised: no markdown, one space, one quote, one dash. */
export function normaliseProse(text: string): string {
  return text
    .replace(MARKDOWN_MARKS, '')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const readSourceDocument = (): string | undefined => {
  try {
    return normaliseProse(readFileSync(join(process.cwd(), SOURCE_DOCUMENT), 'utf8'))
  } catch {
    return undefined
  }
}

/** The sentences of a description, each without its final stop or ellipsis. */
const descriptionSentences = (description: string): readonly string[] =>
  sentences(description).map((s) => normaliseProse(s).replace(TRAILING_PUNCTUATION, ''))

/** Every sentence of `description` occurs in the document, or the whole is a marked placeholder. */
function sourcedFrom(document: string, description: string): boolean {
  if (description.startsWith(PLACEHOLDER_PREFIX)) return true
  return descriptionSentences(description).every((sentence) => document.includes(sentence))
}

/**
 * The static routes, the questionnaires and the services: each description
 * is a sentence of the document or a marked placeholder. teamSeo() is not
 * checked: its fallback frame, `<Name>, <Role> at The New Practice.`, sets the
 * client's name and role in our sentence (audit, D7), which the owner accepted.
 */
function descriptionsSourced(): Check {
  const document = readSourceDocument()
  if (document === undefined) {
    return check('every metadata description is a sentence of the client’s document', [
      `${SOURCE_DOCUMENT} not found in ${process.cwd()}`,
    ])
  }
  const candidates = [
    ...Object.entries(ROUTE_SEO).map(([key, seo]) => [`seo.${key}`, seo.description] as const),
    ...ASSESSMENTS.map((a) => [`assessment ${a.slug}`, assessmentSeo(a).description] as const),
    ...SERVICES.map((s) => [`service ${s.slug}`, serviceSeo(s).description] as const),
  ]
  return check(
    'every metadata description is a sentence of the client’s document',
    candidates
      .filter(([, description]) => !sourcedFrom(document, description))
      .map(([name, description]) => `${name}: “${description}” is not in the document`)
  )
}

function routesUnique(): Check {
  const routesList = allRoutes()
  const dupes = routesList.filter((r, i) => routesList.indexOf(r) !== i)
  return check('allRoutes() has no duplicates', dupes)
}

export function contentChecks(): readonly Check[] {
  return [
    parses(),
    servicesCount(),
    teamCount(),
    assessmentsCount(),
    noMarkdownResidue(),
    noStrayWhitespace(),
    navResolves(),
    placeholdersConfined(),
    residencesMarked(),
    legalMarked(),
    routesUnique(),
    descriptionsSourced(),
  ]
}
