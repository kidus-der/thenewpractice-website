import { expect, type Page } from '@playwright/test'

import { consoleErrorsFor, consoleWarningsFor } from './fixtures'

/** GSAP's `GSAP target … not found` warning: a tween whose selector matched nothing. */
const MISSING_TARGET = /target .*not found/

/** Zero console errors and zero uncaught exceptions since the page was created. */
export function expectNoConsoleErrors(page: Page): void {
  expect(consoleErrorsFor(page), 'console errors and page errors').toEqual([])
}

/**
 * No tween has been built against a selector that resolved to nothing. Such a
 * tween is silent on the page — the resting stylesheet state stands in for the
 * animation — so only the console shows it (ledger, Task 21 finding).
 */
export function expectNoMissingMotionTargets(page: Page): void {
  expect(
    consoleWarningsFor(page).filter((text) => MISSING_TARGET.test(text)),
    'GSAP tweens whose target was not found'
  ).toEqual([])
}
