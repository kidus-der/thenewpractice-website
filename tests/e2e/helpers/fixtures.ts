import { test as base, type Page } from '@playwright/test'

/**
 * Console capture, started the moment a page exists so nothing emitted during
 * navigation is missed. Read it back with `consoleErrorsFor(page)` or assert
 * with `expectNoConsoleErrors(page)` (console.ts).
 */
const errorsByPage = new WeakMap<Page, readonly string[]>()

function record(page: Page, entry: string): void {
  errorsByPage.set(page, [...(errorsByPage.get(page) ?? []), entry])
}

export const test = base.extend<{ trackConsole: void }>({
  trackConsole: [
    async ({ page }, use) => {
      errorsByPage.set(page, [])
      page.on('console', (message) => {
        if (message.type() === 'error') record(page, `console.error: ${message.text()}`)
      })
      page.on('pageerror', (error) => record(page, `pageerror: ${error.message}`))
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
