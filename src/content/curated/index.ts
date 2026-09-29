/**
 * THE CURATION REGISTRY — docs/06-copy-deck.md §Curation.
 *
 * Every curation a route renders is listed here, so content.checks.ts can
 * check its references and its `ours()` strings. registry.test.ts fails when
 * a module under src/content/curated/ exports a curation that is missing from
 * this list.
 *
 * Routes import their curation from its own module (`@/content/curated/about`),
 * never from this file, so one page does not carry every page's text.
 *
 * Round 1: R0 built the layer and curates nothing; R3, R4a–d and R5 add a
 * module per page and list it here.
 */
import { ABOUT_CURATION } from './about'
import type { Curation } from './core'
import { FEES_CURATION } from './fees'
import { HOME_CURATION } from './home'
import { PERSONAL_MESSAGE_CURATION } from './personal-message'
import { PROCESS_CURATION } from './process'
import { SERVICES_CURATION, SERVICES_PAGE_CURATION } from './services'

export const CURATIONS: readonly Curation<unknown>[] = [
  HOME_CURATION,
  ABOUT_CURATION,
  PROCESS_CURATION,
  PERSONAL_MESSAGE_CURATION,
  FEES_CURATION,
  SERVICES_PAGE_CURATION,
  SERVICES_CURATION,
]
