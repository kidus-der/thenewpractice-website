/**
 * /self-assessment/[slug] — Task 18b (the interactive scorer). docs/05
 * §Self-assessment, docs/09 §2 and §3 *Self-assessment data handling*.
 *
 * Two questionnaires on every project: the title page and the disclaimer
 * above the questions; fifteen fieldsets whose legends are the questions;
 * the tally and the disabled action; keyboard-only completion to a correct
 * result; a pointer-answered pattern and its withdrawal on a changed answer;
 * start again; no request and no storage while answering; the rail; axe on
 * <main> before and after the result; full-page captures of both states.
 * Then a smoke test over all ten routes and the 404 for an unknown slug.
 */
import type { Locator, Page } from '@playwright/test'

import { ASSESSMENTS, ASSESSMENTS_PAGE, ASSESSMENT_SERIES } from '../../src/content/assessments'
import { NAV, assessmentHref, routes } from '../../src/content/nav'
import type { Assessment } from '../../src/content/schemas'
import { UI_ASSESSMENT, UI_INDEX, UI_INTERIOR } from '../../src/content/ui'
import { assessmentPrevNext, progressLabel, scoreLabel } from '../../src/lib/assessment'
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
/** Six yeses: the moderate band (5–9). */
const YESES = 6
const N = ASSESSMENTS[0]?.scoring.max ?? 15
/** Keys or values that would betray an answer sheet in storage or a cookie. */
const ANSWER_SHAPED = /assess|answer|score|question/i

const bandOf = (assessment: Assessment, key: 'mild' | 'moderate' | 'severe') => {
  const band = assessment.scoring.bands.find((b) => b.key === key)
  if (!band) throw new Error(`${assessment.slug} has no ${key} band`)
  return band
}

const rows = (page: Page): Locator => page.locator(ROW)
const result = (page: Page): Locator => page.getByRole('main').getByRole('status')
const action = (page: Page, name: string): Locator => page.getByRole('button', { name })

/** The radios are painted as their labels; a pointer chooses one by clicking the word. */
async function choose(page: Page, index: number, yes: boolean) {
  const label = yes ? UI_ASSESSMENT.yes : UI_ASSESSMENT.no
  const row = rows(page).nth(index)
  await row.locator('label.choice__option').filter({ hasText: label }).click()
  await expect(row.getByRole('radio', { name: label })).toBeChecked()
}

async function answerSheet(page: Page, yeses: number) {
  for (let i = 0; i < N; i += 1) await choose(page, i, i < yeses)
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error(`Tab never reached the target within ${MAX_TABS} presses`)
}

/** True when `first` precedes `second` in document order. */
async function precedes(first: Locator, second: Locator): Promise<boolean> {
  const a = await first.elementHandle()
  const b = await second.elementHandle()
  if (!a || !b) throw new Error('precedes: an element is missing')
  return a.evaluate(
    (el, other) => Boolean(el.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING),
    b
  )
}

async function expectResult(page: Page, assessment: Assessment, yeses: number) {
  const band = bandOf(assessment, yeses <= 4 ? 'mild' : yeses <= 9 ? 'moderate' : 'severe')
  const panel = result(page)
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText(band.label)
  await expect(panel).toContainText(scoreLabel(yeses, N))
  await expect(panel).toContainText(assessment.interpretation)
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText(CONSULTATION.title ?? '')
  for (const paragraph of CONSULTATION.paragraphs) await expect(panel).toContainText(paragraph)
  await expect(panel.getByRole('link', { name: ENQUIRE.label })).toHaveAttribute(
    'href',
    ENQUIRE.href
  )
}

for (const assessment of FIXTURES) {
  const route = assessmentHref(assessment.slug)

  test.describe(`assessment: ${assessment.slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route)
      await settleMotion(page)
    })

    test('opens on bone with the title, the scoring line and the disclaimer above the questions', async ({
      page,
    }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(assessment.title)
      const intro = page.locator('main > :first-child')
      await expect(intro).toHaveAttribute('data-ground', 'light')
      await expect(intro).toContainText(ASSESSMENT_SERIES.scoringText)
      await expect(intro).toContainText(String(assessment.order).padStart(2, '0'))

      const disclaimer = page.locator(`#${DISCLAIMER.id}`)
      await expect(disclaimer).toHaveAttribute('data-ground', 'mid')
      await expect(disclaimer.getByRole('heading', { level: 2 })).toHaveText(DISCLAIMER.title ?? '')
      for (const paragraph of DISCLAIMER.paragraphs)
        await expect(disclaimer).toContainText(paragraph)
      expect(await precedes(disclaimer, rows(page).first())).toBe(true)

      await revealAll(page)
      const path = await screenshotRoute(page, `assessment-${assessment.slug}`)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })

    test('lists fifteen fieldsets whose legends are the questions, under the instruction', async ({
      page,
    }) => {
      await expect(rows(page)).toHaveCount(N)
      const questions = await page.locator(`${ROW} .assessment__question`).allTextContents()
      expect(questions).toEqual([...assessment.questions])
      const groups = page.getByRole('group')
      await expect(groups).toHaveCount(N)
      for (const [i, question] of assessment.questions.entries()) {
        await expect(groups.nth(i)).toHaveAccessibleName(question)
        await expect(groups.nth(i).getByRole('radio')).toHaveCount(2)
      }
      const instruction = page.getByText(ASSESSMENT_SERIES.instruction, { exact: true })
      await expect(instruction).toBeVisible()
      expect(await precedes(instruction, rows(page).first())).toBe(true)
      await expect(page.getByRole('heading', { name: UI_INDEX.assessmentLength })).toBeVisible()
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

      await choose(page, 0, true)
      await expect(tally).toHaveText(progressLabel(1, N))
      await choose(page, 0, false)
      await expect(tally).toHaveText(progressLabel(1, N))
      await expect(see).toBeDisabled()

      await answerSheet(page, YESES)
      await expect(tally).toHaveText(progressLabel(N, N))
      await expect(see).toBeEnabled()
    })

    test('can be completed by keyboard alone and focuses the correct result', async ({
      page,
    }, info) => {
      const firstYes = rows(page).first().getByRole('radio', { name: UI_ASSESSMENT.yes })
      await tabUntilFocused(page, firstYes)
      for (let i = 0; i < N; i += 1) {
        if (i > 0) await page.keyboard.press('Tab')
        // Focus lands on the row's first radio (Yes): Space keeps it, ArrowRight moves to No.
        await page.keyboard.press(i < YESES ? 'Space' : 'ArrowRight')
        await expect(
          rows(page)
            .nth(i)
            .getByRole('radio', { name: i < YESES ? UI_ASSESSMENT.yes : UI_ASSESSMENT.no })
        ).toBeChecked()
      }
      await page.keyboard.press('Tab')
      await expect(action(page, UI_ASSESSMENT.seeResult)).toBeFocused()
      await page.keyboard.press('Enter')

      await expectResult(page, assessment, YESES)
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
      await answerSheet(page, 10)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expectResult(page, assessment, 10)

      // Six yeses become no: 4 remain, the result no longer describes the sheet.
      for (let i = 4; i < 10; i += 1) await choose(page, i, false)
      await expect(result(page)).toHaveCount(0)
      await expect(action(page, UI_ASSESSMENT.seeResult)).toBeEnabled()
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expectResult(page, assessment, 4)
    })

    test('start again clears every answer, the tally and the result', async ({ page }) => {
      await answerSheet(page, YESES)
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

      await answerSheet(page, YESES)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expect(result(page)).toBeVisible()
      await page.waitForTimeout(500)

      // Dev tooling and route prefetches may fetch; nothing else may.
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
      // Scoped to <main>: the scroll rail numeral and the footer marquee ghost
      // belong to Tasks 1/8 and 19 (ledger). Reveal everything first so axe
      // sees no element at opacity 0.
      await revealAll(page)
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
      await answerSheet(page, YESES)
      await action(page, UI_ASSESSMENT.seeResult).click()
      await expect(result(page)).toBeVisible()
      await revealAll(page)
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
    })
  })
}

test.describe('assessment: all routes', () => {
  test('every questionnaire answers 200 with its title as the h1', async ({ page }) => {
    for (const assessment of ASSESSMENTS) {
      const response = await page.goto(assessmentHref(assessment.slug))
      expect(response?.status(), assessment.slug).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(assessment.title)
    }
  })

  test('an unknown slug is a 404', async ({ page }) => {
    const response = await page.goto(`${routes.selfAssessment}/nowhere`)
    expect(response?.status()).toBe(404)
  })
})
