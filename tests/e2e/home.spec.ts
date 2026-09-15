import {
  AMBIENT_GRADIENT_EXPECTED,
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  isProjectName,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'

const ROUTE = '/'

test.describe('home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE)
    await settleMotion(page)
  })

  test('renders the lockup with a clean console', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const path = await screenshotRoute(page, 'home')
    test.info().annotations.push({ type: 'screenshot', description: path })

    expectNoConsoleErrors(page)
  })

  test('has no serious axe violations', async ({ page }) => {
    await expectNoAxeViolations(page, { impactAtLeast: 'serious' })
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
})
