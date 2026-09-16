import { test as base, type Page } from '@playwright/test'

/**
 * Console capture, started the moment a page exists so nothing emitted during
 * navigation is missed. Read it back with `consoleErrorsFor(page)` or assert
 * with `expectNoConsoleErrors(page)` (console.ts). Warnings are kept apart:
 * GSAP reports a missing tween target as a warning, not an error (Task 21b).
 */
const errorsByPage = new WeakMap<Page, readonly string[]>()
const warningsByPage = new WeakMap<Page, readonly string[]>()

function record(store: WeakMap<Page, readonly string[]>, page: Page, entry: string): void {
  store.set(page, [...(store.get(page) ?? []), entry])
}

export const test = base.extend<{ trackConsole: void }>({
  trackConsole: [
    async ({ page }, use) => {
      errorsByPage.set(page, [])
      warningsByPage.set(page, [])
      page.on('console', (message) => {
        const type = message.type()
        if (type === 'error') record(errorsByPage, page, `console.error: ${message.text()}`)
        if (type === 'warning') record(warningsByPage, page, message.text())
      })
      page.on('pageerror', (error) => record(errorsByPage, page, `pageerror: ${error.message}`))
      await use()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'

export function consoleErrorsFor(page: Page): readonly string[] {
  const errors = errorsByPage.get(page)
  if (errors === undefined) {
    throw new Error('Console was not tracked for this page: import `test` from helpers/fixtures.')
  }
  return errors
}

export function consoleWarningsFor(page: Page): readonly string[] {
  const warnings = warningsByPage.get(page)
  if (warnings === undefined) {
    throw new Error('Console was not tracked for this page: import `test` from helpers/fixtures.')
  }
  return warnings
}
