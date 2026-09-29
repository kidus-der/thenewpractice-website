/**
 * /self-assessment/[slug] — *Send my answers to the practice*, round 1 (R6).
 * docs/05 §Self-assessment, docs/09 §3 *Self-assessment data handling*.
 *
 * On every project, against the questionnaire `alcohol`: the opt-in sits
 * collapsed beneath the result and nothing is requested while answering,
 * revealing, or opening and filling the form; submitting it makes exactly
 * one POST, to the page's own origin, carrying exactly the sheet the result
 * was scored from and the fields of the form, and nothing else; the focused
 * confirmation replaces the form while the result stays on screen; the form
 * can be completed by keyboard alone; an incomplete form names what is
 * missing (in ink, not the accent); axe finds nothing serious with the form
 * open, with its errors, or with the confirmation. Captures of the open form
 * and of the confirmation, viewport-sized with the block in view.
 *
 * The server under test runs without RESEND_API_KEY, so the action takes the
 * log adapter: nothing leaves the machine.
 */
import { join } from 'node:path'
import type { Locator, Page, Request } from '@playwright/test'

import { answerTypesFor } from '../../src/content/assessment-answers'
import { ASSESSMENTS } from '../../src/content/assessments'
import { ASSESSMENT_SEND } from '../../src/content/assessment-send'
import { BRAND } from '../../src/content/brand'
import { assessmentHref } from '../../src/content/nav'
import { UI_ASSESSMENT } from '../../src/content/ui'
import { PALETTE } from '../../src/lib/tokens'
import { scoreAssessment, type FactAnswer } from '../../src/lib/assessment'
import { ENQUIRY_MIN_ELAPSED_MS } from '../../src/server/enquiry.schema'
import {
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  revealAll,
  settleMotion,
  tabKey,
  test,
} from './helpers'
import { SCREENSHOT_ROOT } from './helpers/screenshotRoute'

const SLUG = 'alcohol'
const assessment = ASSESSMENTS.find((a) => a.slug === SLUG)
if (!assessment) throw new Error(`assessments.ts has no ${SLUG}`)
const ROUTE = assessmentHref(SLUG)

type Value = FactAnswer | number
/** A varied sheet: the scale questions 1 to 10 in turn, the fact questions yes, no, maybe. */
const SHEET: readonly Value[] = answerTypesFor(SLUG).map((type, i) =>
  type === 'scale' ? (i % 10) + 1 : ((['yes', 'no', 'maybe'] as const)[i % 3] ?? 'yes')
)
const SCORE = scoreAssessment(SHEET, answerTypesFor(SLUG), assessment.scoring)

/** Every key the form submits, and nothing else. */
const FORM_KEYS = [
  'answers',
  'consent',
  'email',
  'name',
  'preferredContact',
  'slug',
  'startedAt',
  'telephone',
  'website',
]
const PERSON = { name: 'Sam Rivera', email: 'sam.rivera@example.com' }
const INK = `rgb(${(PALETTE.canopy.slice(1).match(/../g) ?? []).map((h) => parseInt(h, 16)).join(', ')})`
const TIMING_MARGIN_MS = 400
const MAX_TABS = 60
const SEND_TIMEOUT_MS = 120_000

const main = (page: Page): Locator => page.getByRole('main')
const openButton = (page: Page): Locator => page.getByRole('button', { name: ASSESSMENT_SEND.open })
const sendForm = (page: Page): Locator =>
  page.getByRole('form', { name: ASSESSMENT_SEND.formLabel })
const confirmation = (page: Page): Locator => page.getByTestId('assessment-send-sent')
const band = (page: Page): Locator => main(page).locator('.assessment__band')

async function answerAndReveal(page: Page) {
  const rows = page.locator('.assessment__row')
  for (const [i, value] of SHEET.entries()) {
    await rows.nth(i).locator(`label:has(input[value="${value}"])`).click()
  }
  await page.getByRole('button', { name: UI_ASSESSMENT.seeResult }).click()
  await expect(band(page)).toHaveText(SCORE.band?.label ?? '')
}

/** Every request that is not a route prefetch or a static asset. */
function recordRequests(page: Page): Request[] {
  const requests: Request[] = []
  page.on('request', (request) => {
    const headers = request.headers()
    const prefetch = headers['rsc'] === '1' || headers['next-router-prefetch'] !== undefined
    if (!prefetch && !request.url().includes('/_next/')) requests.push(request)
  })
  return requests
}

/** The multipart field names of a server-action POST, without React's argument prefix. */
function fieldNames(body: string): string[] {
  const names = [...body.matchAll(/name="([^"]+)"/g)].map((m) => (m[1] ?? '').replace(/^_?\d+_/, ''))
  return [...new Set(names.filter((n) => !/^\d+$/.test(n)))].sort()
}

/** The value of one multipart field. */
function fieldValue(body: string, key: string): string | undefined {
  const match = body.match(new RegExp(`name="(?:_?\\d+_)?${key}"\\r\\n\\r\\n([^\\r]*)\\r\\n`))
  return match?.[1]
}

async function waitForTimingWindow(page: Page, since: number) {
  const remaining = ENQUIRY_MIN_ELAPSED_MS + TIMING_MARGIN_MS - (Date.now() - since)
  if (remaining > 0) await page.waitForTimeout(remaining)
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press(tabKey(page))
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error(`Tab never reached the target within ${MAX_TABS} presses`)
}

/** A viewport-sized capture with `block` in view; the full page is the other specs' job. */
async function capture(page: Page, block: Locator, name: string): Promise<string> {
  await block.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(600)
  const path = join(SCREENSHOT_ROOT, test.info().project.name, `${name}.png`)
  await page.screenshot({ path, animations: 'disabled' })
  test.info().annotations.push({ type: 'screenshot', description: path })
  return path
}

async function fillByPointer(page: Page) {
  const form = sendForm(page)
  await form.getByRole('textbox', { name: ASSESSMENT_SEND.fields.name }).fill(PERSON.name)
  await form.locator('label.choice__option', { hasText: 'Email' }).click()
  await form.getByRole('textbox', { name: ASSESSMENT_SEND.fields.email }).fill(PERSON.email)
  await form.locator('label.check__option').click()
  await expect(form.getByRole('checkbox', { name: ASSESSMENT_SEND.consent })).toBeChecked()
}

test.describe('assessment: send my answers', () => {
  test.describe.configure({ timeout: SEND_TIMEOUT_MS })

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test('requests nothing until the visitor submits, then posts exactly the sheet once', async ({
    page,
  }) => {
    const requests = recordRequests(page)
    await answerAndReveal(page)
    await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(sendForm(page)).toHaveCount(0)

    await openButton(page).click()
    const opened = Date.now()
    await expect(openButton(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(
      sendForm(page).getByRole('textbox', { name: ASSESSMENT_SEND.fields.name })
    ).toBeFocused()
    await fillByPointer(page)
    await page.waitForTimeout(300)
    expect(requests.map((r) => `${r.method()} ${r.url()}`)).toEqual([])

    await capture(page, sendForm(page), 'assessment-send-open')
    await waitForTimingWindow(page, opened)
    await sendForm(page).getByRole('button', { name: ASSESSMENT_SEND.submit }).click()
    await expect(confirmation(page)).toBeVisible()

    // One POST, to this page on this origin, carrying the form and the sheet and nothing else.
    const posts = requests.filter((r) => r.method() === 'POST')
    expect(posts).toHaveLength(1)
    const [post] = posts
    expect(new URL(post?.url() ?? '').origin).toBe(new URL(page.url()).origin)
    expect(new URL(post?.url() ?? '').pathname).toBe(ROUTE)
    const body = post?.postData() ?? ''
    expect(fieldNames(body)).toEqual(FORM_KEYS)
    expect(JSON.parse(fieldValue(body, 'answers') ?? 'null')).toEqual(SHEET)
    expect(fieldValue(body, 'slug')).toBe(SLUG)
    expect(fieldValue(body, 'name')).toBe(PERSON.name)
    expect(fieldValue(body, 'email')).toBe(PERSON.email)
    expect(fieldValue(body, 'preferredContact')).toBe('email')
    expect(fieldValue(body, 'consent')).toBe('yes')
    expect(requests.filter((r) => r.method() !== 'GET')).toHaveLength(1)

    // The confirmation is focused, the form is gone, and the result stays.
    await expect(confirmation(page)).toBeFocused()
    for (const line of ASSESSMENT_SEND.confirmation)
      await expect(confirmation(page)).toContainText(line)
    await expect(sendForm(page)).toHaveCount(0)
    await expect(band(page)).toHaveText(SCORE.band?.label ?? '')
    await revealAll(page)
    await capture(page, confirmation(page), 'assessment-send-sent')
    expectNoConsoleErrors(page)
  })

  test('can be completed by keyboard alone', async ({ page }) => {
    await answerAndReveal(page)
    await tabUntilFocused(page, openButton(page))
    await page.keyboard.press('Enter')
    const opened = Date.now()
    const form = sendForm(page)
    await expect(form.getByRole('textbox', { name: ASSESSMENT_SEND.fields.name })).toBeFocused()
    await page.keyboard.type(PERSON.name)

    // Into the preferred-contact group: the first option takes focus, Space chooses it.
    const emailOption = form.getByRole('radio', { name: 'Email' })
    await tabUntilFocused(page, emailOption)
    await page.keyboard.press('Space')
    await expect(emailOption).toBeChecked()

    await tabUntilFocused(page, form.getByRole('textbox', { name: ASSESSMENT_SEND.fields.email }))
    await page.keyboard.type(PERSON.email)
    const consent = form.getByRole('checkbox', { name: ASSESSMENT_SEND.consent })
    await tabUntilFocused(page, consent)
    await page.keyboard.press('Space')
    await expect(consent).toBeChecked()

    const send = form.getByRole('button', { name: ASSESSMENT_SEND.submit })
    await tabUntilFocused(page, send)
    await waitForTimingWindow(page, opened)
    await page.keyboard.press('Enter')
    await expect(confirmation(page)).toBeFocused()
    await expect(band(page)).toBeVisible()
  })

  test('names what is missing, in ink, and sends nothing', async ({ page }) => {
    const requests = recordRequests(page)
    await answerAndReveal(page)
    await openButton(page).click()
    await sendForm(page).getByRole('button', { name: ASSESSMENT_SEND.submit }).click()

    const alerts = sendForm(page).getByRole('alert')
    for (const message of [
      ASSESSMENT_SEND.errors.name,
      ASSESSMENT_SEND.errors.preferredContact,
      ASSESSMENT_SEND.errors.consent,
    ]) {
      await expect(alerts.filter({ hasText: message })).toBeVisible()
    }
    await expect(alerts.filter({ hasText: ASSESSMENT_SEND.errors.name })).toHaveCSS('color', INK)
    await expect(
      sendForm(page).getByRole('textbox', { name: ASSESSMENT_SEND.fields.name })
    ).toHaveAttribute('aria-invalid', 'true')

    // Choosing telephone asks for the telephone number, not the email address.
    await sendForm(page).locator('label.choice__option', { hasText: 'Telephone' }).click()
    await sendForm(page).getByRole('button', { name: ASSESSMENT_SEND.submit }).click()
    await expect(alerts.filter({ hasText: ASSESSMENT_SEND.errors.telephone })).toBeVisible()
    await expect(alerts.filter({ hasText: ASSESSMENT_SEND.errors.email })).toHaveCount(0)

    await page.waitForTimeout(300)
    expect(requests.filter((r) => r.method() !== 'GET')).toEqual([])
    await capture(page, sendForm(page), 'assessment-send-errors')
  })

  test('shows the practice’s telephone and email when sending fails', async ({ page }) => {
    await answerAndReveal(page)
    await openButton(page).click()
    const opened = Date.now()
    await fillByPointer(page)
    // A filled honeypot: the action refuses the submission, as it refuses a bot.
    await sendForm(page)
      .locator('input[name="website"]')
      .evaluate((el) => ((el as HTMLInputElement).value = 'http://spam.example'))
    await waitForTimingWindow(page, opened)
    await sendForm(page).getByRole('button', { name: ASSESSMENT_SEND.submit }).click()

    const failed = sendForm(page).getByRole('status')
    await expect(failed).toContainText(ASSESSMENT_SEND.failed)
    await expect(failed.getByRole('link', { name: BRAND.phone })).toBeVisible()
    await expect(confirmation(page)).toHaveCount(0)
    await expect(band(page)).toBeVisible()
  })

  test('has no serious axe violations with the form open, with errors, and once sent', async ({
    page,
  }) => {
    await answerAndReveal(page)
    await openButton(page).click()
    const opened = Date.now()
    await revealAll(page)
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })

    await sendForm(page).getByRole('button', { name: ASSESSMENT_SEND.submit }).click()
    await expect(
      sendForm(page).getByRole('alert').filter({ hasText: ASSESSMENT_SEND.errors.name })
    ).toBeVisible()
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })

    await fillByPointer(page)
    await waitForTimingWindow(page, opened)
    await sendForm(page).getByRole('button', { name: ASSESSMENT_SEND.submit }).click()
    await expect(confirmation(page)).toBeVisible()
    await revealAll(page)
    await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
  })
})
