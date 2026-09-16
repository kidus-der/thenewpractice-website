/**
 * Every route at every width (docs/11 Gate 1 "Responsive"; Task 19): the
 * twelve static routes, the eleven services, the eleven team members and the
 * ten questionnaires, each opened on each project and checked for horizontal
 * overflow, a console clean of errors, and an <h1>. The template specs read
 * the screenshots; this is the sweep that keeps the whole route set honest.
 */
import { allRoutes, routes } from '../../src/content'
import { NOINDEX_ROUTES } from '../../src/content/nav'
import { expect, expectNoConsoleErrors, revealAll, settleMotion, test } from './helpers'

const ROUTES = allRoutes()

const overflow = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

/** The fixed header's box; nothing in <main> may open under it at the top of the page. */
const underHeader = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const header = document.querySelector('header.site-header')
    const main = document.querySelector('main')
    if (!header || !main) return []
    const bottom = header.getBoundingClientRect().bottom
    return Array.from(main.querySelectorAll<HTMLElement>('h1, h2, p'))
      .filter((el) => el.getClientRects().length > 0 && el.textContent?.trim())
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.top < bottom && r.bottom > 0
      })
      .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent?.trim().slice(0, 40)}`)
  })

test.describe('viewports', () => {
  for (const path of ROUTES) {
    test(`${path} has no horizontal overflow and nothing under the header`, async ({ page }) => {
      await page.goto(path)
      await settleMotion(page)
      expect(await overflow(page), 'scroll width equals client width at the top').toBe(0)
      // The title page sits low in the frame; the header's own row is empty
      // of page text on every template (the hero on home carries its lockup
      // beneath the header, not under it).
      if (path !== routes.home) {
        expect(await underHeader(page), 'no page text under the fixed header').toEqual([])
      }
      await revealAll(page)
      expect(await overflow(page), 'scroll width equals client width after a scroll').toBe(0)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      expectNoConsoleErrors(page)
    })
  }

  test('the noindex routes are still served', async ({ page }) => {
    for (const path of NOINDEX_ROUTES) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    }
  })
})
