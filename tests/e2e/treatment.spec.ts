/**
 * The T3 Treatment template on four of its eleven routes (Task 13). docs/05
 * §T3, docs/09 §2 and §5.
 *
 * Every project, four fixtures: the h1 on bone; the body's section order and
 * numerals equal to `serviceBlocks()`; list counts equal to the content;
 * definitions rendered open with nothing expandable; three related rows in
 * wrap-around order; the rail to the neighbouring services; the JSON-LD
 * parsing with a MedicalWebPage about the service and no rating or review;
 * axe scoped to <main>; full-page captures of two fixtures after a reveal
 * pass. Desktop project only: every one of the eleven routes answers 200
 * with its title as the h1.
 */
import { routes, serviceHref } from '../../src/content/nav'
import { SERVICES } from '../../src/content/services'
import { UI_INTERIOR, UI_TREATMENT } from '../../src/content/ui'
import { capitaliseFirst } from '../../src/lib/interior'
import {
  relatedServices,
  serviceBlocks,
  servicePrevNext,
  type TreatmentBlock,
} from '../../src/lib/treatment'
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

const FIXTURE_SLUGS = [
  'addiction-treatment',
  'trauma-and-complex-trauma',
  'inner-child-work',
  'family-program',
] as const
/** The two fixtures captured at every width and under reduced motion. */
const CAPTURED: readonly string[] = ['addiction-treatment', 'trauma-and-complex-trauma']

const service = (slug: string) => {
  const found = SERVICES.find((s) => s.slug === slug)
  if (!found) throw new Error(`services.ts has no ${slug}`)
  return found
}

const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`
const BAND_ID = 'enquire-band'

const ofKind = <K extends TreatmentBlock['kind']>(
  blocks: readonly TreatmentBlock[],
  kind: K
): readonly Extract<TreatmentBlock, { kind: K }>[] =>
  blocks.filter((b): b is Extract<TreatmentBlock, { kind: K }> => b.kind === kind)

type JsonLdNode = { '@type'?: string | string[]; [key: string]: unknown }

for (const slug of FIXTURE_SLUGS) {
  const fixture = service(slug)
  const route = serviceHref(slug)
  const blocks = serviceBlocks(fixture)

  test.describe(`treatment: ${slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route)
      await settleMotion(page)
    })

    test('opens on bone with the service title as the only h1 and its numeral', async ({
      page,
    }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(fixture.title)
      const intro = page.locator('main > :first-child')
      await expect(intro).toHaveAttribute('data-ground', 'light')
      await expect(intro).toHaveAttribute('data-n', String(fixture.order).padStart(2, '0'))
      await expect(intro.locator('.page-intro__lead')).toHaveText(fixture.intro[0] ?? '')
      expectNoConsoleErrors(page)
    })

    test('renders the blocks in the document order serviceBlocks() derives', async ({ page }) => {
      const sections = page.locator('main > section[id]')
      const ids = await sections.evaluateAll((els) => els.map((el) => el.id))
      expect(ids).toEqual([...blocks.map((b) => b.id), BAND_ID])
      const numerals = await sections.evaluateAll((els) => els.map((el) => el.dataset.n))
      expect(numerals).toEqual([
        ...blocks.map((b) => b.numeral),
        String(blocks.length + 1).padStart(2, '0'),
      ])
      const grounds = await sections.evaluateAll((els) => els.map((el) => el.dataset.ground))
      expect(grounds).toEqual([...blocks.map((b) => b.ground), 'dark'])
    })

    test('never widens the document past the viewport', async ({ page }) => {
      await revealAll(page)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBe(0)
    })

    test('lists every item the document lists, under its own heading', async ({ page }) => {
      for (const block of ofKind(blocks, 'treats')) {
        const section = page.locator(`section#${block.id}`)
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(
          block.heading ?? UI_TREATMENT.treatsHeading
        )
        await expect(section.locator('.hairline-list__rows li')).toHaveCount(block.items.length)
        await expect(section.locator('.hairline-list__rows li')).toHaveText([...block.items])
      }
      for (const block of ofKind(blocks, 'mayInclude')) {
        const section = page.locator(`section#${block.id}`)
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(
          block.heading ?? UI_TREATMENT.mayIncludeHeading
        )
        const rows = section.locator('ol.numbered-index > li')
        await expect(rows).toHaveCount(block.items.length)
        await expect(rows.locator('.numbered-index__item')).toHaveText([...block.items])
        await expect(rows.first().locator('.numbered-index__numeral')).toHaveText('01')
        const hidden = await rows
          .locator('.numbered-index__numeral')
          .evaluateAll((els) => els.every((el) => el.getAttribute('aria-hidden') === 'true'))
        expect(hidden).toBe(true)
      }
    })

    test('renders definitions open, with nothing to expand', async ({ page }) => {
      await revealAll(page)
      const definitionBlocks = ofKind(blocks, 'definitions')
      const expected = definitionBlocks.reduce(
        (n, b) => n + (b.section.definitions?.length ?? 0),
        0
      )
      await expect(page.locator('main dl dt')).toHaveCount(expected)
      await expect(page.locator('main [aria-expanded]')).toHaveCount(0)
      await expect(page.locator('main details')).toHaveCount(0)
      for (const block of definitionBlocks) {
        const section = page.locator(`section#${block.id}`)
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(
          block.section.title ?? ''
        )
        const descriptions = section.locator('dd')
        // The first character is capitalised at render; the module stays verbatim (Task 19).
        await expect(descriptions).toHaveText(
          (block.section.definitions ?? []).map((d) => capitaliseFirst(d.description))
        )
        for (const dd of await descriptions.all()) await expect(dd).toBeVisible()
      }
    })

    test('renders the subsections as titled sections with their prose and lists', async ({
      page,
    }) => {
      for (const block of ofKind(blocks, 'subsection')) {
        const section = page.locator(`section#${block.id}`)
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(
          block.section.title ?? ''
        )
        await expect(section.locator('.content-section__prose p')).toHaveCount(
          block.section.paragraphs.length
        )
        if (block.section.list?.length) {
          await expect(section.locator('.hairline-list__rows li')).toHaveText([
            ...block.section.list,
          ])
        }
      }
    })

    test('offers the next three services in order, wrapping past the last', async ({ page }) => {
      const related = page.locator(`section#${slug}-related`)
      await expect(related.getByRole('heading', { level: 2 })).toHaveText(
        UI_TREATMENT.relatedHeading
      )
      const links = related.locator('.index-list__row').getByRole('link')
      await expect(links).toHaveCount(3)
      const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(hrefs).toEqual(relatedServices(slug).map((s) => serviceHref(s.slug)))
      const names = await links.evaluateAll((els) =>
        els.map((el) => el.querySelector('.index-list__title')?.textContent?.trim())
      )
      expect(names).toEqual(relatedServices(slug).map((s) => s.title))
    })

    test('links the rail to the previous and next services', async ({ page }) => {
      const { prev, next } = servicePrevNext(slug)
      if (!prev || !next) throw new Error('every service has two neighbours')
      const rail = page.locator(RAIL)
      await expect(rail.getByRole('link')).toHaveCount(2)
      await expect(rail.getByRole('link', { name: prev.label, exact: true })).toHaveAttribute(
        'href',
        prev.href
      )
      await expect(rail.getByRole('link', { name: next.label, exact: true })).toHaveAttribute(
        'href',
        next.href
      )
    })

    test('carries a MedicalWebPage about the service and makes no claim', async ({ page }) => {
      const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
      if (!raw) throw new Error('no JSON-LD script')
      const nodes = JSON.parse(raw) as JsonLdNode[]
      expect(Array.isArray(nodes)).toBe(true)
      const medical = nodes.find((n) => n['@type'] === 'MedicalWebPage')
      expect(medical).toMatchObject({
        name: `${fixture.title} — The New Practice`,
        about: { '@type': 'Thing', name: fixture.title },
      })
      expect(String(medical?.url)).toMatch(new RegExp(`${route}$`))
      const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList')
      expect(crumbs).toMatchObject({
        itemListElement: [
          { position: 1, name: 'Home' },
          { position: 2, name: 'Clinical Services' },
          { position: 3, name: fixture.title },
        ],
      })
      expect(raw).not.toMatch(/aggregateRating|"review"|priceRange|openingHours/i)
    })

    test('has no serious axe violations in the page', async ({ page }) => {
      await revealAll(page)
      // Scoped to <main>: the scroll rail numeral and the footer marquee are
      // chrome findings owned by Task 19 (ledger, Tasks 8 and 11).
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
    })

    test('captures the settled page', async ({ page }) => {
      test.skip(!CAPTURED.includes(slug), 'two fixtures are captured')
      await revealAll(page)
      const path = await screenshotRoute(page, `treatment-${slug}`)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })
  })
}

test.describe('treatment: every service', () => {
  test('answers on all eleven routes with the service title as the h1', async ({ page }, info) => {
    test.skip(info.project.name !== PROJECTS.desktop, 'one project is enough for a smoke test')
    for (const item of SERVICES) {
      const response = await page.goto(serviceHref(item.slug))
      expect(response?.status(), item.slug).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(item.title)
    }
    expectNoConsoleErrors(page)
  })

  test('answers 404 for a slug that is not a service', async ({ page }, info) => {
    test.skip(info.project.name !== PROJECTS.desktop, 'one project is enough for a smoke test')
    const response = await page.goto(`${routes.clinicalServices}/not-a-service`)
    expect(response?.status()).toBe(404)
  })
})
