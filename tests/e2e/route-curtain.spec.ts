import type { Page } from '@playwright/test'

import { PROJECTS, expect, expectNoConsoleErrors, settleMotion, test } from './helpers'

/**
 * Route curtain (docs/04 §4 "Route transitions"; ledger task 9).
 *
 * The home placeholder has no link to the dev harness yet, so the test drops a
 * plain anchor into <main> for the outbound leg — the curtain intercepts any
 * same-origin anchor, not only <Link>. The harness route links home itself.
 */
const HOME = '/'
const HARNESS = '/dev/curtain'
const CURTAIN = '.route-curtain'
const TRANSITION_TIMEOUT_MS = 20_000

type DevWindow = Window & {
  __tnp?: { scrollTriggerCount?: () => number; curtainPhase?: () => string }
}

const scrollTriggerCount = (page: Page) =>
  page.evaluate(() => (window as DevWindow).__tnp?.scrollTriggerCount?.() ?? -1)

const scrollY = (page: Page) => page.evaluate(() => window.scrollY)

const focusInsideMain = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main')
    return main !== null && main.contains(document.activeElement)
  })

async function ensureLinkTo(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    if (document.querySelector(`main a[href="${target}"]`)) return
    const a = document.createElement('a')
    a.href = target
    a.textContent = target
    a.dataset.testid = 'curtain-outbound'
    document.querySelector('main')?.append(a)
  }, href)
}

/**
 * Clicks an in-page link to `href` and waits for the curtain to finish. The
 * last matching link by default: Playwright scrolls the target into view before
 * clicking, so leaving from the bottom link keeps the scroll-reset observable.
 */
async function navigateThroughCurtain(page: Page, href: string): Promise<void> {
  const curtain = page.locator(CURTAIN)
  await ensureLinkTo(page, href)
  await page.locator(`main a[href="${href}"]`).last().click()

  await expect(curtain, 'curtain covers the page').toBeVisible()
  await expect(curtain).toHaveAttribute('data-phase', 'idle', { timeout: TRANSITION_TIMEOUT_MS })
  await expect(curtain, 'curtain is gone after the reveal').toBeHidden()
  await expect(page).toHaveURL(href)
}

async function expectSettledPage(page: Page): Promise<void> {
  expect(await scrollY(page), 'scroll is reset to the top').toBe(0)
  expect(await focusInsideMain(page), 'focus is inside <main>').toBe(true)
  await expect(page.locator('.preloader'), 'preloader does not return').toHaveCount(0)
}

test.describe('route curtain', () => {
  test('covers, resets scroll and hands focus over on each navigation', async ({ page }) => {
    // Warm the harness route so its first compile does not land inside a hold.
    await page.goto(HARNESS)
    await settleMotion(page)
    await page.goto(HOME)
    await settleMotion(page)

    await navigateThroughCurtain(page, HARNESS)
    await expectSettledPage(page)

    // Leave from the bottom so the reset under cover is observable.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    expect(await scrollY(page)).toBeGreaterThan(0)
    await navigateThroughCurtain(page, HOME)
    await expectSettledPage(page)

    await navigateThroughCurtain(page, HARNESS)
    await expectSettledPage(page)

    expectNoConsoleErrors(page)
  })

  test('keeps the ScrollTrigger count of a fresh load across three navigations', async ({
    page,
  }) => {
    await page.goto(HARNESS)
    await settleMotion(page)
    const fresh = await scrollTriggerCount(page)
    test.skip(fresh < 0, 'dev hook window.__tnp is absent on a production server')

    await page.goto(HOME)
    await settleMotion(page)
    await navigateThroughCurtain(page, HARNESS)
    await navigateThroughCurtain(page, HOME)
    await navigateThroughCurtain(page, HARNESS)

    expect(await scrollTriggerCount(page)).toBe(fresh)
  })

  test('draws the mark under a clip-path wipe, or fades under reduced motion', async ({
    page,
  }, info) => {
    const reduced = info.project.name === PROJECTS.reducedMotion
    const curtain = page.locator(CURTAIN)

    await page.goto(HARNESS)
    await settleMotion(page)

    await page.getByTestId('curtain-return').click()
    await expect(curtain).toBeVisible()

    const midway = await curtain.evaluate((el) => {
      const style = getComputedStyle(el)
      return {
        clipPath: style.clipPath,
        opacity: Number(style.opacity),
        animatedMark: el.querySelector('.mark--animated') !== null,
      }
    })

    if (reduced) {
      expect(midway.clipPath, 'no clip-path under reduced motion').toBe('none')
      expect(midway.animatedMark, 'mark renders complete under reduced motion').toBe(false)
    } else {
      expect(midway.clipPath, 'clip-path wipe is running').toMatch(/^inset\(/)
      expect(midway.animatedMark, 'mark strokes are drawn by the curtain').toBe(true)
    }

    await expect(curtain).toHaveAttribute('data-phase', 'idle', { timeout: TRANSITION_TIMEOUT_MS })
    await expect(page).toHaveURL(HOME)
    expectNoConsoleErrors(page)
  })
})
