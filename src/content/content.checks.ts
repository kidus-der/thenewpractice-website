/**
 * CONTENT CHECKS — shared by content.test.ts (Vitest) and scripts/check-content.ts
 * (plain Node).
 *
 * Each check is a pure function of the content layer returning a verdict; the
 * two runners only differ in how they report it. Since Task 20 this is the
 * only place the content is parsed against its Zod schemas: the modules
 * export plain objects annotated with the inferred types, so a bad edit
 * fails `tsc` for shape and this check for the string rules (trim, residue,
 * lengths, counts) rather than throwing at import time in a browser.
 */
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
} from './index'
import {
  QUESTIONS_PER_ASSESSMENT,
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
} from './schemas'

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
  ]
}
