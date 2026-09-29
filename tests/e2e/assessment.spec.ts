/**
 * /self-assessment/[slug] — Task 18b, round 1 (R5). docs/05 §Self-assessment,
 * docs/09 §2 and §3 *Self-assessment data handling*.
 *
 * Two questionnaires on every project: the title, the one-line instruction
 * and the first question in the first viewport, with no disclaimer band and
 * no scoring line; fifteen radio groups, each answered its own way (ten
 * numbered cells or yes / no / maybe); the tally and the held action;
 * keyboard-only completion to a focused correct result; a pointer choice
 * moving focus and view to the next question (instantly under reduced
 * motion); the result's average, band, interpretation, disclaimer and
 * consultation; withdrawal on a changed answer; start again; no request and
 * no storage while answering; the rail; axe on <main> before and after the
 * result; captures of the opening, a sheet mid-answer and the result. Then
 * every questionnaire: 200, its h1, and its first question in view.
 */
import type { Locator, Page } from '@playwright/test'

import { answerTypesFor } from '../../src/content/assessment-answers'
import { ASSESSMENTS, ASSESSMENTS_PAGE, ASSESSMENT_SERIES } from '../../src/content/assessments'
import { NAV, assessmentHref, routes } from '../../src/content/nav'
import type { Assessment } from '../../src/content/schemas'
import { UI_ASSESSMENT, UI_INTERIOR } from '../../src/content/ui'
import {
  assessmentPrevNext,
  factLabel,
  progressLabel,
  scoreAssessment,
  scoreLabel,
  type FactAnswer,
} from '../../src/lib/assessment'
import {
  PROJECTS,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  revealAll,
  screenshotRoute,
  settleMotion,
  tabKey,
  test,
} from './helpers'

const FIXTURE_SLUGS = ['alcohol', 'codependency'] as const

const FIXTURES: readonly Assessment[] = FIXTURE_SLUGS.map((slug) => {
  const assessment = ASSESSMENTS.find((a) => a.slug === slug)
  if (!assessment) throw new Error(`assessments.ts has no ${slug}`)
  return assessment
})

const section = (id: string) => {
  const found = ASSESSMENTS_PAGE.sections.find((s) => s.id === id)
  if (!found) throw new Error(`self-assessment page has no ${id} section`)
  return found
}
const DISCLAIMER = section('important-disclaimer')
const CONSULTATION = section('a-confidential-consultation')
const ENQUIRE = (() => {
  const [item] = NAV.utility
  if (!item) throw new Error('nav.ts has no utility item')
  return item
})()

const ROW = '.assessment__row'
const TALLY = '.assessment__tally'
const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`
const MAX_TABS = 40
const N = 15
/** Keys or values that would betray an answer sheet in storage or a cookie. */
const ANSWER_SHAPED = /assess|answer|score|question/i
/** Lenis brings a question into view over --d-slow; allow for it. */
const SCROLL_SETTLE_MS = 3000
const SHEET_TIMEOUT_MS = 120_000

type Value = FactAnswer | number
/** One answer per question: `scale` on a 1 to 10 question, `fact` on a yes / no / maybe one. */
const sheet = (assessment: Assessment, scale: number, fact: FactAnswer): readonly Value[] =>
  answerTypesFor(assessment.slug).map((type) => (type === 'scale' ? scale : fact))

const rows = (page: Page): Locator => page.locator(ROW)
const result = (page: Page): Locator => page.getByRole('main').getByRole('status')
const action = (page: Page, name: string): Locator => page.getByRole('button', { name })
const optionName = (value: Value): string =>
  typeof value === 'number' ? String(value) : factLabel(value)

/** The radios are painted as their cells; a pointer chooses one by clicking the cell. */
async function choose(page: Page, index: number, value: Value) {
  const row = rows(page).nth(index)
  await row.locator(`label:has(input[value="${value}"])`).click()
  await expect(row.getByRole('radio', { name: optionName(value), exact: true })).toBeChecked()
}

async function answerSheet(page: Page, answers: readonly Value[]) {
  for (const [i, value] of answers.entries()) await choose(page, i, value)
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press(tabKey(page))
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error(`Tab never reached the target within ${MAX_TABS} presses`)
}

/** Bottom of `locator` against the first viewport, at the top of the page (negative: inside it). */
const belowFold = (locator: Locator): Promise<number> =>
  locator.evaluate((el) => Math.round(el.getBoundingClientRect().bottom - window.innerHeight))

async function expectResult(page: Page, assessment: Assessment, answers: readonly Value[]) {
  const score = scoreAssessment(answers, answerTypesFor(assessment.slug), assessment.scoring)
  if (score.average === null || !score.band) throw new Error('expected a complete sheet')
  const panel = result(page)
  await expect(panel).toBeVisible()
  await expect(panel).toContainText(scoreLabel(score.average))
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(score.band.label)
  await expect(panel).toContainText(assessment.interpretation)
  const notes = panel.getByRole('heading', { level: 3 })
  await expect(notes.nth(0)).toHaveText(DISCLAIMER.title ?? '')
  for (const paragraph of DISCLAIMER.paragraphs) await expect(panel).toContainText(paragraph)
  await expect(notes.nth(1)).toHaveText(CONSULTATION.title ?? '')
  for (const paragraph of CONSULTATION.paragraphs) await expect(panel).toContainText(paragraph)
  await expect(panel.getByRole('link', { name: ENQUIRE.label })).toHaveAttribute(
    'href',
    ENQUIRE.href
  )
}

for (const assessment of FIXTURES) {
  const route = assessmentHref(assessment.slug)
  const types = answerTypesFor(assessment.slug)
  /** Every scale question at 5, every fact question yes. */
  const middle = sheet(assessment, 5, 'yes')

  test.describe(`assessment: ${assessment.slug}`, () => {
    // Several tests answer one to three full sheets of fifteen by pointer or
    // key, each waiting for the page to settle, plus reveal passes: well past
    // the default 30 s on a shared machine.
    test.describe.configure({ timeout: SHEET_TIMEOUT_MS })

    test.beforeEach(async ({ page }) => {
      await page.goto(route)
      await settleMotion(page)
    })

    test('opens on the title, the instruction and the first question, with nothing between', async ({
      page,
    }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(assessment.title)
      const intro = page.locator('main > :first-child')
      await expect(intro).toHaveAttribute('data-ground', 'light')
      await expect(intro).toContainText(String(assessment.order).padStart(2, '0'))
      await expect(intro.locator('.page-intro__lead')).toHaveText(ASSESSMENT_SERIES.instruction)

      // No disclaimer band and no scoring line anywhere on the page before a result.
      await expect(page.locator('main [data-ground="mid"]')).toHaveCount(0)
      await expect(page.locator(`#${DISCLAIMER.id}`)).toHaveCount(0)
      await expect(page.getByRole('main')).not.toContainText(ASSESSMENT_SERIES.scoringText)
      await expect(page.getByRole('main')).not.toContainText(/1 point for each/)

      // The title, the instruction and the whole first question in the first viewport.
      expect(await belowFold(h1), 'the title').toBeLessThan(0)
      expect(await belowFold(intro.locator('.page-intro__lead')), 'the instruction').toBeLessThan(0)
      expect(await belowFold(rows(page).first()), 'the first question').toBeLessThanOrEqual(0)

      const path = await screenshotRoute(page, `assessment-${assessment.slug}-open`)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })

    test('asks fifteen questions as radio groups, each answered its own way', async ({ page }) => {
      await expect(rows(page)).toHaveCount(N)
      const questions = await page.locator(`${ROW} .assessment__question`).allTextContents()
      expect(questions).toEqual([...assessment.questions])
      const groups = page.getByRole('radiogroup')
      await expect(groups).toHaveCount(N)
      await expect(page.getByText(UI_ASSESSMENT.scaleHint, { exact: true })).toBeVisible()
      for (const [i, question] of assessment.questions.entries()) {
        const group = groups.nth(i)
        await expect(group).toHaveAccessibleName(question)
        if (types[i] === 'scale') {
          await expect(group.getByRole('radio')).toHaveCount(10)
          await expect(group.getByRole('radio').first()).toHaveAccessibleName('1')
          await expect(group.getByRole('radio').last()).toHaveAccessibleName('10')
          await expect(group).toHaveAccessibleDescription(UI_ASSESSMENT.scaleHint)
        } else {
          await expect(group.getByRole('radio')).toHaveCount(3)
          for (const word of [UI_ASSESSMENT.yes, UI_ASSESSMENT.no, UI_ASSESSMENT.maybe]) {
            await expect(group.getByRole('radio', { name: word, exact: true })).toHaveCount(1)
          }
        }
      }
    })

    test('fits the ten cells on the row at every width', async ({ page }) => {
      const scaleRow = rows(page).nth(types.indexOf('scale'))
      const cells = scaleRow.locator('.choice__cell')
      await expect(cells).toHaveCount(10)
      const last = await cells.last().boundingBox()
      const first = await cells.first().boundingBox()
      const width = page.viewportSize()?.width ?? 0
      if (!first || !last) throw new Error('no cell boxes')
      expect(last.x + last.width).toBeLessThanOrEqual(width)
      expect(Math.round(last.y)).toBe(Math.round(first.y))
      // Each cell keeps a comfortable target (WCAG 2.2 2.5.8 asks 24px).
      expect(first.width).toBeGreaterThanOrEqual(24)
      expect(first.height).toBeGreaterThanOrEqual(44)
    })

    test('shows the tally after the first answer and holds the action until the sheet is complete', async ({
      page,
    }) => {
      const tally = page.locator(TALLY)
      const see = action(page, UI_ASSESSMENT.seeResult)
      await expect(tally).toHaveAttribute('aria-live', 'polite')
      await expect(tally).toHaveText('')
      await expect(see).toBeDisabled()
      await see.click({ force: true })
      await expect(result(page)).toHaveCount(0)

      await choose(page, 0, middle[0] ?? 5)
      await expect(tally).toHaveText(progressLabel(1, N))
      await choose(page, 0, types[0] === 'scale' ? 9 : 'no')
      await expect(tally).toHaveText(progressLabel(1, N))
      await expect(see).toBeDisabled()

      await answerSheet(page, middle)
      await expect(tally).toHaveText(progressLabel(N, N))
      await expect(see).toBeEnabled()
    })

    test('moves focus and view to the next question after a choice', async ({ page }, info) => {
      await choose(page, 0, middle[0] ?? 5)
      await expect(rows(page).nth(1).getByRole('radio').first()).toBeFocused()

      // Far down the sheet the next question is brought into view.
      await answerSheet(page, middle.slice(0, 9))
      const tenth = rows(page).nth(9)
      await expect(tenth.getByRole('radio').first()).toBeFocused()
      const inView = () =>
        tenth.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return r.top >= 0 && r.bottom <= window.innerHeight
        })
      if (info.project.name === PROJECTS.reducedMotion) {
        // No scroll animation: the page is already there.
        expect(await inView()).toBe(true)
      } else {
        await expect.poll(inView, { timeout: SCROLL_SETTLE_MS }).toBe(true)
      }
      await page.waitForTimeout(info.project.name === PROJECTS.reducedMotion ? 0 : 1000)
      await revealAll(page)
      const path = await screenshotRoute(page, `assessment-${assessment.slug}-mid`)
      test.info().annotations.push({ type: 'screenshot', description: path })
    })

    test('can be completed by keyboard alone and focuses the correct result', async ({
      page,
    }, info) => {
      // Scale questions: the arrow keys choose 5 and stay; Tab moves on. Fact
      // questions: Space chooses Yes and moves on by itself.
      await tabUntilFocused(page, rows(page).first().getByRole('radio').first())
      for (const [i, type] of types.entries()) {
        const row = rows(page).nth(i)
        await expect(row.getByRole('radio').first()).toBeFocused()
        if (type === 'scale') {
          for (let step = 0; step < 4; step += 1) await page.keyboard.press('ArrowRight')
          await expect(row.getByRole('radio', { name: '5', exact: true })).toBeFocused()
          await page.keyboard.press(tabKey(page))
        } else {
          await page.keyboard.press('Space')
        }
        await expect(
          row.getByRole('radio', { name: optionName(middle[i] ?? 5), exact: true })
        ).toBeChecked()
      }
      await expect(action(page, UI_ASSESSMENT.seeResult)).toBeFocused()
      await page.keyboard.press('Enter')

      await expectResult(page, assessment, middle)
      await expect(result(page)).toBeFocused()
      await expect(action(page, UI_ASSESSMENT.startAgain)).toBeVisible()
      await expect(action(page, UI_ASSESSMENT.seeResult)).toHaveCount(0)

      if (info.project.name === PROJECTS.reducedMotion) {
        // Instant: no split, no tween; the band is plain text at full opacity.
        const band = result(page).getByRole('heading', { level: 2 })
        await expect(band).toHaveCSS('opacity', '1')
        await expect(band.locator('.split-line')).toHaveCount(0)
      }

      await revealAll(page)
      const path = await screenshotRoute(page, `assessment-${assessment.slug}-result`)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })

    test('bands a pointer-answered sheet and withdraws the result when an answer changes', async ({
      page,
    }) => {
      const severe = sheet(assessment, 9, 'yes')
      await answerSheet(page, severe)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expectResult(page, assessment, severe)

      // Everything eased to 2 and no: the result no longer describes the sheet.
      const mild = sheet(assessment, 2, 'no')
      await choose(page, 0, mild[0] ?? 2)
      await expect(result(page)).toHaveCount(0)
      await answerSheet(page, mild)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expectResult(page, assessment, mild)
    })

    test('start again clears every answer, the tally and the result', async ({ page }) => {
      await answerSheet(page, middle)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expect(result(page)).toBeVisible()

      await action(page, UI_ASSESSMENT.startAgain).click()
      await expect(result(page)).toHaveCount(0)
      await expect(page.locator(TALLY)).toHaveText('')
      await expect(page.locator(`${ROW} input:checked`)).toHaveCount(0)
      await expect(action(page, UI_ASSESSMENT.seeResult)).toBeDisabled()
    })

    test('sends nothing and stores nothing while answering', async ({ page }) => {
      const snapshot = () =>
        page.evaluate(() => ({
          href: location.href,
          local: Object.entries(localStorage).flat(),
          session: Object.entries(sessionStorage).flat(),
          cookie: document.cookie,
        }))
      const before = await snapshot()
      const requests: { url: string; method: string; prefetch: boolean }[] = []
      page.on('request', (request) => {
        const headers = request.headers()
        requests.push({
          url: request.url(),
          method: request.method(),
          prefetch: headers['rsc'] === '1' || headers['next-router-prefetch'] !== undefined,
        })
      })

      await answerSheet(page, middle)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expect(result(page)).toBeVisible()
      await page.waitForTimeout(500)

      // Dev tooling, route prefetches and the lazy images may fetch; nothing else may.
      const unexpected = requests.filter((r) => !r.prefetch && !r.url.includes('/_next/'))
      expect(unexpected).toEqual([])
      expect(requests.filter((r) => r.method !== 'GET')).toEqual([])

      // Storage, cookies and the URL are exactly as they were, and nothing in
      // them — before or after — is shaped like an answer sheet.
      const after = await snapshot()
      expect(after).toEqual(before)
      expect(after.local.filter((s) => ANSWER_SHAPED.test(s))).toEqual([])
      expect(after.session.filter((s) => ANSWER_SHAPED.test(s))).toEqual([])
      expect(ANSWER_SHAPED.test(after.cookie)).toBe(false)
    })

    test('links to the previous and next questionnaires, the ends wrapping to the index', async ({
      page,
    }) => {
      const { prev, next } = assessmentPrevNext(assessment.slug)
      if (!prev || !next) throw new Error('a questionnaire always has two neighbours')
      const links = page.locator(RAIL).getByRole('link')
      await expect(links).toHaveCount(2)
      await expect(links.nth(0)).toHaveText(prev.label)
      await expect(links.nth(0)).toHaveAttribute('href', prev.href)
      await expect(links.nth(1)).toHaveText(next.label)
      await expect(links.nth(1)).toHaveAttribute('href', next.href)
    })

    test('has no serious axe violations inside the page content, before and after the result', async ({
      page,
    }) => {
      // Scoped to <main>: the scroll rail and the footer are chrome with
      // their own specs (footer.spec.ts). Reveal everything first so axe
      // sees no element at opacity 0.
      await revealAll(page)
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
      await answerSheet(page, middle)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expect(result(page)).toBeVisible()
      await revealAll(page)
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
    })
  })
}

test.describe('assessment: all routes', () => {
  // Ten page loads, each waiting for the preloader's handshake.
  test.describe.configure({ timeout: SHEET_TIMEOUT_MS })

  test('every questionnaire answers 200 with its title and its first question in view', async ({
    page,
  }) => {
    for (const assessment of ASSESSMENTS) {
      const response = await page.goto(assessmentHref(assessment.slug))
      expect(response?.status(), assessment.slug).toBe(200)
      await settleMotion(page)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(assessment.title)
      expect(await belowFold(rows(page).first()), assessment.slug).toBeLessThanOrEqual(0)
    }
  })

  test('an unknown slug is a 404', async ({ page }) => {
    const response = await page.goto(`${routes.selfAssessment}/nowhere`)
    expect(response?.status()).toBe(404)
  })
})
