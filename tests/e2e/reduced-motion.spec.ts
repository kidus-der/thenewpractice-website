/**
 * Reduced-motion walkthrough (docs/04 §7, docs/09 §2; Task 19), on the
 * reduced-motion project only: one route per template renders with nothing
 * invisible, no pinned section, no video and no gradient, the marquee static,
 * and the residences carousel a focusable native scroller.
 */
import { routes, serviceHref, teamHref, assessmentHref } from '../../src/content/nav'
import { SERVICES } from '../../src/content/services'
import { TEAM } from '../../src/content/team'
import { ASSESSMENTS } from '../../src/content/assessments'
import { PROJECTS, expect, expectNoConsoleErrors, revealAll, settleMotion, test } from './helpers'

const first = <T>(items: readonly T[], what: string): T => {
  const [item] = items
  if (!item) throw new Error(`no ${what}`)
  return item
}

const ROUTES: readonly { name: string; path: string }[] = [
  { name: 'home', path: routes.home },
  { name: 'interior', path: routes.about },
  { name: 'process', path: routes.process },
  { name: 'treatment', path: serviceHref(first(SERVICES, 'services').slug) },
  { name: 'profile', path: teamHref(first(TEAM, 'team members').slug) },
  { name: 'residences', path: routes.residences },
  { name: 'index', path: routes.team },
  { name: 'enquiry', path: routes.contact },
  { name: 'assessment', path: assessmentHref(first(ASSESSMENTS, 'assessments').slug) },
]

/** Text-bearing elements in <main> that a reader could not see. */
const invisibleText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const out: string[] = []
    const walker = document.createTreeWalker(
      document.querySelector('main') ?? document.body,
      NodeFilter.SHOW_ELEMENT
    )
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node as HTMLElement
      if (!el.textContent?.trim()) continue
      if (
        el.children.length &&
        !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim())
      )
        continue
      if (el.closest('[hidden], [aria-hidden="true"], .sr-only, noscript, script, style')) continue
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      const hidden =
        Number(style.opacity) < 0.05 ||
        (style.clipPath !== 'none' && /inset\(0(px)? 0(px)? 100%/.test(style.clipPath))
      if (hidden)
        out.push(
          `${el.tagName.toLowerCase()}.${el.className}: ${el.textContent.trim().slice(0, 40)}`
        )
    }
    return out
  })

test.describe('reduced motion', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
  })

  for (const route of ROUTES) {
    test(`${route.name}: nothing invisible, nothing pinned, no video, no gradient`, async ({
      page,
    }) => {
      await page.goto(route.path)
      await settleMotion(page)
      await page.waitForLoadState('networkidle')
      // At the top of the page, before any scroll: reveals must not depend on it.
      expect(await invisibleText(page), 'invisible text at the top of the page').toEqual([])
      await revealAll(page)
      expect(await invisibleText(page), 'invisible text after a scroll').toEqual([])
      await expect(page.locator('.pin-spacer')).toHaveCount(0)
      await expect(page.locator('video')).toHaveCount(0)
      await expect(page.locator('canvas')).toHaveCount(0)
      await expect(page.locator('.cursor')).toHaveCount(0)
      // the one permitted marquee stands still
      expect(
        await page.locator('.marquee__track').evaluate((el) => getComputedStyle(el).transform)
      ).toBe('none')
      expectNoConsoleErrors(page)
    })
  }

  test('the residences carousel is a focusable native scroller', async ({ page }) => {
    await page.goto(routes.residences)
    await settleMotion(page)
    const region = page.locator('.plate-carousel__viewport[role="region"]')
    await expect(region).toHaveCount(1)
    await expect(region).toHaveAttribute('tabindex', '0')
    expect(await region.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto')
    await region.focus()
    await expect(region).toBeFocused()
  })
})
