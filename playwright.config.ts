import { defineConfig, devices } from '@playwright/test'

import { PROJECTS } from './tests/e2e/helpers/projects'

/**
 * Browser matrix (docs/07, docs/11 Gate 1): four widths and a reduced-motion
 * desktop, Chromium only — this machine has no Google Chrome, and Safari is
 * checked by hand (docs/07 §Browser support).
 *
 * The server under test is the dev server by default; set CI or E2E_PROD to
 * build and serve the production bundle instead, which is what the Lighthouse
 * run and the deploy checkpoints measure. Set E2E_BASE_URL to test a server
 * that is already running (another agent's `next dev` holds the project lock,
 * or the staging URL) and no server is started.
 */
const PORT = 3210
const BASE_URL = `http://localhost:${PORT}`
const IS_CI = Boolean(process.env.CI)
const USE_PRODUCTION_SERVER = IS_CI || Boolean(process.env.E2E_PROD)
const SERVER_START_TIMEOUT_MS = 240_000
const EXTERNAL_BASE_URL = process.env.E2E_BASE_URL

const desktop = devices['Desktop Chrome']

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: EXTERNAL_BASE_URL ?? BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: PROJECTS.mobile,
      use: {
        ...desktop,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: PROJECTS.tablet,
      use: {
        ...desktop,
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        hasTouch: true,
      },
    },
    {
      name: PROJECTS.desktop,
      use: { ...desktop, viewport: { width: 1280, height: 800 } },
    },
    {
      name: PROJECTS.wide,
      use: { ...desktop, viewport: { width: 1920, height: 1080 } },
    },
    {
      name: PROJECTS.reducedMotion,
      use: { ...desktop, viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' },
    },
  ],
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: USE_PRODUCTION_SERVER
          ? `npm run build && npm run start -- --port ${PORT}`
          : `npm run dev -- --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !IS_CI,
        timeout: SERVER_START_TIMEOUT_MS,
      },
})
