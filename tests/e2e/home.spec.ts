/**
 * / — the T1 Home template (Task 16). docs/05 §T1, docs/04 §6, docs/09 §1–2.
 *
 * Every project: the client's title as the only h1, the section headings in
 * document order, the triad, the twelve conditions as links, the five
 * pillars, the manifesto, the founder block, a clean console, axe scoped to
 * main, and a full-page capture after a reveal pass. Desktop: the poster is
 * the largest contentful paint, the loop plays over it, the gradient mounts,
 * the hover plate follows the pointer. Reduced motion: poster only, no
 * video, no pin, no plate.
 */
import { BRAND } from '../../src/content/brand'
import { MEDIA, VIDEO } from '../../src/content/media'
import { routes } from '../../src/content/nav'
import { HOME } from '../../src/content/pages/home'
import { UI_HOME } from '../../src/content/ui'
import { homeSections, triadLines } from '../../src/lib/home'
import {
  AMBIENT_GRADIENT_EXPECTED,
  PROJECTS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  isProjectName,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'

const ROUTE = routes.home
const LOOP = VIDEO['hero-surf']
const POSTER = MEDIA[LOOP.poster]
const SECTIONS = homeSections(HOME)
const TRIAD = triadLines(SECTIONS.statement.subtitle ?? '')
const CONDITIONS = SECTIONS.conditions.list ?? []
const PILLARS = (SECTIONS.philosophy.definitions ?? []).map((d) => d.term)
const H2_TITLES = HOME.sections.map((s) => s.title).filter((t): t is string => Boolean(t))
const PLATE_PROJECTS: readonly string[] = [PROJECTS.desktop, PROJECTS.wide]
const INDEX_PROJECTS: readonly string[] = [PROJECTS.desktop, PROJECTS.wide, PROJECTS.reducedMotion]
const INDEX = `nav[aria-label="${UI_HOME.pillarsIndexLabel}"]`
/** Reveals run at --d-slow with a stagger; generous headroom after the last scroll step. */
const REVEAL_SETTLE_MS = 2500
const SCROLL_STEP_VH = 0.6
/** Long enough for the buffered LCP entries to be delivered to the observer. */
const LCP_SETTLE_MS = 300
/** docs/09 §1: the CI gate for the largest contentful paint. */
const LCP_BUDGET_MS = 2500
/** The hero's largest paint must land with first paint, not after the veil (ledger, Task 4). */
const LCP_AFTER_FCP_MAX_MS = 250

type LcpSummary = Readonly<{ tag: string | null; url: string; size: number; time: number }>

/**
 * Scroll the whole page once so every once:true reveal has fired, then
 * return to the top and wait for the tweens to land (local copy of the
 * about spec's helper until it moves into tests/e2e/helpers).
 */
async function revealAll(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async (stepVh) => {
    const step = window.innerHeight * stepVh
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
    const max = () => document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= max(); y += step) {
      window.scrollTo(0, y)
      await frame()
      await frame()
    }
    window.scrollTo(0, max())
    await frame()
    window.scrollTo(0, 0)
    await frame()
  }, SCROLL_STEP_VH)
  await page.waitForTimeout(REVEAL_SETTLE_MS)
}

/** The last buffered largest-contentful-paint entry, or null when none was recorded. */
async function readLcp(page: import('@playwright/test').Page): Promise<LcpSummary | null> {
  return page.evaluate(
    (settle) =>
      new Promise<LcpSummary | null>((resolve) => {
        const entries: PerformanceEntry[] = []
        const observer = new PerformanceObserver((list) => entries.push(...list.getEntries()))
        observer.observe({ type: 'largest-contentful-paint', buffered: true })
        setTimeout(() => {
          observer.disconnect()
          const last = entries.at(-1) as
            | (PerformanceEntry & { element?: Element | null; url?: string; size?: number })
            | undefined
          resolve(
            last
              ? {
                  tag: last.element?.tagName ?? null,
                  url: last.url ?? '',
                  size: last.size ?? 0,
                  time: last.startTime,
                }
              : null
          )
        }, settle)
      }),
    LCP_SETTLE_MS
  )
}

test.describe('home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test('opens on canopy with the client title as the only h1', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible()
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText(HOME.hero.title)
    await expect(page.locator('main > :first-child')).toHaveAttribute('data-ground', 'dark')
    // the trademark once per page, in the hero lockup (ledger, Task 1 triage)
    await expect(page.locator('.hero__tm')).toHaveText(BRAND.trademark)
    await expect(page.locator('.hero__wordmark')).toContainText(BRAND.nameUpper)
    expectNoConsoleErrors(page)
  })

  test('lands the largest contentful paint with first paint, the poster already drawn', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== PROJECTS.desktop, 'measured on desktop-1280')
    // Chromium leaves a full-viewport image out of the LCP candidates (it reads
    // as a background), so the reported element is the hero title; what matters
    // is that it paints at first paint rather than after the veil, and that the
    // poster is complete beneath it.
    const lcp = await readLcp(page)
    expect(lcp, 'a largest-contentful-paint entry').not.toBeNull()
    expect(['IMG', 'H1']).toContain(lcp?.tag)
    expect(lcp?.time).toBeLessThan(LCP_BUDGET_MS)
    const fcp = await page.evaluate(
      () => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
    )
    expect((lcp?.time ?? 0) - fcp).toBeLessThanOrEqual(LCP_AFTER_FCP_MAX_MS)
    const poster = page.locator('.hero__poster')
    await expect(poster).toHaveAttribute('fetchpriority', 'high')
    expect(
      await poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)
    ).toBe(true)
  })

  test('plays the loop over the poster when motion is allowed', async ({ page }, info) => {
    test.skip(
      info.project.name === PROJECTS.reducedMotion,
      'the loop never loads under reduced motion'
    )
    const video = page.locator('video')
    await expect(video).toHaveCount(1)
    await expect(video).toHaveAttribute('preload', 'metadata')
    await expect(video).toHaveAttribute('poster', POSTER.src)
    await expect(video).toHaveAttribute('playsinline', '')
    await expect(video).toHaveAttribute('loop', '')
    const sources = await video
      .locator('source')
      .evaluateAll((els) => els.map((el) => [el.getAttribute('type'), el.getAttribute('src')]))
    expect(sources).toEqual([
      ['video/webm', LOOP.webm],
      ['video/mp4', LOOP.mp4],
    ])
    await expect
      .poll(
        () => video.evaluate((v: HTMLVideoElement) => v.muted && !v.paused && v.readyState >= 3),
        {
          timeout: 20_000,
        }
      )
      .toBe(true)
    // faded in over the poster, never cut
    await expect
      .poll(() => video.evaluate((v) => getComputedStyle(v).opacity), { timeout: 20_000 })
      .toBe('1')
    // the poster is a real, prioritised image beneath it
    await expect(page.locator('.hero__poster')).toHaveAttribute('fetchpriority', 'high')
  })

  test('shows the poster alone under reduced motion', async ({ page }, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('video')).toHaveCount(0)
    await expect(page.locator('.hero__poster')).toBeVisible()
    // no settle: the media wrapper carries no transform
    expect(
      await page.locator('.hero__media').evaluate((el) => getComputedStyle(el).transform)
    ).toBe('none')
    // nothing is pinned
    await expect(page.locator('.pin-spacer')).toHaveCount(0)
  })

  test('mounts the ambient gradient only on a motion-allowed desktop', async ({ page }, info) => {
    const project = info.project.name
    if (!isProjectName(project)) throw new Error(`Unknown Playwright project "${project}"`)

    const canvas = page.locator('canvas')

    if (AMBIENT_GRADIENT_EXPECTED[project]) {
      // The chunk is lazy: the canvas appears once three + R3F have loaded.
      await expect(canvas).toHaveCount(1)
      return
    }

    // Absence has to be asserted after the page has had every chance to load it.
    await page.waitForLoadState('networkidle')
    await expect(canvas).toHaveCount(0)
  })

  test('renders the section headings in document order', async ({ page }) => {
    const h2s = await page.locator('main h2').allTextContents()
    expect(h2s.map((t) => t.trim())).toEqual(H2_TITLES)
    await expect(page.locator(`section#${SECTIONS.manifesto.id} h3`).first()).toHaveText(
      SECTIONS.manifesto.title ?? ''
    )
    for (const section of HOME.sections) {
      await expect(page.locator(`section#${section.id}`)).toHaveCount(1)
    }
  })

  test('sets the triad behind the ghosted mark, then the four paragraphs', async ({
    page,
  }, info) => {
    await expect(page.locator('.statement__line')).toHaveText(TRIAD)
    await expect(page.locator('.statement__mark')).toHaveCount(1)
    await expect(page.locator('.statement__prose p')).toHaveCount(
      SECTIONS.statement.paragraphs.length
    )
    const pinned = info.project.name !== PROJECTS.reducedMotion
    await expect(page.locator(`section#${SECTIONS.statement.id} .pin-spacer`)).toHaveCount(
      pinned ? 1 : 0
    )
  })

  test('lifts the last sentence of the long read as a pull line', async ({ page }) => {
    await expect(page.locator('.long-read__pull')).toHaveText(
      'Recovery succeeds when trust is never interrupted.'
    )
    await expect(page.locator('.long-read__prose p')).toHaveCount(
      SECTIONS.longRead.paragraphs.length
    )
  })

  test('lists the twelve conditions as links to the clinical services index', async ({ page }) => {
    const links = page.locator('.conditions__link')
    await expect(links).toHaveCount(CONDITIONS.length)
    await expect(page.locator('.conditions__label')).toHaveText(CONDITIONS)
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))
    expect(new Set(hrefs)).toEqual(new Set([routes.clinicalServices]))
  })

  test('shows the hover plate on a fine-pointer desktop only', async ({ page }, info) => {
    const plate = page.locator('.conditions__plate')
    if (!PLATE_PROJECTS.includes(info.project.name)) {
      await expect(plate).toHaveCount(0)
      return
    }
    const row = page.locator('.conditions__link').nth(2)
    await row.scrollIntoViewIfNeeded()
    await row.hover()
    await expect(plate).toHaveAttribute('data-shown', 'true')
    await expect(plate.locator('.conditions__frame.is-active img')).toHaveCount(1)
    await page.mouse.move(0, 0)
    await expect(plate).toHaveAttribute('data-shown', 'false')
  })

  test('sets the five pillars beside a sticky index from 1024px', async ({ page }, info) => {
    await expect(page.locator('.philosophy__term')).toHaveText(PILLARS)
    const index = page.locator(INDEX)
    if (!INDEX_PROJECTS.includes(info.project.name)) {
      await expect(index).toBeHidden()
      return
    }
    await expect(index).toBeVisible()
    await expect(index.getByRole('link')).toHaveText(
      PILLARS.map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    )
    expect(
      await page.locator('.philosophy__index').evaluate((el) => getComputedStyle(el).position)
    ).toBe('sticky')
  })

  test('scrubs the manifesto statement and flows the rest beneath', async ({ page }, info) => {
    const [statement, ...rest] = SECTIONS.manifesto.paragraphs
    await expect(page.locator('.manifesto__statement')).toHaveText(statement ?? '')
    await expect(page.locator('.manifesto__prose p')).toHaveText(rest)
    const pinned = info.project.name !== PROJECTS.reducedMotion
    await expect(page.locator(`section#${SECTIONS.manifesto.id} .pin-spacer`)).toHaveCount(
      pinned ? 1 : 0
    )
  })

  test('closes with the founder and the enquire action', async ({ page }) => {
    const address = page.locator(`section#${SECTIONS.conversation.id} address`)
    await expect(address).toContainText(BRAND.founder.name)
    await expect(address).toContainText(BRAND.founder.credentials)
    await expect(address).toContainText(BRAND.founder.role)
    await expect(address).toContainText(BRAND.locale)
    await expect(address.locator('a[href^="tel:"]')).toHaveAttribute(
      'href',
      `tel:${BRAND.phone.replace(/[^\d+]/g, '')}`
    )
    await expect(address.locator('a[href^="mailto:"]')).toHaveAttribute(
      'href',
      `mailto:${BRAND.email}`
    )
    const enquire = page.locator(`section#${SECTIONS.conversation.id} a[href="${routes.contact}"]`)
    await expect(enquire).toHaveCount(1)
    // the page closes here: no repeated enquire band before the footer
    await expect(page.locator('main .enquire-band')).toHaveCount(0)
  })

  test('renders no audio toggle while the client has no recording', async ({ page }) => {
    expect(HOME.hero.audioSrc).toBeNull()
    await expect(page.locator('.audio-toggle')).toHaveCount(0)
    await expect(page.locator('audio')).toHaveCount(0)
  })

  test('has no serious axe violations in the page', async ({ page }) => {
    await revealAll(page)
    // Scoped to <main>: the whole-document run fails on chrome that is not this
    // route's — the scroll rail numeral and the footer marquee (ledger, Tasks 8 and 11).
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
  })

  test('captures the settled page', async ({ page }) => {
    await revealAll(page)
    const path = await screenshotRoute(page, 'home')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })
})
