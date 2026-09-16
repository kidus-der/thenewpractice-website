/**
 * Footer — Task 8. Runs under every project (four widths and reduced motion)
 * against `/`; the footer is global, so any route would do.
 *
 * Landmarks, link integrity, the founder's tel:/mailto: links, the marquee's
 * accessibility contract, the reduced-motion single repetition, and axe.
 */
import { BRAND } from '../../src/content/brand'
import { NAV, routes } from '../../src/content/nav'
import {
  PROJECTS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'

const ROUTE = '/'
const FOOTER = 'footer[data-ground="dark"]'
const FOOTER_LINK_COUNT = NAV.footer.reduce((n, group) => n + group.items.length, 0)
/** Long enough for the 40s loop to move a visible distance, short enough to keep the suite quick. */
const MOTION_SAMPLE_MS = 1200

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
    for (const group of NAV.footer) {
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

  test('links the founder by telephone and email, from brand.ts', async ({ page }) => {
    const address = page.locator(`${FOOTER} address`)
    await expect(address).toContainText(BRAND.founder.name)
    await expect(address).toContainText(BRAND.founder.credentials)
    await expect(address).toContainText(BRAND.founder.role)

    const digits = BRAND.phone.replace(/[^\d+]/g, '')
    await expect(address.getByRole('link', { name: BRAND.phone })).toHaveAttribute(
      'href',
      `tel:${digits}`
    )
    await expect(address.getByRole('link', { name: BRAND.email })).toHaveAttribute(
      'href',
      `mailto:${BRAND.email}`
    )
    for (const line of BRAND.locale.split(', ')) await expect(address).toContainText(line)
  })

  test('carries the legal line without repeating privacy and terms', async ({ page }) => {
    const legal = page.locator('.site-footer__legal')
    await expect(legal).toContainText(`${new Date().getFullYear()} ${BRAND.name}`)
    // The Legal column carries both links; the line does not repeat them (ledger, Task 8 triage).
    await expect(legal.locator('a')).toHaveCount(0)
    await expect(page.locator(`.site-footer__nav a[href="${routes.privacy}"]`)).toHaveCount(1)
    await expect(page.locator(`.site-footer__nav a[href="${routes.terms}"]`)).toHaveCount(1)
  })

  test('renders the lockup once with the trademark as a superscript', async ({ page }) => {
    const lockup = page.locator('.site-footer__lockup')
    await expect(lockup.locator('svg.mark')).toHaveCount(1)
    await expect(lockup.locator('sup')).toHaveText(BRAND.trademark)
    await expect(lockup).toContainText(BRAND.tagline)
  })

  test('hides the marquee from assistive technology and marks the duplicate', async ({ page }) => {
    const marquee = page.locator(`${FOOTER} .marquee`)
    await expect(marquee).toHaveAttribute('aria-hidden', 'true')
    const sets = marquee.locator('.marquee__set')
    await expect(sets).toHaveCount(2)
    await expect(sets.nth(1)).toHaveAttribute('aria-hidden', 'true')
  })

  test('marquee is static, one repetition, under reduced motion', async ({ page }, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
    const track = page.locator(`${FOOTER} .marquee__track`)
    await track.scrollIntoViewIfNeeded()
    const before = await track.evaluate((el) => getComputedStyle(el).transform)
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    const after = await track.evaluate((el) => getComputedStyle(el).transform)
    expect(after).toBe(before)

    const visibleItems = await page
      .locator(`${FOOTER} .marquee__item`)
      .evaluateAll((items) => items.filter((el) => el.checkVisibility()).length)
    expect(visibleItems).toBe(1)
  })

  test('marquee moves when motion is permitted', async ({ page }, info) => {
    test.skip(info.project.name === PROJECTS.reducedMotion, 'motion projects only')
    const track = page.locator(`${FOOTER} .marquee__track`)
    await track.scrollIntoViewIfNeeded()
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    const before = await track.evaluate((el) => getComputedStyle(el).transform)
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    const after = await track.evaluate((el) => getComputedStyle(el).transform)
    expect(after).not.toBe(before)
  })

  test('marquee pauses once the footer leaves the viewport', async ({ page }, info) => {
    test.skip(info.project.name === PROJECTS.reducedMotion, 'motion projects only')
    const track = page.locator(`${FOOTER} .marquee__track`)
    await track.scrollIntoViewIfNeeded()
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    const before = await track.evaluate((el) => getComputedStyle(el).transform)
    await page.waitForTimeout(MOTION_SAMPLE_MS)
    const after = await track.evaluate((el) => getComputedStyle(el).transform)
    expect(after).toBe(before)
  })

  test('has no serious axe violations inside the footer', async ({ page }) => {
    // Scoped to the landmark: the page around it belongs to other tasks
    // (home.spec.ts runs the whole document).
    await page.locator(FOOTER).scrollIntoViewIfNeeded()
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: FOOTER })
  })
})
