/**
 * Footer — Task 8. Runs under every project (four widths and reduced motion)
 * against `/`; the footer is global, so any route would do.
 *
 * Landmarks, link integrity, the base line (copyright and the mark with its
 * brass point), the parts round 1 removed (marquee, contact block, wordmark,
 * confidentiality line), a height under one viewport, no animation, and axe.
 */
import { BRAND } from '../../src/content/brand'
import { routes } from '../../src/content/nav'
import { HOME } from '../../src/content/pages/home'
import {
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'
import { EXPECTED_NAV } from './helpers/siteEnv'

const ROUTE = '/'
const FOOTER = 'footer[data-ground="dark"]'
/** On a production-mode server the Legal group is not rendered (helpers/siteEnv.ts, Task 20b). */
const FOOTER_LINK_COUNT = EXPECTED_NAV.footer.reduce((n, group) => n + group.items.length, 0)
const LEGAL_LINKS_EXPECTED = EXPECTED_NAV.footer.some((group) => group.heading === 'Legal')
/** Long enough for any stray loop to register, short enough to keep the suite quick. */
const MOTION_SAMPLE_MS = 600
/** The client's sentence the footer used to repeat, read where it lives (home, closing section). */
const CONFIDENTIALITY = HOME.sections.find((s) => s.id === 'begin-the-conversation')?.paragraphs[1]

/** Resolves a CSS colour (the brass token) to the rgb() string getComputedStyle reports. */
function toRgb(colour: string): string {
  const probe = document.createElement('span')
  probe.style.color = colour
  document.body.append(probe)
  const rgb = getComputedStyle(probe).color
  probe.remove()
  return rgb
}

test.describe('footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test('exposes contentinfo and a named footer navigation', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    await expect(footer).toHaveCount(1)
    await expect(footer).toHaveAttribute('data-ground', 'dark')
    await expect(footer.getByRole('navigation', { name: 'Footer' })).toBeVisible()

    const path = await screenshotRoute(page, 'footer')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })

  test('renders every sitemap group with a heading and its links', async ({ page }) => {
    const nav = page.locator(`${FOOTER} nav`)
    for (const group of EXPECTED_NAV.footer) {
      await expect(nav.getByRole('heading', { level: 3, name: group.heading })).toBeVisible()
      for (const item of group.items) {
        await expect(nav.getByRole('link', { name: item.label, exact: true })).toHaveAttribute(
          'href',
          item.href
        )
      }
    }
    await expect(nav.getByRole('link')).toHaveCount(FOOTER_LINK_COUNT)
  })

  test('every footer link has a non-empty href', async ({ page }) => {
    const hrefs = await page
      .locator(`${FOOTER} a`)
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href') ?? ''))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) expect(href).not.toBe('')
  })

  test('carries no marquee, no contact block, no wordmark and no confidentiality line', async ({
    page,
  }) => {
    // Round 1, R2: the footer is the sitemap and a base line, nothing else.
    const footer = page.locator(FOOTER)
    await expect(footer.locator('.marquee')).toHaveCount(0)
    await expect(footer.locator('address')).toHaveCount(0)
    await expect(footer.locator('a[href^="tel:"], a[href^="mailto:"]')).toHaveCount(0)
    await expect(footer).not.toContainText(BRAND.nameUpper)
    await expect(footer).not.toContainText(BRAND.trademark)
    await expect(footer).not.toContainText(BRAND.tagline)
    await expect(footer).not.toContainText(BRAND.founder.name)
    if (CONFIDENTIALITY) await expect(footer).not.toContainText(CONFIDENTIALITY)
  })

  test('closes on the copyright and the mark with its brass point', async ({ page }) => {
    const base = page.locator('.site-footer__base')
    await expect(base.locator('p')).toHaveText(`© ${new Date().getFullYear()} ${BRAND.name}`)
    // Privacy and terms belong to the Legal column and are never repeated here
    // (ledger, Task 8 triage). On production the column is not rendered (Task 20b).
    await expect(base.locator('a')).toHaveCount(0)
    const expected = LEGAL_LINKS_EXPECTED ? 1 : 0
    await expect(page.locator(`.site-footer__nav a[href="${routes.privacy}"]`)).toHaveCount(
      expected
    )
    await expect(page.locator(`.site-footer__nav a[href="${routes.terms}"]`)).toHaveCount(expected)

    // One mark in the whole footer, decorative, with the one accent at its point.
    const mark = page.locator(`${FOOTER} svg.mark`)
    await expect(mark).toHaveCount(1)
    await expect(mark).toHaveAttribute('aria-hidden', 'true')
    const [fill, brass] = await mark
      .locator('.mark__point')
      .evaluate((point) => [
        getComputedStyle(point).fill,
        getComputedStyle(point).getPropertyValue('--c-brass').trim(),
      ])
    expect(brass).not.toBe('')
    expect(fill).toBe(await page.evaluate(toRgb, brass))
  })

  test('is shorter than one viewport at every width', async ({ page }) => {
    const box = await page.locator(FOOTER).boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(box!.height).toBeLessThan(viewport!.height)
  })

  test('runs no animation of its own', async ({ page }) => {
    // The marquee was the footer's one loop; nothing inside the landmark moves now.
    await page.locator(FOOTER).scrollIntoViewIfNeeded()
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    const running = await page.locator(FOOTER).evaluate(
      (footer) =>
        document.getAnimations().filter((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target
          return target instanceof Element && footer.contains(target)
        }).length
    )
    expect(running).toBe(0)
  })

  test('has no serious axe violations inside the footer', async ({ page }) => {
    // Scoped to the landmark: the page around it belongs to other tasks
    // (home.spec.ts runs the whole document).
    await page.locator(FOOTER).scrollIntoViewIfNeeded()
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: FOOTER })
  })
})
