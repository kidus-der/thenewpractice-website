/**
 * Pure helpers for the profile template (docs/05 §T4). Which member a slug
 * names, the three colleagues each profile points to, the neighbours in the
 * rail, the eyebrow numeral, and the two small compositions the route makes:
 * lifting a short opening paragraph into a lead, and the initials a portrait
 * placeholder may carry. Every function returns a new value; nothing here
 * mutates content.
 */
import { routes, teamHref } from '@/content/nav'
import type { NavItem, TeamMember } from '@/content/schemas'
import { DESCRIPTION_MAX, ROUTE_SEO } from '@/content/seo'
import { TEAM } from '@/content/team'
import { numeral } from '@/lib/interior'

/** docs/05 §T4: each profile points to the next three members in order. */
export const WORKS_ALONGSIDE_COUNT = 3

/**
 * An opening paragraph at or under this length is lifted onto the title page
 * as the lead; longer ones stay in the body. The bound is the metadata
 * description's — "a sentence or two" — so the two notions of a short
 * opening cannot drift apart.
 */
export const LEAD_MAX_CHARS = DESCRIPTION_MAX

/** Honorifics the document prefixes to a name; never part of the initials. */
const HONORIFICS = /^(dr|prof|mr|mrs|ms|mx)\.?$/i
const INITIALS_COUNT = 2

export type BiographyLead = Readonly<{ lead: string | undefined; paragraphs: readonly string[] }>

const byOrder = (team: readonly TeamMember[]): readonly TeamMember[] =>
  [...team].sort((a, b) => a.order - b.order)

export const memberBySlug = (
  slug: string,
  team: readonly TeamMember[] = TEAM
): TeamMember | undefined => team.find((member) => member.slug === slug)

const indexOfSlug = (slug: string, ordered: readonly TeamMember[]): number => {
  const index = ordered.findIndex((member) => member.slug === slug)
  if (index === -1) throw new Error(`profile: no team member with slug "${slug}"`)
  return index
}

/** The `n` members after `slug` in document order, wrapping past the end. */
export function worksAlongside(
  slug: string,
  n: number = WORKS_ALONGSIDE_COUNT,
  team: readonly TeamMember[] = TEAM
): readonly TeamMember[] {
  const ordered = byOrder(team)
  const start = indexOfSlug(slug, ordered)
  const count = Math.max(0, Math.min(n, ordered.length - 1))
  return Array.from({ length: count }, (_, i) => ordered[(start + 1 + i) % ordered.length]).filter(
    (member): member is TeamMember => member !== undefined
  )
}

/** `01`–`11`: the member's place in the document, as the index numbers them. */
export const profileNumeral = (member: TeamMember): string => numeral(member.order)

/**
 * The first letter of the first two names, honorific dropped:
 * `Dr. Elena Vasquez-Whitfield` → `EV`, `Dr. Fernando Escobosa García` → `FE`.
 */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part.length > 0 && !HONORIFICS.test(part))
    .slice(0, INITIALS_COUNT)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('')
}

/** The collection page, as the rail and the eyebrow name it. */
export const teamIndexItem = (): NavItem => ({ label: ROUTE_SEO.team.name, href: routes.team })

const asNavItem = (member: TeamMember): NavItem => ({
  label: member.name,
  href: teamHref(member.slug),
})

/** The previous and next member in document order; either end returns to the team page. */
export function profilePrevNext(
  slug: string,
  team: readonly TeamMember[] = TEAM
): Readonly<{ prev: NavItem; next: NavItem }> {
  const ordered = byOrder(team)
  const index = indexOfSlug(slug, ordered)
  const before = ordered[index - 1]
  const after = ordered[index + 1]
  return {
    prev: before ? asNavItem(before) : teamIndexItem(),
    next: after ? asNavItem(after) : teamIndexItem(),
  }
}

/**
 * A short opening paragraph becomes the title page's lead and the body keeps
 * the rest (the rule `liftLead` applies to a page, bounded by length). A
 * biography of one paragraph is never split.
 */
export function biographyLead(member: TeamMember, max: number = LEAD_MAX_CHARS): BiographyLead {
  const [opening, ...rest] = member.paragraphs
  const lifts = opening !== undefined && rest.length > 0 && opening.length <= max
  return lifts
    ? { lead: opening, paragraphs: rest }
    : { lead: undefined, paragraphs: [...member.paragraphs] }
}
