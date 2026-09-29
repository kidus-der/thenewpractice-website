/**
 * The remaining T2 pages (Task 18): /our-process, /a-personal-message,
 * /fees, /privacy, /terms. docs/05 §T2, docs/04 §6 "Timeline rule", docs/09 §2.
 *
 * Every route, every project: the h1, the section titles as headings in
 * document order, the opening ground, a clean console, axe scoped to <main>,
 * and a full-page capture after a reveal pass. Then what each page adds:
 * the process page's spreads and timeline rule, the letter's picture and
 * signature, the fees statement verbatim beside its picture, the legal
 * stubs' noindex, and the sitemap without the legal routes. Round 1 (R4a):
 * the process, letter and fees routes render their curations
 * (src/content/curated/) in the spread layout, so none carries an index.
 */
import { MEDIA } from '../../src/content/media'
import { NOINDEX_ROUTES, routes } from '../../src/content/nav'
import { FEES_CURATED } from '../../src/content/curated/fees'
import { PERSONAL_MESSAGE_CURATED as PERSONAL_MESSAGE } from '../../src/content/curated/personal-message'
import { PROCESS_CURATED as PROCESS } from '../../src/content/curated/process'
import { FEES } from '../../src/content/pages/fees'
import { PRIVACY, TERMS } from '../../src/content/pages/legal'
import type { Page as PageContent } from '../../src/content/schemas'
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

type Route = Readonly<{ path: string; name: string; content: PageContent }>

const ROUTES: readonly Route[] = [
  { path: routes.process, name: 'process', content: PROCESS },
  { path: routes.personalMessage, name: 'personal-message', content: PERSONAL_MESSAGE },
  { path: routes.fees, name: 'fees', content: FEES_CURATED },
  { path: routes.privacy, name: 'privacy', content: PRIVACY },
  { path: routes.terms, name: 'terms', content: TERMS },
]

const INDEX = `nav[aria-label="${UI_INTERIOR.indexLabel}"]`
const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`
const FILL = '.day-timeline__fill'
const MARKER = '.day-timeline__marker'
const DAY_SECTION = 'a-typical-day'
const PLACEHOLDER = 'PLACEHOLDER'

const WIDE_PROJECTS: readonly string[] = [
  PROJECTS.desktop,
  PROJECTS.wide,
  PROJECTS.reducedMotion,
  PROJECTS.webkit,
]
/** The process pictures in render order (src/app/our-process/page.tsx). */
const PROCESS_PICTURES = [
  'process-first-conversation',
  'process-lead-clinician',
  'process-typical-day',
  'process-family',
  'process-nutrition',
] as const
/** The projects where the timeline scrubs: at least 1024px wide, motion allowed. */
const SCRUB_PROJECTS: readonly string[] = [PROJECTS.desktop, PROJECTS.wide, PROJECTS.webkit]
/** The rule follows the reading line at 70% of the viewport (DayTimeline.tsx). */
const READING_LINE = 0.7
const SCRUB_SETTLE_MS = 400

const titlesOf = (content: PageContent): readonly string[] =>
  content.sections.map((s) => s.title).filter((t): t is string => Boolean(t))

/** `matrix(a, b, c, d, tx, ty)` → d, the vertical scale; `none` → 1. */
const scaleYOf = (transform: string): number => {
  if (transform === 'none') return 1
  const parts = transform
    .match(/matrix\(([^)]+)\)/)?.[1]
    ?.split(',')
    .map(Number)
  const d = parts?.[3]
  if (d === undefined || Number.isNaN(d)) throw new Error(`unexpected transform: ${transform}`)
  return d
}

for (const route of ROUTES) {
  test.describe(route.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path)
      await settleMotion(page)
    })

    test('opens on bone with the page title as the only h1', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(route.content.title)
      await expect(page.locator('main > :first-child')).toHaveAttribute('data-ground', 'light')
      expectNoConsoleErrors(page)
    })

    test('renders every section title as a heading, in document order', async ({ page }) => {
      const titles = titlesOf(route.content)
      const h2s = await page.locator('main h2').allTextContents()
      // The closing band adds one h2 after the content; the content comes first, in order.
      expect(h2s.slice(0, titles.length).map((t) => t.trim())).toEqual(titles)
      for (const section of route.content.sections) {
        await expect(page.locator(`section#${section.id}`)).toHaveCount(1)
      }
    })

    test('has no serious axe violations in the page', async ({ page }) => {
      await revealAll(page)
      // Scoped to <main> as about.spec.ts is: the scroll rail and the footer
      // are chrome with their own specs (footer.spec.ts).
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
    })

    test('captures the settled page', async ({ page }) => {
      await revealAll(page)
      const path = await screenshotRoute(page, route.name)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })
  })
}

test.describe('our-process', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.process)
    await settleMotion(page)
  })

  test('carries no sticky index and alternates its pictures beside the text', async ({
    page,
  }, info) => {
    await expect(page.locator(INDEX)).toHaveCount(0)
    const spreads = page.locator('section[data-side]')
    await expect(spreads).toHaveCount(PROCESS_PICTURES.length)
    const sides = await spreads.evaluateAll((els) => els.map((el) => el.getAttribute('data-side')))
    expect(sides).toEqual(PROCESS_PICTURES.map((_, i) => (i % 2 === 0 ? 'start' : 'end')))
    if (!WIDE_PROJECTS.includes(info.project.name)) return
    const beside = await spreads.evaluateAll((els) =>
      els.map((el) => {
        const text = el.querySelector('.content-section__body')?.getBoundingClientRect()
        const plate = el.querySelector('.content-section__spread-plate')?.getBoundingClientRect()
        if (!text || !plate) return false
        return plate.top < text.bottom && text.top < plate.bottom
      })
    )
    expect(beside).toEqual(PROCESS_PICTURES.map(() => true))
  })

  test('renders the day as the timeline with every paragraph as a marker', async ({ page }) => {
    const day = PROCESS.sections.find((s) => s.id === DAY_SECTION)
    if (!day) throw new Error(`process.ts has no ${DAY_SECTION}`)
    const markers = page.locator(`section#${DAY_SECTION} ${MARKER}`)
    await expect(markers).toHaveCount(day.paragraphs.length)
    await expect(markers).toHaveText(day.paragraphs)
    await expect(page.locator(`section#${DAY_SECTION}`)).toHaveAttribute('data-ground', 'mid')
  })

  test('draws the brass rule 1:1 with scroll', async ({ page }, info) => {
    test.skip(!SCRUB_PROJECTS.includes(info.project.name), 'scrubbed on desktop with motion')
    const fill = page.locator(FILL)
    const before = scaleYOf(await fill.evaluate((el) => getComputedStyle(el).transform))
    expect(before).toBe(0)

    // Scroll so the reading line sits halfway down the list.
    await page.evaluate(
      ({ selector, line }) => {
        const list = document.querySelector(selector)?.parentElement
        if (!list) throw new Error('no timeline')
        const rect = list.getBoundingClientRect()
        window.scrollTo(0, window.scrollY + rect.top + rect.height / 2 - window.innerHeight * line)
      },
      { selector: FILL, line: READING_LINE }
    )
    await page.waitForTimeout(SCRUB_SETTLE_MS)
    const halfway = scaleYOf(await fill.evaluate((el) => getComputedStyle(el).transform))
    expect(halfway).toBeGreaterThan(0.3)
    expect(halfway).toBeLessThan(0.7)

    const lit = await page.locator(`${MARKER}[data-passed="true"]`).count()
    const all = await page.locator(MARKER).count()
    expect(lit).toBeGreaterThan(0)
    expect(lit).toBeLessThan(all)

    // Past the list: the rule is complete and every marker is lit.
    await page.evaluate((selector) => {
      const list = document.querySelector(selector)?.parentElement
      if (!list) throw new Error('no timeline')
      window.scrollTo(0, window.scrollY + list.getBoundingClientRect().bottom)
    }, FILL)
    await page.waitForTimeout(SCRUB_SETTLE_MS)
    const after = scaleYOf(await fill.evaluate((el) => getComputedStyle(el).transform))
    expect(after).toBe(1)
    await expect(page.locator(`${MARKER}[data-passed="true"]`)).toHaveCount(all)
  })

  test('renders the rule complete and every marker in ink under reduced motion', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
    const fill = page.locator(FILL)
    expect(scaleYOf(await fill.evaluate((el) => getComputedStyle(el).transform))).toBe(1)
    const colours = await page
      .locator(MARKER)
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).color))
    const ink = await page
      .locator(`section#${DAY_SECTION} h2`)
      .evaluate((el) => getComputedStyle(el).color)
    for (const colour of colours) expect(colour).toBe(ink)
  })

  test('shows one picture per spread, with content-layer alt text', async ({ page }) => {
    const images = page.locator('main img')
    await expect(images).toHaveCount(PROCESS_PICTURES.length)
    const alts = await images.evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
    expect(alts).toEqual(PROCESS_PICTURES.map((key) => MEDIA[key].alt))
  })

  test('links to its neighbours in reading order', async ({ page }) => {
    const { prev, next } = prevNextFor(routes.process)
    if (!prev || !next) throw new Error('Our Process should sit between two pages')
    const rail = page.locator(RAIL)
    await expect(rail.getByRole('link', { name: prev.label, exact: true })).toHaveAttribute(
      'href',
      prev.href
    )
    await expect(rail.getByRole('link', { name: next.label, exact: true })).toHaveAttribute(
      'href',
      next.href
    )
  })
})

test.describe('a-personal-message', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.personalMessage)
    await settleMotion(page)
  })

  test('closes with the valediction and the signature block', async ({ page }) => {
    const letter = PERSONAL_MESSAGE.sections[0]
    if (!letter) throw new Error('personal-message.ts has no letter section')
    const { name, credentials, role, organisation } = PERSONAL_MESSAGE.signature
    const signature = page.locator('.content-section__signature')
    await expect(signature).toHaveCount(1)
    await expect(signature).toContainText(letter.paragraphs.at(-1) ?? '')
    await expect(signature).toContainText(`${name}, ${credentials}`)
    await expect(signature).toContainText(role)
    await expect(signature).toContainText(organisation ?? '')
    // The valediction lives in the signature, not in the prose.
    const prose = page.locator('.content-section__prose p')
    await expect(prose).toHaveCount(letter.paragraphs.length - 1)
    await expect(page.locator('main > :first-child')).toContainText(PERSONAL_MESSAGE.eyebrow ?? '')
    // Round 1: the letter beside the hand writing one.
    await expect(page.locator('main img')).toHaveCount(1)
    await expect(page.locator('main img')).toHaveAttribute('alt', MEDIA['personal-message'].alt)
    await expect(page.locator('section#letter')).toHaveAttribute('data-side', 'start')
  })

  test('carries a rail: Our Process before it, Fees after (the footer Practice order)', async ({
    page,
  }) => {
    const { prev, next } = prevNextFor(routes.personalMessage)
    expect(prev?.href).toBe(routes.process)
    expect(next?.href).toBe(routes.fees)
    const rail = page.locator(RAIL)
    await expect(rail.getByRole('link', { name: prev?.label ?? '', exact: true })).toHaveAttribute(
      'href',
      routes.process
    )
    await expect(rail.getByRole('link', { name: next?.label ?? '', exact: true })).toHaveAttribute(
      'href',
      routes.fees
    )
  })
})

test.describe('fees', () => {
  test('is the statement, verbatim, beside its picture under the heading Cost', async ({
    page,
  }) => {
    await page.goto(routes.fees)
    await settleMotion(page)
    const statement = FEES.sections[0]?.paragraphs[0]
    if (!statement) throw new Error('fees.ts has no statement')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FEES.title)
    const prose = page.locator('.content-section__prose p')
    await expect(prose).toHaveCount(1)
    await expect(prose).toHaveText(statement)
    // Round 1 (R4a): the statement is short and renders verbatim; its picture beside it.
    await expect(page.locator('main img')).toHaveCount(1)
    await expect(page.locator('main img')).toHaveAttribute('alt', MEDIA.fees.alt)
    await expect(page.locator('section#cost')).toHaveAttribute('data-side', 'start')
    // The rail leads back to the letter and on to the services (ledger, Task 18 triage).
    const { prev, next } = prevNextFor(routes.fees)
    expect(prev?.href).toBe(routes.personalMessage)
    expect(next?.href).toBe(routes.clinicalServices)
    await expect(page.locator(RAIL).getByRole('link')).toHaveCount(2)
  })
})

for (const route of ROUTES.filter((r) => NOINDEX_ROUTES.has(r.path))) {
  test.describe(`${route.name} stub`, () => {
    test('carries only the PLACEHOLDER prefix as its marker and is kept out of the index', async ({
      page,
    }) => {
      await page.goto(route.path)
      await settleMotion(page)
      // Owner decision (Task 21): no review note in any environment; the stub,
      // its noindex and its PLACEHOLDER headings are the same everywhere.
      await expect(page.locator('main')).not.toContainText(/pending client review/i)
      await expect(page.locator('main [data-notice]')).toHaveCount(0)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
      const headings = await page.locator('main h1, main h2').allTextContents()
      const stub = headings.filter((h) => h.startsWith(PLACEHOLDER))
      expect(stub).toHaveLength(route.content.sections.length + 1)
      // Headings only: no body sentence, no lead (owner decision, Task 21).
      await expect(page.locator('main p.t-body, main .content-section__prose p')).toHaveCount(0)
      await expect(page.locator('main')).not.toContainText(/\b(pending|counsel|in force)\b/i)
    })
  })
}

test('the sitemap never lists the legal stubs', async ({ request }) => {
  // On the dev and staging servers the sitemap is empty by design; against a
  // SITE_ENV=production server this asserts the NOINDEX_ROUTES filter.
  const response = await request.get('/sitemap.xml')
  expect(response.ok()).toBe(true)
  const xml = await response.text()
  for (const path of NOINDEX_ROUTES) expect(xml).not.toContain(`${path}</loc>`)
})
