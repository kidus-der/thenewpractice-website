/**
 * Keyboard walkthrough (docs/09 §2, docs/11 Gate 1; Task 19). One route per
 * template: the skip link is the first tab stop and lands on <main>; every
 * link and control in <main> is reachable and shows the brass ring; the rail
 * and the footer are reached in order; the assessment radios move by arrow
 * key; the header's menu opens, traps, and closes on Escape below 1024px.
 */
import { routes, serviceHref, teamHref, assessmentHref } from '../../src/content/nav'
import { SERVICES } from '../../src/content/services'
import { TEAM } from '../../src/content/team'
import { ASSESSMENTS } from '../../src/content/assessments'
import { UI } from '../../src/content/ui'
import { UI_NAV } from '../../src/content/nav'
import { PROJECTS, expect, expectNoConsoleErrors, settleMotion, tabKey, test } from './helpers'

const first = <T>(items: readonly T[], what: string): T => {
  const [item] = items
  if (!item) throw new Error(`no ${what}`)
  return item
}

/** One route per template. */
const ROUTES: readonly { name: string; path: string }[] = [
  { name: 'home', path: routes.home },
  { name: 'interior', path: routes.about },
  { name: 'treatment', path: serviceHref(first(SERVICES, 'services').slug) },
  { name: 'profile', path: teamHref(first(TEAM, 'team members').slug) },
  { name: 'residences', path: routes.residences },
  { name: 'index', path: routes.clinicalServices },
  { name: 'enquiry', path: routes.contact },
  { name: 'assessment', path: assessmentHref(first(ASSESSMENTS, 'assessments').slug) },
]

/** Links, controls and the one deliberate tab stop: the carousel's scroller under reduced motion. */
const FOCUSABLE_IN_MAIN =
  'main a[href], main button:not([disabled]), main input:not([disabled]):not([tabindex="-1"]), main select:not([disabled]), main textarea:not([disabled]), main [tabindex="0"]'
const NARROW_PROJECTS: readonly string[] = [PROJECTS.mobile, PROJECTS.tablet]
/** Tabbing every control on the longest page (54 rows on a treatment page) needs headroom. */
const MAX_TAB_STOPS = 200

type FocusSnapshot = Readonly<{
  tag: string
  inMain: boolean
  inFooter: boolean
  outline: string
  /** A text field shows focus as its brass underline (docs/03 §5), not the ring. */
  underline: boolean
  visible: boolean
}>

/**
 * The focused element, or — for a painted radio, which is 1px and unpainted —
 * the option label that carries its ring (`.choice__option:has(:focus-visible)`).
 */
const activeSnapshot = (page: import('@playwright/test').Page) =>
  page.evaluate(async (): Promise<FocusSnapshot> => {
    // Under reduced motion the safety net's 0.01ms transition on `all` makes
    // the computed outline report the browser's default ring for a few
    // frames after focus moves (ledger, Task 12 findings); read after a short
    // settle. The ring itself is 1px brass on both grounds (Task 19 read it
    // at 600ms with and without reduced motion).
    await new Promise<void>((r) => setTimeout(r, 80))
    const focused = document.activeElement as HTMLElement | null
    const el = focused?.closest<HTMLElement>('.choice__option') ?? focused
    const style = el ? getComputedStyle(el) : null
    const rect = el?.getBoundingClientRect()
    const underline = focused?.parentElement?.querySelector<HTMLElement>('.field__underline')
    return {
      tag: focused?.tagName ?? '',
      inMain: Boolean(el && el.closest('main')),
      inFooter: Boolean(el && el.closest('footer')),
      outline: style ? `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}` : '',
      // `.field__input:focus ~ .field__underline` wipes the rule in over --d-base;
      // sampled right after Tab it is mid-transition, so its presence is the check.
      underline: Boolean(focused?.classList.contains('field__input') && underline),
      visible: Boolean(rect && rect.width > 0 && rect.height > 0),
    }
  })

for (const route of ROUTES) {
  test.describe(`keyboard: ${route.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path)
      await settleMotion(page)
    })

    test('the skip link is the first tab stop and moves focus to main', async ({ page }) => {
      await page.keyboard.press(tabKey(page))
      const skip = page.locator('.skip-link')
      await expect(skip).toBeFocused()
      await expect(skip).toHaveText(UI.skipLink)
      await expect(skip).toBeInViewport()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#main$/)
      // The next Tab lands inside <main>, on its first link or control.
      await page.keyboard.press(tabKey(page))
      expect((await activeSnapshot(page)).inMain).toBe(true)
    })

    test('every control in main is reachable in order with a visible ring', async ({ page }) => {
      // One tab stop per radio group: the browser stops on the checked radio,
      // or the first when none is, and arrows move within the group.
      const expected = await page.locator(FOCUSABLE_IN_MAIN).evaluateAll((els) => {
        const groups = new Set<string>()
        return els
          .filter((el) => (el as HTMLElement).getClientRects().length > 0)
          .filter((el) => {
            if (!(el instanceof HTMLInputElement) || el.type !== 'radio') return true
            if (groups.has(el.name)) return false
            groups.add(el.name)
            return true
          }).length
      })
      expect(expected).toBeGreaterThan(0)

      // Start from the skip link so the header is walked first.
      await page.keyboard.press(tabKey(page))
      let reachedMain = 0
      let reachedFooter = false
      for (let i = 0; i < MAX_TAB_STOPS && !reachedFooter; i += 1) {
        await page.keyboard.press(tabKey(page))
        const snap = await activeSnapshot(page)
        if (snap.inFooter) {
          reachedFooter = true
          break
        }
        if (!snap.inMain) continue
        reachedMain += 1
        expect(snap.visible, `tab stop ${i} in main is visible`).toBe(true)
        // docs/03 §5: a 1px brass outline on every control; a text field's
        // indicator is the brass underline that wipes in on focus
        if (snap.underline) continue
        expect(snap.outline, `tab stop ${i} shows the focus ring`).toMatch(/^solid 1px/)
      }
      expect(reachedFooter, 'the footer is reached after main').toBe(true)
      expect(reachedMain, 'every visible control in main was a tab stop').toBe(expected)
      expectNoConsoleErrors(page)
    })

    test('the menu opens, traps focus and closes on Escape below 1024px', async ({
      page,
    }, info) => {
      test.skip(!NARROW_PROJECTS.includes(info.project.name), 'the trigger exists below 1024px')
      const header = page.locator('header.site-header')
      const trigger = header.getByRole('button', { name: UI_NAV.menu })
      await trigger.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: UI_NAV.ariaLabels.overlay })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('link').first()).toBeFocused()
      // Shift+Tab from the first link cycles within header + panel, never into main.
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press(tabKey(page, true))
        expect((await activeSnapshot(page)).inMain).toBe(false)
      }
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      await expect(page.locator('main')).not.toHaveAttribute('inert', '')
    })
  })
}

test.describe('keyboard: assessment radios', () => {
  test('arrow keys move within a question and Tab moves to the next', async ({ page }) => {
    const slug = first(ASSESSMENTS, 'assessments').slug
    await page.goto(assessmentHref(slug))
    await settleMotion(page)
    const groups = page.locator('main fieldset.assessment__row')
    const firstGroup = groups.first()
    const yes = firstGroup.getByRole('radio').first()
    await yes.focus()
    await page.keyboard.press('ArrowRight')
    await expect(firstGroup.getByRole('radio').nth(1)).toBeChecked()
    await page.keyboard.press('ArrowLeft')
    await expect(yes).toBeChecked()
    await page.keyboard.press(tabKey(page))
    const inSecondGroup = await groups
      .nth(1)
      .evaluate((group) => group.contains(document.activeElement))
    expect(inSecondGroup).toBe(true)
  })
})
