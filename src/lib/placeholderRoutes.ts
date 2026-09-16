/**
 * The production gate on PLACEHOLDER routes (docs/CONTENT-PROVENANCE-AUDIT.md
 * A3, A4). Residences, privacy and terms are stubs until the client supplies
 * their copy; staging keeps them everywhere so the templates can be reviewed,
 * and production links to none of them: not from the header, the overlay, the
 * footer or the previous/next rail. The pages themselves still render (with
 * `noIndex`), so a visitor with the URL is not met by a 404.
 *
 * The set is nav.ts `NOINDEX_ROUTES`; this module adds the environment. Pure
 * given `siteEnv`; the default reads the validated environment once, on the
 * server. Client components must receive the result as a prop (layout.tsx
 * passes `liveNav()` to the header): `SITE_ENV` is not inlined into browser
 * bundles, so a client-side call would disagree with the server's markup.
 */
import { NAV, NOINDEX_ROUTES } from '@/content/nav'
import type { Nav, NavItem } from '@/content/schemas'
import { env, type SiteEnv } from '@/lib/env'

const PRODUCTION: SiteEnv = 'production'

/** True when `path` is a PLACEHOLDER stub and this deployment is the production site. */
export const isPlaceholderRoute = (path: string, siteEnv: SiteEnv = env().SITE_ENV): boolean =>
  siteEnv === PRODUCTION && NOINDEX_ROUTES.has(path)

const withoutPlaceholders = (items: readonly NavItem[], siteEnv: SiteEnv): NavItem[] =>
  items.filter((item) => !isPlaceholderRoute(item.href, siteEnv))

/**
 * The navigation as this deployment shows it: nav.ts `NAV` off production;
 * on production the placeholder routes are gone and a footer group they
 * emptied (Legal) goes with them. A new object every call; NAV is untouched.
 */
export function liveNav(siteEnv: SiteEnv = env().SITE_ENV): Nav {
  return {
    primary: withoutPlaceholders(NAV.primary, siteEnv),
    utility: withoutPlaceholders(NAV.utility, siteEnv),
    footer: NAV.footer
      .map((group) => ({ ...group, items: withoutPlaceholders(group.items, siteEnv) }))
      .filter((group) => group.items.length > 0),
  }
}
