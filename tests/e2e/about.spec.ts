/**
 * /about — the T2 Interior template (Task 11). docs/05 §T2, docs/09 §2.
 *
 * Every project: the h1, every section title as a heading in document order,
 * the plates' alt text, the prev/next rail, a clean console, axe on the whole
 * document, and a full-page capture taken after the reveals have run.
 * Desktop projects: the sticky index is visible and an item jumps to its
 * section. Narrow projects: the index is hidden.
 */
import { MEDIA } from '../../src/content/media'
import { routes } from '../../src/content/nav'
import { ABOUT } from '../../src/content/pages/about'
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

  test('shows the sticky index from 1024px and hides it below', async ({ page }, info) => {
    const index = page.locator(INDEX)
    if (!DESKTOP_PROJECTS.includes(info.project.name)) {
      await expect(index).toBeHidden()
      return
    }
    await expect(index).toBeVisible()
    const links = index.getByRole('link')
    await expect(links).toHaveCount(TITLES.length)
    await expect(links).toHaveText(
      TITLES.map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    )
    expect(await index.evaluate((el) => getComputedStyle(el).position)).toBe('sticky')
  })

  test('an index item scrolls to its section and marks it current', async ({ page }, info) => {
    test.skip(!DESKTOP_PROJECTS.includes(info.project.name), 'the index exists from 1024px')
    const target = ABOUT.sections[2]
    if (!target) throw new Error('about.ts has fewer than three sections')
    const link = page.locator(INDEX).getByRole('link').nth(2)
    await expect(link).toHaveAttribute('href', `#${target.id}`)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`#${target.id}$`))
    const top = await page
      .locator(`section#${target.id}`)
      .evaluate((el) => el.getBoundingClientRect().top)
    expect(Math.abs(top)).toBeLessThan(2)
    await expect(link).toHaveAttribute('aria-current', 'true')
    await expect(page.locator(INDEX).locator('[aria-current="true"]')).toHaveCount(1)
  })

  test('draws the mark and the two plates with content-layer alt text', async ({ page }) => {
    const ceiba = page.locator('.ceiba-figure svg.mark')
    await expect(ceiba).toHaveCount(1)
    await expect(page.locator('.ceiba-figure figcaption')).toHaveText(UI_INTERIOR.ceibaCaption)

    const images = page.locator('main img')
    await expect(images).toHaveCount(2)
    const alts = await images.evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
    expect(alts).toEqual([MEDIA['hero-poster'].alt, MEDIA['index-01'].alt])
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
