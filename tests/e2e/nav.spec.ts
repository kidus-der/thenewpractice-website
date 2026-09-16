/**
 * Header and navigation overlay — Task 7. docs/05 §Global chrome, docs/09 §2.
 *
 * Every project: the header and its wordmark link. Desktop projects: the six
 * primary links, the current-route mark, settle and hide on scroll. Narrow
 * projects (and the reduced-motion project at a narrow viewport): the Menu
 * trigger, the overlay's focus contract, Escape, Enter on a link, the scroll
 * lock, axe with the overlay open and closed.
 */
import { join } from 'node:path'
import type { Page } from '@playwright/test'

import { BRAND } from '../../src/content/brand'
import { NAV, UI_NAV, routes } from '../../src/content/nav'
import {
  PROJECTS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  isProjectName,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'
import { SCREENSHOT_ROOT } from './helpers/screenshotRoute'

const HEADER = 'header.site-header'
const DIALOG = `[role="dialog"][aria-label="${UI_NAV.ariaLabels.overlay}"]`
const NARROW_VIEWPORT = { width: 390, height: 844 } as const
/** A second real route, so a soft navigation from the open overlay is observable. */
const SECOND_ROUTE = routes.about
/** Panel wipe plus stagger plus item duration (docs/04 §4), with headroom. */
const OVERLAY_SETTLE_MS = 4000
const DESKTOP_PROJECTS: readonly string[] = [PROJECTS.desktop, PROJECTS.wide, PROJECTS.webkit]
const AT_REST_CLIP = /^(none|inset\(0(px)?(\s0(px)?){0,3}\))$/

/** A viewport (not full-page) capture: header and overlay states are scroll-bound. */
async function screenshotViewport(page: Page, name: string): Promise<string> {
  const path = join(SCREENSHOT_ROOT, test.info().project.name, `${name}.png`)
  await page.screenshot({ path, animations: 'disabled' })
  test.info().annotations.push({ type: 'screenshot', description: path })
  return path
}

async function openOverlay(page: Page) {
  const trigger = page.locator(HEADER).getByRole('button', { name: UI_NAV.menu })
  await trigger.click()
  const dialog = page.locator(DIALOG)
  await expect(dialog).toBeVisible()
  await expect
    .poll(() => dialog.evaluate((el) => getComputedStyle(el).clipPath), {
      timeout: OVERLAY_SETTLE_MS,
    })
    .toMatch(AT_REST_CLIP)
  // The lines rise in after the panel; wait for the last one to be at rest
  // so screenshots and axe see the finished composition, not a frame of it.
  const lastLine = dialog.locator('.nav-overlay__line').last()
  await expect
    .poll(
      () =>
        lastLine.evaluate((el) => {
          const style = getComputedStyle(el)
          return `${style.opacity} ${style.transform}`
        }),
      { timeout: OVERLAY_SETTLE_MS }
    )
    .toMatch(/^1 (none|matrix\(1, 0, 0, 1, 0, 0\))$/)
  return dialog
}

function primaryLinks(page: Page) {
  return page.locator(DIALOG).getByRole('navigation', { name: UI_NAV.ariaLabels.primary })
}

test.describe('header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.home)
    await settleMotion(page)
  })

  test('renders the fixed header with the wordmark linking home', async ({ page }) => {
    const header = page.locator(HEADER)
    await expect(header).toBeVisible()
    await expect(header).toHaveAttribute('data-settled', 'false')

    const wordmark = header.getByRole('link', { name: BRAND.name })
    await expect(wordmark).toHaveAttribute('href', routes.home)
    await expect(wordmark).toContainText(BRAND.nameUpper)
    // The header never carries the trademark (ledger triage of Task 1).
    await expect(header).not.toContainText(BRAND.trademark)

    await screenshotViewport(page, 'nav-header-top')
    expectNoConsoleErrors(page)
  })

  test('has no serious axe violations with the overlay closed', async ({ page }) => {
    await expectNoAxeViolations(page, { impactAtLeast: 'serious' })
  })

  test('shows the six primary links and Enquire from 1024px, nothing current on /', async ({
    page,
  }, info) => {
    test.skip(!DESKTOP_PROJECTS.includes(info.project.name), 'desktop projects only')
    const nav = page.locator(HEADER).getByRole('navigation', { name: UI_NAV.ariaLabels.primary })
    await expect(nav).toBeVisible()
    for (const item of NAV.primary) {
      const link = nav.getByRole('link', { name: item.label, exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', item.href)
    }
    for (const item of NAV.utility) {
      await expect(nav.getByRole('link', { name: item.label, exact: true })).toHaveAttribute(
        'href',
        item.href
      )
    }
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(0)
    await expect(page.locator(HEADER).getByRole('button', { name: UI_NAV.menu })).toBeHidden()
  })

  test('marks the current route with the drawn brass rule', async ({ page }, info) => {
    test.skip(!DESKTOP_PROJECTS.includes(info.project.name), 'desktop projects only')
    // The header is layout chrome, so it renders on every route — including
    // one that is still a 404 while its template is unbuilt.
    const [first] = NAV.primary
    if (!first) throw new Error('nav.ts has no primary items')
    await page.goto(first.href)
    await settleMotion(page)
    const current = page.locator(HEADER).locator('a[aria-current="page"]')
    await expect(current).toHaveCount(1)
    await expect(current).toHaveAttribute('href', first.href)
    await expect(current).toHaveText(first.label)
    await expect
      .poll(() => current.evaluate((el) => getComputedStyle(el, '::after').transform))
      .not.toMatch(/matrix\(0,/)
  })
})

test.describe('header on scroll', () => {
  test.beforeEach(async ({ page }) => {
    // The placeholder home page is one viewport tall; the settle and hide
    // thresholds live at 90vh and 200vh, so the page is stretched for this
    // block only. Injected before load so ScrollTrigger measures it.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style')
        style.textContent = 'main{min-height:400vh}'
        document.head.append(style)
      })
    })
    await page.goto(routes.home)
    await settleMotion(page)
  })

  test('settles past 90vh, hides on scroll-down past 200vh, returns on scroll-up', async ({
    page,
  }, info) => {
    test.skip(!DESKTOP_PROJECTS.includes(info.project.name), 'desktop projects only')
    const header = page.locator(HEADER)
    const vh = await page.evaluate(() => window.innerHeight)

    await page.evaluate((y) => window.scrollTo(0, y), vh * 1.2)
    await expect(header).toHaveAttribute('data-settled', 'true')
    await expect(header).toHaveAttribute('data-hidden', 'false')
    await screenshotViewport(page, 'nav-header-settled')

    await page.evaluate((y) => window.scrollTo(0, y), vh * 2.2)
    await page.evaluate((y) => window.scrollTo(0, y), vh * 2.6)
    await expect(header).toHaveAttribute('data-hidden', 'true')
    await screenshotViewport(page, 'nav-header-hidden')

    await page.evaluate((y) => window.scrollTo(0, y), vh * 2.3)
    await expect(header).toHaveAttribute('data-hidden', 'false')

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(header).toHaveAttribute('data-settled', 'false')
    expectNoConsoleErrors(page)
  })
})

test.describe('navigation overlay', () => {
  test.beforeEach(async ({ page }, info) => {
    const project = info.project.name
    if (!isProjectName(project)) throw new Error(`Unknown Playwright project "${project}"`)
    test.skip(DESKTOP_PROJECTS.includes(project), 'the overlay exists below 1024px')
    if (project === PROJECTS.reducedMotion) await page.setViewportSize(NARROW_VIEWPORT)
    await page.goto(routes.home)
    await settleMotion(page)
  })

  test('opens from the Menu trigger with the dialog contract and focus on the first link', async ({
    page,
  }) => {
    const header = page.locator(HEADER)
    const trigger = header.getByRole('button', { name: UI_NAV.menu })
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator(DIALOG)).toHaveCount(0)

    const dialog = await openOverlay(page)
    const close = header.getByRole('button', { name: UI_NAV.close })
    await expect(close).toHaveAttribute('aria-expanded', 'true')
    await expect(close).toHaveAttribute('aria-controls', (await dialog.getAttribute('id')) ?? '')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(header).toHaveAttribute('data-menu-open', 'true')

    const links = primaryLinks(page).getByRole('link')
    await expect(links).toHaveCount(NAV.primary.length)
    await expect(links.first()).toBeFocused()
    for (const item of NAV.primary) {
      await expect(primaryLinks(page).getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.href
      )
    }

    const digits = BRAND.phone.replace(/[^\d+]/g, '')
    await expect(dialog.getByRole('link', { name: BRAND.phone })).toHaveAttribute(
      'href',
      `tel:${digits}`
    )
    await expect(dialog.getByRole('link', { name: BRAND.email })).toHaveAttribute(
      'href',
      `mailto:${BRAND.email}`
    )
    await expect(dialog.locator('svg.mark')).toHaveCount(1)

    await screenshotViewport(page, 'nav-overlay-open')
    expectNoConsoleErrors(page)
  })

  test('locks body scroll and makes the page behind inert while open', async ({ page }) => {
    await expect(page.locator('body')).not.toHaveAttribute('data-locked', 'true')
    await openOverlay(page)
    await expect(page.locator('body')).toHaveAttribute('data-locked', 'true')
    await expect(page.locator('main')).toHaveAttribute('inert', '')
    await expect(page.locator('footer')).toHaveAttribute('inert', '')

    await page.keyboard.press('Escape')
    await expect(page.locator(DIALOG)).toHaveCount(0)
    await expect(page.locator('body')).toHaveAttribute('data-locked', 'false')
    await expect(page.locator('main')).not.toHaveAttribute('inert', '')
  })

  test('cycles focus through the header and the panel with Tab and Shift+Tab', async ({ page }) => {
    await openOverlay(page)
    const inScope = () =>
      page.evaluate(() => {
        const active = document.activeElement
        return (
          active instanceof HTMLElement &&
          (active.closest('header.site-header') !== null ||
            active.closest('[role="dialog"]') !== null)
        )
      })

    const focusableCount = await page.evaluate(() => {
      const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      const roots = [
        document.querySelector('header.site-header'),
        document.querySelector('[role="dialog"]'),
      ]
      return roots
        .flatMap((root) => (root ? Array.from(root.querySelectorAll(selector)) : []))
        .filter((el) => el.getClientRects().length > 0).length
    })
    expect(focusableCount).toBeGreaterThan(NAV.primary.length)

    // Forward: one full lap and one more lands back on the first link.
    for (let i = 0; i < focusableCount + 1; i++) {
      await page.keyboard.press('Tab')
      expect(await inScope(), `Tab ${i + 1} left the header/overlay`).toBe(true)
    }
    // Backward from the first link wraps to the last focusable.
    await primaryLinks(page).getByRole('link').first().focus()
    await page.keyboard.press('Shift+Tab')
    expect(await inScope(), 'Shift+Tab from the first link left the scope').toBe(true)
    await expect(primaryLinks(page).getByRole('link').first()).not.toBeFocused()
  })

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const header = page.locator(HEADER)
    await openOverlay(page)
    await page.keyboard.press('Escape')
    await expect(page.locator(DIALOG)).toHaveCount(0)
    const trigger = header.getByRole('button', { name: UI_NAV.menu })
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(header).toHaveAttribute('data-menu-open', 'false')
    await screenshotViewport(page, 'nav-overlay-closed')
  })

  test('closes when the trigger is pressed again by keyboard', async ({ page }) => {
    const trigger = page.locator(HEADER).getByRole('button', { name: UI_NAV.menu })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(DIALOG)).toBeVisible()
    await page.locator(HEADER).getByRole('button', { name: UI_NAV.close }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(DIALOG)).toHaveCount(0)
  })

  test('Enter on a menu link navigates and closes the overlay', async ({ page }) => {
    await page.goto(SECOND_ROUTE)
    await settleMotion(page)
    const dialog = await openOverlay(page)
    const [enquire] = NAV.utility
    if (!enquire) throw new Error('nav.ts has no utility items')
    await dialog.getByRole('link', { name: enquire.label, exact: true }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL((url) => url.pathname === enquire.href)
    await expect(page.locator(DIALOG)).toHaveCount(0)
    await expect(page.locator(HEADER)).toBeVisible()
    await expect(page.locator('body')).not.toHaveAttribute('data-locked', 'true')
  })

  test('closes and releases the scroll lock when a soft navigation commits', async ({ page }) => {
    // A client-side navigation needs a second route. The wordmark link home
    // is inside the focus scope, so Enter on it navigates from the open overlay.
    await page.goto(SECOND_ROUTE)
    await settleMotion(page)
    await openOverlay(page)
    await page.locator(HEADER).getByRole('link', { name: BRAND.name }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL((url) => url.pathname === routes.home)
    await expect(page.locator(DIALOG)).toHaveCount(0)
    await expect(page.locator(HEADER)).toHaveAttribute('data-menu-open', 'false')
    await expect(page.locator('body')).toHaveAttribute('data-locked', 'false')
    await expect(page.locator('main')).not.toHaveAttribute('inert', '')
  })

  test('has no serious axe violations with the overlay open', async ({ page }) => {
    await openOverlay(page)
    await expectNoAxeViolations(page, { impactAtLeast: 'serious' })
  })

  test('opens as an opacity fade with no clip-path under reduced motion', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== PROJECTS.reducedMotion, 'reduced-motion project only')
    await page.locator(HEADER).getByRole('button', { name: UI_NAV.menu }).click()
    const dialog = page.locator(DIALOG)
    await expect(dialog).toHaveAttribute('data-reduced', 'true')
    // Sampled immediately: a wipe would still be mid-inset here.
    expect(await dialog.evaluate((el) => getComputedStyle(el).clipPath)).toBe('none')
    expect(await dialog.evaluate((el) => el.style.clipPath)).toBe('')
    await expect(dialog).toBeVisible()
    await expect.poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await expect(dialog.locator('svg.mark--animated')).toHaveCount(0)
    await screenshotRoute(page, 'nav-overlay-reduced')
  })

  test('is absent from the accessibility tree once closed', async ({ page }) => {
    await openOverlay(page)
    await page.keyboard.press('Escape')
    await expect(page.locator(DIALOG)).toHaveCount(0)
    await expect(page.locator(HEADER).getByRole('button', { name: UI_NAV.menu })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })
})
