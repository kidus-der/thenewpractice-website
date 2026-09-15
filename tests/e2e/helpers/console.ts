import { expect, type Page } from '@playwright/test'

import { consoleErrorsFor } from './fixtures'

/** Zero console errors and zero uncaught exceptions since the page was created. */
export function expectNoConsoleErrors(page: Page): void {
  expect(consoleErrorsFor(page), 'console errors and page errors').toEqual([])
}
