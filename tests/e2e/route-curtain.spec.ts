import type { Page } from '@playwright/test'

import { routes } from '../../src/content/nav'
import { PROJECTS, expect, expectNoConsoleErrors, settleMotion, test } from './helpers'

/**
 * Route curtain (docs/04 §4 "Route transitions"; ledger task 9), exercised
 * between real routes: home → about → contact and back. The curtain
 * intercepts any same-origin anchor, so the links used are the pages' own —
 * the header's wordmark home, the header's primary links from 1024px and the
 * about page's rail below it.
 */
const HOME = routes.home
const ABOUT = routes.about
const CONTACT = routes.contact
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

/**
 * Clicks a link to `href` and waits for the curtain to finish. The last
 * visible matching link on the page: Playwright scrolls the target into view
 * before clicking, so leaving from the foot keeps the scroll reset
 * observable. Header links are hidden below 1024px, so only visible links
 * are considered.
 */
async function navigateThroughCurtain(page: Page, href: string): Promise<void> {
  const curtain = page.locator(CURTAIN)
  const links = page.locator(`a[href="${href}"]:visible`)
  await expect(links.first(), `a visible link to ${href}`).toBeVisible()
  await links.last().click()

  await expect(curtain, 'curtain covers the page').toBeVisible()
  await expect(curtain).toHaveAttribute('data-phase', 'idle', { timeout: TRANSITION_TIMEOUT_MS })
  await expect(curtain, 'curtain is gone after the reveal').toBeHidden()
  await expect(page).toHaveURL(href)
}

async function expectSettledPage(page: Page): Promise<void> {
  expect(await scrollY(page), 'scroll is reset to the top').toBe(0)
  expect(await focusInsideMain(page), 'focus is inside <main>').toBe(true)
  await expect(page.locator('.preloader'), 'preloader does not return').toHaveCount(0)
  await expect(page.locator('body')).toHaveAttribute('data-locked', 'false')
  await expect(page.locator('main')).not.toHaveAttribute('inert', '')
}

test.describe('route curtain', () => {
  test('covers, resets scroll and hands focus over on each navigation', async ({ page }) => {
    // Warm the routes so a first compile never lands inside a hold.
    await page.goto(ABOUT)
    await settleMotion(page)
    await page.goto(CONTACT)
    await settleMotion(page)
    await page.goto(HOME)
    await settleMotion(page)

    await navigateThroughCurtain(page, ABOUT)
    await expectSettledPage(page)

    // Leave from the foot so the reset under cover is observable.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    expect(await scrollY(page)).toBeGreaterThan(0)
    await navigateThroughCurtain(page, CONTACT)
    await expectSettledPage(page)

    await navigateThroughCurtain(page, HOME)
    await expectSettledPage(page)

    expectNoConsoleErrors(page)
  })

  test('keeps the ScrollTrigger count of a fresh load across three navigations', async ({
    page,
  }) => {
    await page.goto(ABOUT)
    await settleMotion(page)
    const fresh = await scrollTriggerCount(page)
    test.skip(fresh < 0, 'dev hook window.__tnp is absent on a production server')

    await page.goto(HOME)
    await settleMotion(page)
    await navigateThroughCurtain(page, ABOUT)
    await navigateThroughCurtain(page, CONTACT)
    await navigateThroughCurtain(page, ABOUT)

    expect(await scrollTriggerCount(page)).toBe(fresh)
  })

  test('draws the mark under a clip-path wipe, or fades under reduced motion', async ({
    page,
  }, info) => {
    const reduced = info.project.name === PROJECTS.reducedMotion
    const curtain = page.locator(CURTAIN)

    await page.goto(ABOUT)
    await settleMotion(page)

    // The header's wordmark is the one link home present at every width.
    await page.locator('header.site-header').getByRole('link').first().click()
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
