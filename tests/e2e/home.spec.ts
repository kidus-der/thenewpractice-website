/**
 * / — the T1 Home template (Task 16). docs/05 §T1, docs/04 §6, docs/09 §1–2.
 *
 * Every project: the client's title as the only h1, the section headings in
 * document order, the triad, the twelve conditions as links, the five
 * pillars, the manifesto, the founder block, a clean console, axe scoped to
 * main, and a full-page capture after a reveal pass. Every project: one
 * travelling glow follows keyboard focus over the conditions. Desktop: the
 * poster is the largest contentful paint, the loop plays over it, the
 * gradient mounts, the glow follows the pointer. Reduced motion: poster
 * only, no video, no pin, the glow placed rather than moved.
 */
import { BRAND } from '../../src/content/brand'
import { MEDIA, VIDEO } from '../../src/content/media'
import { routes } from '../../src/content/nav'
import { HOME } from '../../src/content/pages/home'
import { UI_HOME } from '../../src/content/ui'
import { homeSections, triadLines } from '../../src/lib/home'
import {
  AMBIENT_GRADIENT_EXPECTED,
  GLOW,
  GLOW_SETTLE_MS,
  PROJECTS,
  REDUCED_SETTLE_MS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  expectNoMissingMotionTargets,
  glowTranslate,
  isProjectName,
  revealAll,
  rowOffset,
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
/** Where a pointer hovers the rows; the keyboard part of the glow test runs everywhere. */
const HOVER_PROJECTS: readonly string[] = [PROJECTS.desktop, PROJECTS.wide, PROJECTS.webkit]
const CONDITIONS_GLOW = `.conditions__wrap ${GLOW}`
const CONDITION_ROWS = '.conditions__row'
const INDEX_PROJECTS: readonly string[] = [
  PROJECTS.desktop,
  PROJECTS.wide,
  PROJECTS.reducedMotion,
  PROJECTS.webkit,
]
const INDEX = `nav[aria-label="${UI_HOME.pillarsIndexLabel}"]`
/** Long enough for the buffered LCP entries to be delivered to the observer. */
const LCP_SETTLE_MS = 300
/** docs/09 §1: the CI gate for the largest contentful paint. */
const LCP_BUDGET_MS = 2500
/** The hero's largest paint must land with first paint, not after the veil (ledger, Task 4). */
const LCP_AFTER_FCP_MAX_MS = 250

type LcpSummary = Readonly<{ tag: string | null; url: string; size: number; time: number }>

type SampledWindow = Window & { __heroEyebrowOpacity?: number[] }

/**
 * Installed before navigation: from the frame `data-veil="done"` lands, the
 * eyebrow's computed opacity is sampled every frame. The post-veil fade is a
 * `from` tween, so the samples must open below 1 and close at 1 (docs/04 §4).
 */
function sampleEyebrowOpacity(): void {
  const samples: number[] = []
  ;(window as SampledWindow).__heroEyebrowOpacity = samples
  const tick = () => {
    if (document.documentElement.dataset.veil === 'done') {
      const eyebrow = document.querySelector('.hero__eyebrow')
      if (eyebrow) samples.push(Number(getComputedStyle(eyebrow).opacity))
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
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

  test('moves one travelling glow between the condition rows, no image anywhere', async ({
    page,
  }, info) => {
    const glow = page.locator(CONDITIONS_GLOW)
    await expect(glow).toHaveCount(1)
    await expect(glow).toHaveAttribute('aria-hidden', 'true')
    await expect(glow).toHaveCSS('opacity', '0')
    await expect(page.locator('.conditions img, .conditions .hover-plate')).toHaveCount(0)

    const rows = page.locator(CONDITION_ROWS)
    const third = rows.nth(2)
    await third.scrollIntoViewIfNeeded()

    // Keyboard, every project: focus takes the glow to the row.
    await third.getByRole('link').focus()
    await expect(glow).toHaveAttribute('data-row', '2')
    await expect(third).toHaveAttribute('data-active', 'true')
    const thirdAt = await third.evaluate(rowOffset)
    if (info.project.name === PROJECTS.reducedMotion) {
      // Placed by gsap.set in the focus commit, with no transition to wait on.
      await expect
        .poll(() => glow.evaluate(glowTranslate), { timeout: REDUCED_SETTLE_MS })
        .toEqual(thirdAt)
      const transition = await glow.evaluate((el) => getComputedStyle(el).transitionDuration)
      expect(parseFloat(transition)).toBeLessThanOrEqual(0.01)
      await expect(glow).toHaveCSS('opacity', '1')
    } else {
      await expect
        .poll(() => glow.evaluate(glowTranslate), { timeout: GLOW_SETTLE_MS })
        .toEqual(thirdAt)
      await expect.poll(() => glow.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    }

    // Tab to the next row: the same element travels there.
    await page.keyboard.press('Tab')
    await expect(glow).toHaveAttribute('data-row', '3')
    await expect(rows.nth(3)).toHaveAttribute('data-active', 'true')
    await expect(third).not.toHaveAttribute('data-active', 'true')
    await expect
      .poll(() => glow.evaluate(glowTranslate), { timeout: GLOW_SETTLE_MS })
      .toEqual(await rows.nth(3).evaluate(rowOffset))

    if (!HOVER_PROJECTS.includes(info.project.name)) return

    // Pointer, fine-pointer desktops: hover row three, then row seven; the
    // glow's transform follows over --d-base and the tick marks the row.
    // Focus holds the glow, so the row lets go of it before the pointer starts.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.mouse.move(0, 0)
    await expect.poll(() => glow.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
    await third.hover()
    await expect(glow).toHaveAttribute('data-row', '2')
    await expect
      .poll(() => glow.evaluate(glowTranslate), { timeout: GLOW_SETTLE_MS })
      .toEqual(thirdAt)
    const seventh = rows.nth(6)
    await seventh.hover()
    await expect(glow).toHaveAttribute('data-row', '6')
    await expect(seventh).toHaveAttribute('data-active', 'true')
    const seventhAt = await seventh.evaluate(rowOffset)
    expect(seventhAt.y).toBeGreaterThan(thirdAt.y)
    await expect
      .poll(() => glow.evaluate(glowTranslate), { timeout: GLOW_SETTLE_MS })
      .toEqual(seventhAt)
    const tick = await glow.evaluate((el) => {
      const after = getComputedStyle(el, '::after')
      return { width: parseFloat(after.width), color: after.backgroundColor }
    })
    const brass = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--accent)'
      document.body.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    expect(tick.width).toBeGreaterThan(0)
    expect(tick.color).toBe(brass)
    // Leaving the list eases the glow out.
    await page.mouse.move(0, 0)
    await expect.poll(() => glow.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
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

  test('fades the eyebrow and the cue in after the veil, every tween target found', async ({
    page,
  }, info) => {
    // The load in beforeEach: no tween was built against a selector that matched nothing.
    expectNoMissingMotionTargets(page)
    if (info.project.name === PROJECTS.reducedMotion) return // no entrance under reduced motion

    // A second cold load, with the veil's session flag cleared so it plays
    // again and the words wait for `veil:done` (Task 21b).
    await page.evaluate(() => sessionStorage.clear())
    await page.addInitScript(sampleEyebrowOpacity)
    await page.goto(ROUTE)
    await settleMotion(page)
    const samplesOf = () =>
      page.evaluate(() => (window as SampledWindow).__heroEyebrowOpacity ?? [])
    await expect.poll(async () => (await samplesOf()).at(-1), { timeout: 10_000 }).toBe(1)
    const samples = await samplesOf()
    expect(Math.min(...samples), 'the eyebrow opened below full opacity').toBeLessThan(1)
    await expect
      .poll(() => page.locator('.hero__cue').evaluate((el) => getComputedStyle(el).opacity))
      .toBe('1')
    expectNoMissingMotionTargets(page)
  })

  test('renders no audio toggle while the client has no recording', async ({ page }) => {
    expect(HOME.hero.audioSrc).toBeNull()
    await expect(page.locator('.audio-toggle')).toHaveCount(0)
    await expect(page.locator('audio')).toHaveCount(0)
  })

  test('has no serious axe violations in the page', async ({ page }) => {
    await revealAll(page)
    // The whole document: page, header, scroll rail and footer (Task 19).
    await expectNoAxeViolations(page, { impactAtLeast: 'serious' })
  })

  test('captures the settled page', async ({ page }) => {
    await revealAll(page)
    const path = await screenshotRoute(page, 'home')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })
})
