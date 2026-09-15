import type { Page } from '@playwright/test'

/** Reveals run at --d-slow with a stagger; this is generous headroom after the last scroll step. */
const REVEAL_SETTLE_MS = 2500
const SCROLL_STEP_VH = 0.6

/**
 * Scroll the whole page once so every once:true reveal has fired, then
 * return to the top and wait for the tweens to land; a full-page capture of
 * an unscrolled page would otherwise show the body still hidden (ledger,
 * Task 11 findings).
 */
export async function revealAll(page: Page): Promise<void> {
  await page.evaluate(async (stepVh) => {
    const step = window.innerHeight * stepVh
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
    const max = () => document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= max(); y += step) {
      window.scrollTo(0, y)
      await frame()
      await frame()
    }
    window.scrollTo(0, max())
    await frame()
    window.scrollTo(0, 0)
    await frame()
  }, SCROLL_STEP_VH)
  await page.waitForTimeout(REVEAL_SETTLE_MS)
}
