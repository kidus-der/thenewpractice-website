/**
 * Renders the real site in each palette.
 *
 *   npm run build && npx next start -p 3417      (in another shell)
 *   node scripts/palettes/capture.mjs [--palettes=current,sage] [--routes=home,about]
 *                                     [--base=http://localhost:3417]
 *
 * For each palette: checks contrast, regrades the stills (grade.mjs), then
 * drives Chromium against the running production build with every stylesheet
 * rewritten (inject.mjs), every still and poster served from the regraded set,
 * the hero video withheld so the poster stands (as it does when autoplay is
 * refused), and the preloader skipped. Writes
 *   design/palettes/out/captures/<palette>/<route>-<width>.png
 *   design/palettes/out/captures/<palette>/report.json
 * The site, public/ and the build are never written.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { auditPalette } from './contrast.mjs'
import { gradePalette } from './grade.mjs'
import { initArgs, initScript, rewriteCss } from './inject.mjs'
import { captureAtRest, scrollThrough, settle, staleColours } from './page.mjs'
import { PALETTE_DIR, SITE_CORE, loadPalettes, selectPalettes } from './palettes.mjs'

export const CAPTURE_DIR = join(PALETTE_DIR, 'out', 'captures')

/** The routes the palette artifact shows (ledger R7 §2), and their viewports. */
export const ROUTES = Object.freeze([
  { id: 'home', path: '/', widths: [1440, 390] },
  { id: 'about', path: '/about', widths: [1440] },
  { id: 'service', path: '/clinical-services/addiction-treatment', widths: [1440] },
  { id: 'profile', path: '/team/lowell-monkhouse', widths: [1440] },
  { id: 'self-assessment', path: '/self-assessment', widths: [1440] },
  { id: 'questionnaire', path: '/self-assessment/alcohol', widths: [1440] },
  { id: 'contact', path: '/contact', widths: [1440] },
])

const VIEWPORTS = Object.freeze({
  1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  390: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
})

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

/** The media key a still request is for: /media/<key>.<ext>, direct or via /_next/image. */
function mediaKey(url) {
  const u = new URL(url)
  const path = u.pathname === '/_next/image' ? (u.searchParams.get('url') ?? '') : u.pathname
  return /^\/media\/([^/]+)\.(?:webp|avif|jpe?g|png)$/.exec(decodeURIComponent(path))?.[1]
}

async function routePalette(context, palette, gradedDir) {
  const recolour = palette.family !== 'current'
  await context.route(/\.(mp4|webm|m3u8)(\?|$)/, (route) => route.abort())
  if (!recolour) return
  await context.route(/\.css(\?|$)/, async (route) => {
    const response = await route.fetch()
    const body = rewriteCss(await response.text(), palette)
    await route.fulfill({
      response,
      body,
      headers: { ...response.headers(), 'content-type': 'text/css' },
    })
  })
  await context.route(/\/(_next\/image|media\/)/, async (route) => {
    const key = mediaKey(route.request().url())
    const file = key && join(gradedDir, `${key}.webp`)
    if (!file || !existsSync(file)) return route.continue()
    return route.fulfill({ path: file, contentType: 'image/webp' })
  })
}

async function captureOne(browser, { palette, gradedDir, route, width, base, outDir }) {
  const context = await browser.newContext({ ...VIEWPORTS[width], reducedMotion: 'no-preference' })
  await context.addInitScript(initScript, initArgs(palette))
  await routePalette(context, palette, gradedDir)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  try {
    const response = await page.goto(new URL(route.path, base).href, { waitUntil: 'load' })
    if (!response?.ok()) throw new Error(`HTTP ${response?.status()} for ${route.path}`)
    await settle(page)
    await scrollThrough(page)
    const stale = palette.family === 'current' ? {} : await staleColours(page, SITE_CORE)
    const file = join(outDir, `${route.id}-${width}.png`)
    const shot = await captureAtRest(page, file)
    return { route: route.id, width, file, ...shot, stale, errors }
  } catch (error) {
    return { route: route.id, width, error: String(error), errors }
  } finally {
    await context.close()
  }
}

async function capturePalette(browser, palette, routes, base) {
  const audit = auditPalette(palette)
  if (audit.gates && audit.gatedFailures.length) {
    console.warn(
      `! ${palette.id} fails ${audit.gatedFailures.length} contrast pair(s); capturing anyway`
    )
  }
  const gradedDir = palette.family === 'current' ? null : await gradePalette(palette)
  const outDir = join(CAPTURE_DIR, palette.id)
  mkdirSync(outDir, { recursive: true })
  const results = []
  for (const route of routes) {
    for (const width of route.widths) {
      const result = await captureOne(browser, { palette, gradedDir, route, width, base, outDir })
      const staleCount = Object.keys(result.stale ?? {}).length
      const note = result.error ?? `${result.height}px, ${staleCount} stale colour path(s)`
      console.log(`  ${palette.id} ${route.id}-${width}: ${note}`)
      results.push(result)
    }
  }
  writeFileSync(
    join(outDir, 'report.json'),
    JSON.stringify({ palette: palette.id, results }, null, 2)
  )
  return results
}

async function main() {
  const base = arg('base') ?? process.env.PALETTE_BASE_URL ?? 'http://localhost:3417'
  const palettes = selectPalettes(loadPalettes(), arg('palettes'))
  const wanted = arg('routes')?.split(',')
  const routes = wanted ? ROUTES.filter((r) => wanted.includes(r.id)) : ROUTES
  const browser = await chromium.launch()
  try {
    let failed = 0
    for (const palette of palettes) {
      console.log(`${palette.name}`)
      const results = await capturePalette(browser, palette, routes, base)
      failed += results.filter((r) => r.error).length
    }
    console.log(`captures → ${CAPTURE_DIR}`)
    if (failed) process.exitCode = 1
  } finally {
    await browser.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
