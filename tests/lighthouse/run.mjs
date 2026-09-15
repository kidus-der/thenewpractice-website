/**
 * `npm run lighthouse` — Lighthouse CI against the production build.
 *
 * lhci finds Chrome by itself on a machine that has Google Chrome. This one
 * does not (Brave and Safari only), so the browser Playwright installed is
 * handed to lhci through CHROME_PATH — the variable chrome-launcher, the
 * healthcheck and the collector all honour — unless it is already set.
 * Everything else — URLs, budgets, output — lives in lighthouserc.json.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url)
const LHCI_BIN = require.resolve('@lhci/cli/src/cli.js')

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const bundled = chromium.executablePath()
  return existsSync(bundled) ? bundled : undefined
}

const chromePath = resolveChromePath()
if (!chromePath) {
  process.stderr.write(
    'No Chrome found. Run `npx playwright install chromium` or set CHROME_PATH.\n'
  )
  process.exit(1)
}

const args = ['autorun', ...process.argv.slice(2)]
const result = spawnSync(process.execPath, [LHCI_BIN, ...args], {
  stdio: 'inherit',
  env: { ...process.env, CHROME_PATH: chromePath },
})

if (result.error) {
  process.stderr.write(`lhci failed to start: ${result.error.message}\n`)
  process.exit(1)
}
process.exit(result.status ?? 1)
