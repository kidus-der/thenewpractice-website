/**
 * /contact — Task 15 (T7 Enquiry). Runs on every project. The dev server has
 * no RESEND_API_KEY, so the action uses the log adapter and every valid
 * submission is "sent" without leaving the machine.
 */
import { BRAND } from '../../src/content/brand'
import { ENQUIRY } from '../../src/content/enquiry'
import { CONTACT } from '../../src/content/pages/contact'
import { ENQUIRY_MIN_ELAPSED_MS } from '../../src/server/enquiry.schema'
import {
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  screenshotRoute,
  settleMotion,
  tabKey,
  test,
} from './helpers'

const ROUTE = '/contact'
const MAX_TABS = 40
/** Headroom over the action's minimum so the clock never decides the test. */
const TIMING_MARGIN_MS = 400
/** How long a failed submission is given to (not) produce a confirmation. */
const QUIET_MS = 1500

const textbox = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('textbox', { name })

const values = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'A few words about the situation, written by keyboard.',
}

const confirmation = (page: import('@playwright/test').Page) =>
  page.getByRole('main').getByRole('status').filter({ hasText: ENQUIRY.confirmation[0] })

async function waitForTimingWindow(page: import('@playwright/test').Page, since: number) {
  const remaining = ENQUIRY_MIN_ELAPSED_MS + TIMING_MARGIN_MS - (Date.now() - since)
  if (remaining > 0) await page.waitForTimeout(remaining)
}

async function tabUntilFocused(
  page: import('@playwright/test').Page,
  target: import('@playwright/test').Locator
) {
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press(tabKey(page))
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error(`Tab never reached the target within ${MAX_TABS} presses`)
}

/** Scroll steps between reveals, then the reveal's own duration to settle. */
const SCROLL_STEP_MS = 120
const REVEAL_SETTLE_MS = 1600

/**
 * Reveals are once:true and scroll-triggered; a full-page capture from the top
 * would show every below-fold block at its hidden initial state. Walk the page
 * first so the screenshot shows what a reader sees.
 */
async function revealAll(page: import('@playwright/test').Page) {
  const steps = await page.evaluate(
    () => Math.ceil(document.body.scrollHeight / window.innerHeight) + 1
  )
  for (let i = 1; i <= steps; i += 1) {
    await page.evaluate((n) => window.scrollTo(0, n * window.innerHeight * 0.8), i)
    await page.waitForTimeout(SCROLL_STEP_MS)
  }
  await page.waitForTimeout(REVEAL_SETTLE_MS)
  await page.evaluate(() => window.scrollTo(0, 0))
}

/** The radios are painted as their labels; a pointer chooses one by clicking the word. */
async function choose(page: import('@playwright/test').Page, label: string) {
  await page.locator('label.choice__option', { hasText: label }).click()
  await expect(page.getByRole('radio', { name: label })).toBeChecked()
}

async function fillByPointer(page: import('@playwright/test').Page) {
  await textbox(page, ENQUIRY.fields.name).fill(values.name)
  await textbox(page, ENQUIRY.fields.email).fill(values.email)
  await choose(page, ENQUIRY.options.enquiringFor.self)
  await textbox(page, ENQUIRY.fields.message).fill(values.message)
  await choose(page, ENQUIRY.options.preferredContact.email)
}

test.describe('contact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test("opens on the client's headline with the letter and the form, clean console", async ({
    page,
  }) => {
    const opening = CONTACT.sections.find((s) => s.id === 'begin-the-conversation')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(opening?.title ?? '')
    await expect(page.getByRole('main')).toContainText(CONTACT.lead ?? '')
    await expect(page.locator('main > section').first()).toHaveAttribute('data-ground', 'dark')
    await expect(page.getByRole('form', { name: ENQUIRY.formHeading })).toBeVisible()

    const address = page.locator('main address')
    await expect(address).toContainText(BRAND.founder.name)
    await expect(address.getByRole('link', { name: BRAND.email })).toHaveAttribute(
      'href',
      `mailto:${BRAND.email}`
    )
    await expect(address.getByRole('link', { name: BRAND.phone })).toHaveAttribute(
      'href',
      `tel:${BRAND.phone.replace(/[^\d+]/g, '')}`
    )

    await revealAll(page)
    const path = await screenshotRoute(page, 'contact')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })

  test('posts to its own origin', async ({ page }) => {
    // Next renders the server-action form with an empty action (the document
    // URL) plus its hidden action id; either way the POST stays on this origin,
    // which is what the CSP's form-action 'self' requires (docs/09 §3).
    const action = await page
      .getByRole('form', { name: ENQUIRY.formHeading })
      .getAttribute('action')
    expect(action, 'the form action must be same-origin for form-action self').toMatch(
      /^(|\/[^/].*)$/
    )
  })

  test('can be completed by keyboard alone and reveals the confirmation', async ({ page }) => {
    const opened = Date.now()
    await tabUntilFocused(page, textbox(page, ENQUIRY.fields.name))
    await page.keyboard.type(values.name)
    await page.keyboard.press(tabKey(page))
    await page.keyboard.type(values.email)
    await page.keyboard.press(tabKey(page)) // telephone, optional, left empty
    await page.keyboard.press(tabKey(page)) // enquiring for: first radio takes focus
    await page.keyboard.press('Space')
    await expect(page.getByRole('radio', { name: ENQUIRY.options.enquiringFor.self })).toBeChecked()
    await page.keyboard.press(tabKey(page))
    await page.keyboard.type(values.message)
    await page.keyboard.press(tabKey(page))
    await page.keyboard.press('ArrowRight') // preferred contact: telephone
    await expect(
      page.getByRole('radio', { name: ENQUIRY.options.preferredContact.telephone })
    ).toBeChecked()
    await page.keyboard.press(tabKey(page))
    await expect(page.getByRole('button', { name: ENQUIRY.submit })).toBeFocused()

    await waitForTimingWindow(page, opened)
    await page.keyboard.press('Enter')

    const sent = confirmation(page)
    await expect(sent).toBeVisible()
    for (const line of ENQUIRY.confirmation) await expect(sent).toContainText(line)
    await expect(page.getByRole('form', { name: ENQUIRY.formHeading })).toHaveCount(0)
    await expect(sent).toBeFocused()

    const path = await screenshotRoute(page, 'contact-sent')
    test.info().annotations.push({ type: 'screenshot', description: path })
    expectNoConsoleErrors(page)
  })

  test('an invalid email is announced on blur and blocks submission', async ({ page }) => {
    const email = textbox(page, ENQUIRY.fields.email)
    await textbox(page, ENQUIRY.fields.name).fill(values.name)
    await email.fill('not-an-address')
    await page.keyboard.press(tabKey(page))

    const alert = page.getByRole('alert').filter({ hasText: ENQUIRY.errors.email })
    await expect(alert).toBeVisible()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAttribute('aria-describedby', (await alert.getAttribute('id')) ?? '')

    await page.getByRole('button', { name: ENQUIRY.submit }).click()
    await page.waitForTimeout(QUIET_MS)
    await expect(confirmation(page)).toHaveCount(0)
    await expect(alert).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: ENQUIRY.errors.message })).toBeVisible()
  })

  test('a filled honeypot yields no confirmation', async ({ page }) => {
    const opened = Date.now()
    await fillByPointer(page)
    await page.locator('input[name="website"]').evaluate((el) => {
      ;(el as HTMLInputElement).value = 'https://spam.example'
    })
    await waitForTimingWindow(page, opened)
    await page.getByRole('button', { name: ENQUIRY.submit }).click()

    await expect(
      page.getByRole('main').getByRole('status').filter({ hasText: ENQUIRY.failed })
    ).toBeVisible()
    await expect(confirmation(page)).toHaveCount(0)
    await expect(page.getByRole('form', { name: ENQUIRY.formHeading })).toBeVisible()
  })

  test('has no serious axe violations inside the page content', async ({ page }) => {
    // Scoped to <main>: the scroll rail numeral and the footer marquee ghost
    // fail colour contrast on every route and belong to Tasks 1/8 (ledger:
    // Task 19 lifts the numeral). Both are outside this template.
    // The sheet fades in on scroll; axe skips invisible nodes, so bring it in first.
    const sheet = page.locator('.contact__sheet')
    await sheet.scrollIntoViewIfNeeded()
    await expect(sheet).toHaveCSS('opacity', '1')
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
  })
})

test.describe('contact without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('still posts to the action and renders the confirmation', async ({ page }) => {
    await page.goto(ROUTE)
    await fillByPointer(page)
    await page.getByRole('button', { name: ENQUIRY.submit }).click()
    await page.waitForLoadState('load')

    await expect(confirmation(page)).toBeVisible()
    await expect(page.getByRole('form', { name: ENQUIRY.formHeading })).toHaveCount(0)

    const path = await screenshotRoute(page, 'contact-nojs-sent')
    test.info().annotations.push({ type: 'screenshot', description: path })
  })
})
