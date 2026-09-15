/**
 * CONTENT LAYER — docs/06-copy-deck.md
 *
 * One import surface for every module. Generated modules come from
 * scripts/ingest-content.mjs; brand.ts, ui.ts, nav.ts and pages/residences.ts
 * are hand-written.
 */
import { ASSESSMENTS } from './assessments'
import { routes, serviceHref, teamHref, assessmentHref } from './nav'
import { SERVICES } from './services'
import { TEAM } from './team'

export { BRAND } from './brand'
export { UI } from './ui'
export { NAV, routes, serviceHref, teamHref, assessmentHref } from './nav'
export type { RouteKey, StaticRoute } from './nav'

export { HOME } from './pages/home'
export { ABOUT } from './pages/about'
export { PROCESS } from './pages/process'
export { PERSONAL_MESSAGE } from './pages/personal-message'
export { FEES } from './pages/fees'
export { CONTACT } from './pages/contact'
export { RESIDENCES } from './pages/residences'

export { SERVICES, SERVICES_PAGE } from './services'
export { TEAM, TEAM_PAGE } from './team'
export { ASSESSMENTS, ASSESSMENTS_PAGE, ASSESSMENT_SERIES } from './assessments'

export * from './schemas'

/** Every route the site serves, static and generated, for the sitemap. */
export function allRoutes(): readonly string[] {
  return [
    ...Object.values(routes),
    ...SERVICES.map((service) => serviceHref(service.slug)),
    ...TEAM.map((member) => teamHref(member.slug)),
    ...ASSESSMENTS.map((assessment) => assessmentHref(assessment.slug)),
  ]
}
