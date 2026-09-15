import { ASSESSMENTS, BRAND, HOME, SERVICES, TEAM, routes } from '@/content'
import { assessmentHref, serviceHref, teamHref } from '@/content/nav'
import { ROUTE_SEO, excerpt } from '@/content/seo'
import { canonicalUrl, liveSeoContext } from '@/lib/seo'

/**
 * /llms.txt — the practice described for language models, per the llms.txt
 * convention: a title, a summary, then sections of links with one line each.
 *
 * The summary is the client's own home-page copy, sentence for sentence. The
 * page lines are our metadata descriptions (src/content/seo.ts). Nothing here
 * says anything the site does not.
 */
export const dynamic = 'force-static'

const CONTENT_TYPE = 'text/plain; charset=utf-8'
const SUMMARY_SECTION_IDS = [
  'private-treatment-without-compromise',
  'recovery-without-interruption',
]
const STATEMENT_PARAGRAPHS = 3

const link = (name: string, url: string, note?: string): string =>
  note ? `- [${name}](${url}): ${note}` : `- [${name}](${url})`

/** The opening statement (three paragraphs) and the continuity paragraph, verbatim. */
function summary(): string {
  const [statementId, continuityId] = SUMMARY_SECTION_IDS
  const statement = HOME.sections.find((s) => s.id === statementId)?.paragraphs ?? []
  const continuity = HOME.sections.find((s) => s.id === continuityId)?.paragraphs ?? []
  return [...statement.slice(0, STATEMENT_PARAGRAPHS), ...continuity.slice(-1)].join(' ')
}

const section = (heading: string, lines: readonly string[]): string =>
  [`## ${heading}`, ...lines].join('\n')

/** The whole document for a given origin. Exported for tests. */
export function buildLlmsText(siteUrl: string): string {
  const url = (path: string): string => canonicalUrl(siteUrl, path)

  const pages = Object.entries(routes).map(([key, path]) => {
    const seo = ROUTE_SEO[key as keyof typeof routes]
    return link(seo.name, url(path), seo.description)
  })
  const services = SERVICES.map((s) =>
    link(s.title, url(serviceHref(s.slug)), excerpt(s.intro[0] ?? s.title))
  )
  const team = TEAM.map((m) => link(m.name, url(teamHref(m.slug)), m.role))
  const assessments = ASSESSMENTS.map((a) => link(a.title, url(assessmentHref(a.slug))))
  const founder = [BRAND.founder.name, BRAND.founder.credentials].join(', ')
  const contact = [
    `- ${founder}, ${BRAND.founder.role}`,
    `- Telephone: ${BRAND.phone}`,
    `- Email: ${BRAND.email}`,
    `- ${BRAND.locale}`,
  ]

  return [
    `# ${BRAND.name}`,
    '',
    `> ${BRAND.tagline}.`,
    '',
    summary(),
    '',
    section('Pages', pages),
    '',
    section('Clinical services', services),
    '',
    section('Team', team),
    '',
    section('Self-assessments', assessments),
    '',
    section('Contact', contact),
    '',
  ].join('\n')
}

export function GET(): Response {
  return new Response(buildLlmsText(liveSeoContext().siteUrl), {
    headers: { 'content-type': CONTENT_TYPE },
  })
}
