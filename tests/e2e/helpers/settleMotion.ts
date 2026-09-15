import type { Page } from '@playwright/test'

/**
 * Waits until the page is visually at rest: fonts loaded, the preloader's
 * `veil:done` handshake fired (docs/04 §4 — set on <html data-veil="done">
 * whether the veil played, was skipped, or reduced motion suppressed it), and
 * one more frame painted so anything scheduled on that event has run.
 */
export async function settleMotion(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => document.documentElement.dataset.veil === 'done')
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
}
