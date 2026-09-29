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

/**
 * The title page against the first viewport, in px from its bottom edge
 * (negative: inside it). The title page is <main>'s first child; `lockup` is
 * the bottom of its last heading, paragraph or figure; `next` is where the
 * following block's content starts (its top plus its top padding), wherever
 * the template nests it: a section, or a full-bleed wrapper with a ground.
 */
const titlePageAgainstFold = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const title = document.querySelector('main')?.firstElementChild
    if (!title) return null
    const lockup = Math.max(
      ...Array.from(title.querySelectorAll('h1, p, figure')).map(
        (el) => el.getBoundingClientRect().bottom
      )
    )
    const next = Array.from(document.querySelectorAll('main section, main [data-ground]')).find(
      (el) =>
        !title.contains(el) &&
        !el.contains(title) &&
        title.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
    )
    if (!next) return null
    const start = next.getBoundingClientRect().top + parseFloat(getComputedStyle(next).paddingTop)
    return {
      lockup: Math.round(lockup - window.innerHeight),
      next: Math.round(start - window.innerHeight),
    }
  })

/**
 * Round 1 (owner decision): every title page but the home hero is short, so
 * its lockup sits in the first viewport and the next block starts inside it
 * too. These still run past the fold on the client's full text, and the task
 * that curates them brings the next block up (px over at 1280 x 800):
 */
const AWAITING_CURATION: Readonly<Record<string, string>> = {
  [routes.contact]: 'R4d: the letter runs to 929px',
}

test.describe('viewports', () => {
  for (const path of ROUTES) {
    test(`${path} has no horizontal overflow and nothing under the header`, async ({ page }) => {
      await page.goto(path)
      await settleMotion(page)
      expect(await overflow(page), 'scroll width equals client width at the top').toBe(0)
      // The title page opens one step below the header (round 1: short title
      // pages); the header's own row is empty of page text on every template
      // (the hero on home carries its lockup beneath the header, not under it).
      if (path !== routes.home) {
        expect(await underHeader(page), 'no page text under the fixed header').toEqual([])
      }
      await revealAll(page)
      expect(await overflow(page), 'scroll width equals client width after a scroll').toBe(0)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      expectNoConsoleErrors(page)
    })
  }

  for (const path of ROUTES.filter((r) => r !== routes.home)) {
    test(`${path} has a short title page: the next block starts in the first viewport`, async ({
      page,
    }) => {
      await page.goto(path)
      await settleMotion(page)
      const fold = await titlePageAgainstFold(page)
      if (!fold) throw new Error('no block follows the title page')
      expect(fold.lockup, 'px the title page lockup runs below the fold').toBeLessThan(0)
      if (path in AWAITING_CURATION) return
      expect(fold.next, 'px the next block starts below the fold').toBeLessThan(0)
    })
  }

  test('the noindex routes are still served', async ({ page }) => {
    for (const path of NOINDEX_ROUTES) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    }
  })
})
