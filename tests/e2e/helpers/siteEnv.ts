/**
 * The navigation the server under test renders (Task 21). Off production the
 * header, overlay and footer carry nav.ts `NAV` in full; a production-mode
 * server (`SITE_ENV=production`) drops the placeholder routes and the emptied
 * Legal group (src/lib/placeholderRoutes.ts). The test process reads the same
 * variable the server was started with, as robots.spec.ts does, so
 * `SITE_ENV=production npm run e2e` asserts the production navigation.
 */
import type { Nav } from '../../../src/content/schemas'
import { liveNav } from '../../../src/lib/placeholderRoutes'

export const IS_PRODUCTION_SERVER = process.env.SITE_ENV === 'production'

export const EXPECTED_NAV: Nav = liveNav(IS_PRODUCTION_SERVER ? 'production' : 'staging')
