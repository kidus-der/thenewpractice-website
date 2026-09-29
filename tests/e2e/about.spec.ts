/**
 * /about — the T2 Interior template in the spread layout (Task 11; round 1,
 * R4a). docs/05 §T2, docs/09 §2.
 *
 * Every project: the h1, every curated section title as a heading in render
 * order, one picture per spread with content-layer alt text, the prev/next
 * rail, a clean console, axe on the whole document, and a full-page capture
 * taken after the reveals have run. The spread layout carries no sticky
 * index; from 1024px each picture stands beside its text, alternating sides,
 * and below it follows the text.
 */
import { MEDIA } from '../../src/content/media'
import { routes } from '../../src/content/nav'
import { ABOUT_CURATED as ABOUT } from '../../src/content/curated/about'
import { UI_INTERIOR } from '../../src/content/ui'
import { prevNextFor } from '../../src/lib/prevNext'
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

const ROUTE = routes.about
const INDEX = `nav[aria-label="${UI_INTERIOR.indexLabel}"]`
const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`
const DESKTOP_PROJECTS: readonly string[] = [
  PROJECTS.desktop,
  PROJECTS.wide,
  PROJECTS.reducedMotion,
  PROJECTS.webkit,
]

/** The pictures in render order (src/app/about/page.tsx). */
const PICTURES = [
  'about-ceiba',
  'about-practice',
  'about-founder',
  'about-place',
  'about-sea',
  'about-jungle',
] as const
/** Every section but the principles is a spread. */
const SPREAD_COUNT = PICTURES.length

/** The section titles in document order: top level, then each one's subsections. */
const TITLES = ABOUT.sections.map((s) => s.title).filter((t): t is string => Boolean(t))
const SUB_TITLES = ABOUT.sections
  .flatMap((s) => s.subsections ?? [])
  .map((s) => s.title)
  .filter((t): t is string => Boolean(t))

test.describe('about', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test('opens on bone with the page title as the only h1', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText(ABOUT.title)
    // docs/05 §Header: the first section names its ground so the server-rendered header reads ink.
    await expect(page.locator('main > :first-child')).toHaveAttribute('data-ground', 'light')
    expectNoConsoleErrors(page)
  })

  test('renders every section title as a heading, in document order', async ({ page }) => {
    const h2s = await page.locator('main h2').allTextContents()
    // The closing band adds one h2 after the content; the content comes first, in order.
    expect(h2s.slice(0, TITLES.length).map((t) => t.trim())).toEqual(TITLES)
    const h3s = await page.locator('main section section h3').allTextContents()
    expect(h3s.map((t) => t.trim())).toEqual(SUB_TITLES)
    for (const section of ABOUT.sections) {
      await expect(page.locator(`section#${section.id}`)).toHaveCount(1)
    }
  })

  test('carries no sticky index in the spread layout', async ({ page }) => {
    await expect(page.locator(INDEX)).toHaveCount(0)
    await expect(page.locator('main')).toHaveAttribute('data-layout', 'spread')
  })

  test('sets each picture beside its text from 1024px, alternating sides', async ({
    page,
  }, info) => {
    const spreads = page.locator('section[data-side]')
    await expect(spreads).toHaveCount(SPREAD_COUNT)
    const sides = await spreads.evaluateAll((els) => els.map((el) => el.getAttribute('data-side')))
    expect(sides).toEqual(PICTURES.map((_, i) => (i % 2 === 0 ? 'start' : 'end')))

    const boxes = await spreads.evaluateAll((els) =>
      els.map((el) => {
        const text = el.querySelector('.content-section__body')?.getBoundingClientRect()
        const plate = el.querySelector('.content-section__spread-plate')?.getBoundingClientRect()
        if (!text || !plate) throw new Error(`${el.id}: a spread without text or plate`)
        return { side: el.getAttribute('data-side'), text, plate }
      })
    )
    for (const { side, text, plate } of boxes) {
      if (!DESKTOP_PROJECTS.includes(info.project.name)) {
        expect(plate.top).toBeGreaterThanOrEqual(text.bottom - 1)
        continue
      }
      if (side === 'start') expect(plate.right).toBeLessThanOrEqual(text.left + 1)
      else expect(plate.left).toBeGreaterThanOrEqual(text.right - 1)
      // side by side: the two blocks share a band of the page
      expect(plate.top).toBeLessThan(text.bottom)
      expect(text.top).toBeLessThan(plate.bottom)
    }
  })

  test('draws the mark and one picture per spread with content-layer alt text', async ({
    page,
  }) => {
    const ceiba = page.locator('.ceiba-figure svg.mark')
    await expect(ceiba).toHaveCount(1)
    // No caption: nothing names the species or the Maya name (provenance audit, A1).
    await expect(page.locator('.ceiba-figure figcaption')).toHaveCount(0)

    const images = page.locator('main img')
    await expect(images).toHaveCount(PICTURES.length)
    const alts = await images.evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
    expect(alts).toEqual(PICTURES.map((key) => MEDIA[key].alt))
    for (const alt of alts) expect(alt?.trim().length).toBeGreaterThan(0)
  })

  test('links to the previous and next pages in reading order', async ({ page }) => {
    const { prev, next } = prevNextFor(ROUTE)
    if (!prev || !next) throw new Error('About should sit between two pages')
    const rail = page.locator(RAIL)
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
    // The whole document: page, header, sticky index, scroll rail and footer (Task 19).
    await expectNoAxeViolations(page, { impactAtLeast: 'serious' })
  })

  test('renders the mark complete under reduced motion', async ({ page }, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
    const offsets = await page
      .locator('.ceiba-figure .mark__stroke')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).strokeDashoffset))
    expect(offsets).toHaveLength(6)
    for (const offset of offsets) expect(parseFloat(offset)).toBe(0)
  })

  test('captures the settled page', async ({ page }) => {
    await revealAll(page)
    const path = await screenshotRoute(page, 'about')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })
})
