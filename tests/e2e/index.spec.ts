/**
 * The T6 Index template on its three routes (Task 12). docs/05 §T6, docs/09 §2.
 *
 * Every project, every route: the h1 and the intro sections in document
 * order; exactly 11 / 11 / 10 rows, each one link to the right collection
 * href; the travelling glow follows keyboard focus; no hover plate where no
 * row has an image, and only the title page's own plate where the route names
 * one (the team, round 1 R4c, with its rows straight beneath the title page);
 * axe scoped to <main>; a full-page capture after a reveal pass.
 * Reduced-motion project: the glow lands instantly.
 */
import { ASSESSMENTS, ASSESSMENTS_PAGE } from '../../src/content/assessments'
import { TEAM_CURATED, TEAM_PAGE_CURATED } from '../../src/content/curated/team'
import { MEDIA, type MediaKey } from '../../src/content/media'
import { routes } from '../../src/content/nav'
import { SERVICES, SERVICES_PAGE } from '../../src/content/services'
import { UI_INDEX, UI_INTERIOR } from '../../src/content/ui'
import {
  rowsFromAssessments,
  rowsFromServices,
  rowsFromTeam,
  type IndexRow,
} from '../../src/lib/indexPage'
import { prevNextFor } from '../../src/lib/prevNext'
import {
  GLOW,
  GLOW_SETTLE_MS,
  PROJECTS,
  REDUCED_SETTLE_MS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  glowY,
  revealAll,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'

type Fixture = Readonly<{
  name: string
  route: string
  title: string
  /** Section titles expected as h2s before the list, in order. */
  introTitles: readonly string[]
  /** Section titles expected as h2s after the list, in order. */
  afterTitles?: readonly string[]
  /** The title page's plate, when the route names one. */
  plate?: MediaKey
  rows: readonly IndexRow[]
}>

const titled = (sections: readonly { title?: string }[]): readonly string[] =>
  sections.flatMap((s) => (s.title ? [s.title] : []))

const FIXTURES: readonly Fixture[] = [
  {
    name: 'clinical-services',
    route: routes.clinicalServices,
    title: SERVICES_PAGE.title,
    introTitles: titled(SERVICES_PAGE.sections),
    rows: rowsFromServices(SERVICES),
  },
  {
    name: 'team',
    route: routes.team,
    title: TEAM_PAGE_CURATED.title,
    // round 1 (R4c): the names follow the title page directly; the roles after them
    introTitles: [],
    afterTitles: titled(TEAM_PAGE_CURATED.sections),
    plate: 'team-index',
    rows: rowsFromTeam(TEAM_CURATED),
  },
  {
    name: 'self-assessment',
    route: routes.selfAssessment,
    title: ASSESSMENTS_PAGE.title,
    introTitles: titled(
      ASSESSMENTS_PAGE.sections.filter((s) => s.id !== 'available-self-assessments')
    ),
    rows: rowsFromAssessments(ASSESSMENTS, UI_INDEX.assessmentLength),
  },
]

const ROWS = '.index-list__row'
const LIST_SECTION = 'section.index-section'
const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`

for (const fixture of FIXTURES) {
  test.describe(`index: ${fixture.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(fixture.route)
      await settleMotion(page)
    })

    test('opens on bone with the collection title as the only h1', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(fixture.title)
      await expect(page.locator('main > :first-child')).toHaveAttribute('data-ground', 'light')
      expectNoConsoleErrors(page)
    })

    test('never widens the document past the viewport', async ({ page }) => {
      await revealAll(page)
      // The glow bleeds past the list on both sides; below 1024px that bleed
      // must stay inside the page margin or the document grows a dark strip.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBe(0)
    })

    test('renders the intro sections as headings in document order', async ({ page }) => {
      const h2s = (await page.locator('main h2').allTextContents()).map((t) => t.trim())
      // The list section's eyebrow heading and the closing band's line are h2s too;
      // the document's own sections appear among them in order.
      const inOrder = fixture.introTitles.map((t) => h2s.indexOf(t))
      expect(inOrder.every((i) => i >= 0)).toBe(true)
      expect([...inOrder].sort((a, b) => a - b)).toEqual(inOrder)
      // the sections after the list follow its heading, in document order
      const listHeading = (await page.locator(`${LIST_SECTION} h2`).textContent())?.trim() ?? ''
      const after = (fixture.afterTitles ?? []).map((t) => h2s.indexOf(t))
      expect(after.every((i) => i > h2s.indexOf(listHeading))).toBe(true)
      expect([...after].sort((a, b) => a - b)).toEqual(after)
      if (fixture.introTitles.length === 0) {
        // nothing stands between the title page and the rows
        await expect(page.locator(`main > :nth-child(2)`)).toHaveAttribute(
          'id',
          `${fixture.name}-index`
        )
      }
    })

    test(`lists exactly ${fixture.rows.length} rows, each one link to its page`, async ({
      page,
    }) => {
      const rows = page.locator(ROWS)
      await expect(rows).toHaveCount(fixture.rows.length)
      const links = rows.getByRole('link')
      await expect(links).toHaveCount(fixture.rows.length)
      const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(hrefs).toEqual(fixture.rows.map((r) => r.href))
      const names = await links.evaluateAll((els) =>
        els.map((el) => el.querySelector('.index-list__title')?.textContent?.trim())
      )
      expect(names).toEqual(fixture.rows.map((r) => r.title))
      if (fixture.rows[0]?.meta) {
        await expect(rows.first().locator('.index-list__meta')).toHaveText(fixture.rows[0].meta)
      }
    })

    test('numbers the rows for the eye and hides the numerals from the reader', async ({
      page,
    }) => {
      const numerals = page.locator(`${ROWS} .index-list__numeral`)
      await expect(numerals.first()).toHaveText('01')
      await expect(numerals.last()).toHaveText(String(fixture.rows.length).padStart(2, '0'))
      const hidden = await numerals.evaluateAll((els) =>
        els.every((el) => el.getAttribute('aria-hidden') === 'true')
      )
      expect(hidden).toBe(true)
      // The ordered list carries the count for assistive technology.
      await expect(page.locator('ol.index-list__rows')).toHaveCount(1)
    })

    test('moves the one glow to the row that holds keyboard focus', async ({ page }, info) => {
      const glow = page.locator(`.index-list ${GLOW}`)
      await expect(glow).toHaveCount(1)
      await expect(glow).toHaveAttribute('aria-hidden', 'true')
      await expect(glow).toHaveCSS('opacity', '0')

      const third = page.locator(ROWS).nth(2).getByRole('link')
      await third.focus()
      await expect(glow).toHaveAttribute('data-row', '2')
      const rowTop = await third.evaluate((el) => (el.closest('li') as HTMLElement).offsetTop)

      if (info.project.name === PROJECTS.reducedMotion) {
        // Instant: placed by gsap.set in the focus commit. The computed style
        // catches up a few frames later because the global safety net gives
        // every element a 0.01ms transition (one frame was not always enough;
        // Task 19), so poll briefly — far inside the --d-base tween the other
        // projects run.
        await expect
          .poll(() => glow.evaluate(glowY), { timeout: REDUCED_SETTLE_MS })
          .toBeCloseTo(rowTop, 0)
        await expect(glow).toHaveCSS('opacity', '1')
      } else {
        await expect
          .poll(() => glow.evaluate(glowY), { timeout: GLOW_SETTLE_MS })
          .toBeCloseTo(rowTop, 0)
        await expect.poll(() => glow.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
      }

      await page.keyboard.press('Tab')
      await expect(glow).toHaveAttribute('data-row', '3')
      const fourthTop = await page
        .locator(ROWS)
        .nth(3)
        .evaluate((el) => (el as HTMLElement).offsetTop)
      await expect
        .poll(() => glow.evaluate(glowY), { timeout: GLOW_SETTLE_MS })
        .toBeCloseTo(fourthTop, 0)
    })

    test('shows no row plate when no row has an image, and only the title page’s own', async ({
      page,
    }) => {
      await expect(page.locator('.hover-plate')).toHaveCount(0)
      await expect(page.locator('.index-list__thumb')).toHaveCount(0)
      const images = page.locator('main img')
      if (!fixture.plate) {
        await expect(images).toHaveCount(0)
        return
      }
      await expect(images).toHaveCount(1)
      const plate = page.locator('main > :first-child figure img')
      await expect(plate).toHaveCount(1)
      await expect(plate).toHaveAttribute('alt', MEDIA[fixture.plate].alt)
    })

    test('links to the previous and next pages in reading order', async ({ page }) => {
      const { prev, next } = prevNextFor(fixture.route)
      const rail = page.locator(RAIL)
      const expected = [prev, next].filter((item) => item !== undefined)
      await expect(rail.getByRole('link')).toHaveCount(expected.length)
      for (const item of expected) {
        await expect(rail.getByRole('link', { name: item.label, exact: true })).toHaveAttribute(
          'href',
          item.href
        )
      }
    })

    test('has no serious axe violations in the page', async ({ page }) => {
      await revealAll(page)
      // Scoped to <main>: the chrome around it (scroll rail, footer) is
      // covered by its own specs (footer.spec.ts, keyboard.spec.ts).
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
    })

    test('captures the settled page', async ({ page }) => {
      await revealAll(page)
      const path = await screenshotRoute(page, `index-${fixture.name}`)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })
  })
}
