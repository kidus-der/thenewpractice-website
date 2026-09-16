/**
 * NAVIGATION — docs/06-copy-deck.md
 *
 * Hand-written, not generated: navigation is derived from the page set, not
 * from the client document. Labels are structural copy in the brand voice
 * (docs/01). Routes are the single place a path is spelled out; templates,
 * the sitemap and the footer all read from here.
 */
import { navSchema } from './schemas'

export const routes = {
  home: '/',
  about: '/about',
  process: '/our-process',
  personalMessage: '/a-personal-message',
  fees: '/fees',
  residences: '/residences',
  clinicalServices: '/clinical-services',
  team: '/team',
  selfAssessment: '/self-assessment',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
} as const

export type RouteKey = keyof typeof routes
export type StaticRoute = (typeof routes)[RouteKey]

/**
 * Routes whose page is a PLACEHOLDER stub until the client supplies its copy
 * (docs/CONTENT-GAPS.md G1, G3). Each page passes `noIndex: true` to
 * `buildMetadata()`, none is in the sitemap or llms.txt, and on production
 * none is linked from the navigation (src/lib/placeholderRoutes.ts). Remove a
 * route from here when its text arrives.
 */
export const NOINDEX_ROUTES: ReadonlySet<string> = new Set([
  routes.residences,
  routes.privacy,
  routes.terms,
])

export const serviceHref = (slug: string): string => `${routes.clinicalServices}/${slug}`
export const teamHref = (slug: string): string => `${routes.team}/${slug}`
export const assessmentHref = (slug: string): string => `${routes.selfAssessment}/${slug}`

export const NAV = navSchema.parse({
  primary: [
    { label: 'About', href: routes.about },
    { label: 'Our Process', href: routes.process },
    { label: 'Clinical Services', href: routes.clinicalServices },
    { label: 'Team', href: routes.team },
    { label: 'Residences', href: routes.residences },
    { label: 'Self-Assessment', href: routes.selfAssessment },
  ],
  utility: [{ label: 'Enquire', href: routes.contact }],
  footer: [
    {
      heading: 'Practice',
      items: [
        { label: 'About', href: routes.about },
        { label: 'Our Process', href: routes.process },
        { label: 'A Personal Message', href: routes.personalMessage },
        { label: 'Fees', href: routes.fees },
      ],
    },
    {
      heading: 'Care',
      items: [
        { label: 'Clinical Services', href: routes.clinicalServices },
        { label: 'Team', href: routes.team },
        { label: 'Residences', href: routes.residences },
        { label: 'Self-Assessment', href: routes.selfAssessment },
      ],
    },
    {
      heading: 'Contact',
      items: [{ label: 'Enquire', href: routes.contact }],
    },
    {
      heading: 'Legal',
      items: [
        { label: 'Privacy', href: routes.privacy },
        { label: 'Terms', href: routes.terms },
      ],
    },
  ],
})

/**
 * HEADER AND MENU STRINGS — Task 7. The trigger's two labels and the
 * accessible names the chrome navigation needs. They live beside the routes
 * rather than in ui.ts because they belong to the navigation, not the page.
 */
export const UI_NAV = {
  /** The trigger below 1024px, at rest and while the overlay is open. */
  menu: 'Menu',
  close: 'Close',
  ariaLabels: {
    /** The desktop <nav> and the overlay's primary <nav>. */
    primary: 'Primary',
    /** The overlay dialog itself. */
    overlay: 'Menu',
    /** The overlay's founder-contact column. */
    contact: 'Contact',
  },
} as const

/**
 * Whether a navigation item is the current page. A section route also owns
 * its children (`/team` is current on `/team/[slug]`); home is only itself.
 * The header's `aria-current` and the overlay's brass tick both read this.
 */
export function isActiveRoute(href: string, pathname: string): boolean {
  if (href === routes.home) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
