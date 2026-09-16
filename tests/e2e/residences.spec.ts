/**
 * /residences — the T5 Residences template (Task 17). docs/05 §T5, docs/04
 * §6 "Drifting carousel", docs/09 §2.
 *
 * Every project: the h1 on bone, the six carousel figures with alt in the
 * primary set and the duplicate set aria-hidden, the amenities rows, the
 * privacy statement as the client's own sentence, the rail, the review flag
 * (the dev server is not production), axe scoped to main, a full-page
 * capture after a reveal pass. Motion projects: the track is moving. The
 * reduced-motion project: the track is static and the viewport scrolls.
 */
import { MEDIA } from '../../src/content/media'
import { routes } from '../../src/content/nav'
import { RESIDENCES } from '../../src/content/pages/residences'
import { UI_INTERIOR, UI_RESIDENCES } from '../../src/content/ui'
import { prevNextFor, readingOrder } from '../../src/lib/prevNext'
import { discretionStatement } from '../../src/lib/residences'
import {
  PROJECTS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  revealAll,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'
import { EXPECTED_NAV, IS_PRODUCTION_SERVER } from './helpers/siteEnv'

const ROUTE = routes.residences
const CAROUSEL = `section[aria-label="${UI_RESIDENCES.carouselLabel}"]`
const AMENITIES = `section[aria-label="${UI_RESIDENCES.amenitiesLabel}"]`
const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`
const TRACK = `${CAROUSEL} .plate-carousel__track`
const VIEWPORT = `${CAROUSEL} .plate-carousel__viewport`
const PRIMARY = `${TRACK} > li:not([aria-hidden="true"])`
const DUPLICATE = `${TRACK} > li[aria-hidden="true"]`
const PLATE_COUNT = 6
/** Long enough for a 34 s linear drift to move a measurable distance. */
const DRIFT_SAMPLE_MS = 800

const CAROUSEL_KEYS = [
  'residence-01',
  'residence-02',
  'residence-03',
  'residence-04',
  'residence-05',
  'residence-06',
] as const

const TITLES = RESIDENCES.sections.map((s) => s.title).filter((t): t is string => Boolean(t))

async function scrollCarouselIntoView(page: import('@playwright/test').Page): Promise<void> {
  await page.locator(CAROUSEL).scrollIntoViewIfNeeded()
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())))
}

const translateX = (transform: string): number => {
  if (transform === 'none') return 0
  const parts = transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(',') ?? []
  return Number(parts[4] ?? 0)
}

test.describe('residences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test('opens on bone with the page title as the only h1', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText(RESIDENCES.title)
    await expect(page.locator('main > :first-child')).toHaveAttribute('data-ground', 'light')
    expectNoConsoleErrors(page)
  })

  test('renders the three sections and the privacy statement as headings in order', async ({
    page,
  }) => {
    const h2s = await page.locator('main h2').allTextContents()
    expect(h2s.slice(0, TITLES.length).map((t) => t.trim())).toEqual(TITLES)
    const statement = discretionStatement()
    if (!statement) throw new Error('about.ts no longer carries the discretion sentence')
    expect(h2s[TITLES.length]?.trim()).toBe(statement)
    // No map, no address: nothing on the page is a link to a map service.
    await expect(page.locator('main a[href*="maps."], main a[href*="goo.gl/maps"]')).toHaveCount(0)
  })

  test('carries no review note in any environment; the PLACEHOLDER prefix is its only marker', async ({
    page,
  }) => {
    // Owner decision (Task 21): nothing note-like renders on a stub page.
    await expect(page.locator('main [data-notice]')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/\b(pending|review)\b/i)
    await expect(page.locator('main h1')).toHaveText(/^PLACEHOLDER — /)
  })

  test('renders six plates once for assistive tech and a hidden duplicate set', async ({
    page,
  }) => {
    const primary = page.locator(PRIMARY)
    await expect(primary).toHaveCount(PLATE_COUNT)
    await expect(page.locator(`${PRIMARY} figure`)).toHaveCount(PLATE_COUNT)
    const alts = await page
      .locator(`${PRIMARY} img`)
      .evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
    expect(alts).toEqual(CAROUSEL_KEYS.map((key) => MEDIA[key].alt))
    const captions = await page
      .locator(`${PRIMARY} figcaption > span:first-child`)
      .allTextContents()
    expect(captions).toEqual(RESIDENCES.plates.map((p) => p.caption))

    const duplicate = page.locator(DUPLICATE)
    await expect(duplicate).toHaveCount(PLATE_COUNT)
    const duplicateAlts = await page
      .locator(`${DUPLICATE} img`)
      .evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
    expect(duplicateAlts).toEqual(Array<string>(PLATE_COUNT).fill(''))
  })

  test('anchors the fourth frame to its top edge', async ({ page }) => {
    const position = await page
      .locator(`${PRIMARY} img`)
      .nth(3)
      .evaluate((el) => getComputedStyle(el).objectPosition)
    expect(position).toBe('50% 0%')
  })

  test('drifts the track on its own and slows under the pointer', async ({ page }, info) => {
    test.skip(info.project.name === PROJECTS.reducedMotion, 'the drift is gated by reduced motion')
    await scrollCarouselIntoView(page)
    const track = page.locator(TRACK)
    const before = translateX(await track.evaluate((el) => getComputedStyle(el).transform))
    await page.waitForTimeout(DRIFT_SAMPLE_MS)
    const after = translateX(await track.evaluate((el) => getComputedStyle(el).transform))
    expect(after).toBeLessThan(before)
    // No native scrollbar competes with the drift.
    expect(await page.locator(VIEWPORT).evaluate((el) => getComputedStyle(el).overflowX)).toBe(
      'hidden'
    )
  })

  test('stands still and scrolls natively under reduced motion', async ({ page }, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
    await scrollCarouselIntoView(page)
    const track = page.locator(TRACK)
    const before = await track.evaluate((el) => getComputedStyle(el).transform)
    await page.waitForTimeout(DRIFT_SAMPLE_MS)
    const after = await track.evaluate((el) => getComputedStyle(el).transform)
    expect(before).toBe('none')
    expect(after).toBe('none')

    const viewport = page.locator(VIEWPORT)
    const metrics = await viewport.evaluate((el) => ({
      overflowX: getComputedStyle(el).overflowX,
      snap: getComputedStyle(el).scrollSnapType,
      scrollable: el.scrollWidth > el.clientWidth,
    }))
    expect(metrics.overflowX).toBe('auto')
    expect(metrics.snap).toContain('x')
    expect(metrics.scrollable).toBe(true)
    // The single set: the duplicate is not rendered.
    for (const item of await page.locator(DUPLICATE).all()) await expect(item).toBeHidden()
    await viewport.evaluate((el) => el.scrollTo({ left: el.scrollWidth }))
    expect(await viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  })

  test('lists every amenity as a hairline row', async ({ page }) => {
    const rows = page.locator(`${AMENITIES} ol > li`)
    await expect(rows).toHaveCount(RESIDENCES.amenities.length)
    const text = await rows.locator('.t-body').allTextContents()
    expect(text).toEqual([...RESIDENCES.amenities])
    const border = await rows.first().evaluate((el) => getComputedStyle(el).borderBottomWidth)
    expect(border).toBe('1px')
  })

  test('links to the previous and next pages in reading order', async ({ page }) => {
    // On production the placeholder route is not in the reading order, so the
    // rail carries no neighbours (src/lib/prevNext.ts; helpers/siteEnv.ts).
    const { prev, next } = prevNextFor(ROUTE, readingOrder(EXPECTED_NAV))
    const rail = page.locator(RAIL)
    if (IS_PRODUCTION_SERVER) {
      expect(prev ?? next).toBeUndefined()
      await expect(rail.getByRole('link')).toHaveCount(0)
      return
    }
    if (!prev || !next) throw new Error('Residences should sit between two pages')
    await expect(rail.getByRole('link', { name: prev.label, exact: true })).toHaveAttribute(
      'href',
      prev.href
    )
    await expect(rail.getByRole('link', { name: next.label, exact: true })).toHaveAttribute(
      'href',
      next.href
    )
    await expect(rail.getByRole('link')).toHaveCount(2)
  })

  test('has no serious axe violations in the page', async ({ page }) => {
    await revealAll(page)
    // Scoped to <main>: the scroll rail numeral and the footer marquee are
    // chrome outside this route (about.spec.ts; ledger, Task 8 findings).
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
  })

  test('captures the settled page', async ({ page }) => {
    await revealAll(page)
    const path = await screenshotRoute(page, 'residences')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })
})
