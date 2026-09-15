import { join } from 'node:path'
import { test, type Page } from '@playwright/test'

/** Gitignored; the agent reads these files, they are not compared. */
export const SCREENSHOT_ROOT = join('tests', 'e2e', '__screenshots__')

/**
 * Full-page PNG at tests/e2e/__screenshots__/<project>/<name>.png. Returns
 * the path so a test can report it (ledger rule 7: screenshots read, paths
 * reported).
 */
export async function screenshotRoute(page: Page, name: string): Promise<string> {
  const path = join(SCREENSHOT_ROOT, test.info().project.name, `${name}.png`)
  await page.screenshot({ path, fullPage: true, animations: 'disabled' })
  return path
}
