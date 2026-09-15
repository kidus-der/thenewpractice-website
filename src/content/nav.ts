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
