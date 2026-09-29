/**
 * One route, one palette, one width: bring the page to rest and capture it.
 *
 * A full-page capture of a scroll-driven page cannot be taken in one shot:
 * at scroll 0 every scrubbed or pinned block (the manifesto's lines, the
 * statement) sits at progress 0 and reads empty, and at the bottom the hero
 * has faded out. So two shots of the same document are composited:
 *   B — the whole page at maximum scroll, with fixed chrome hidden and sticky
 *       elements laid in flow: every reveal fired, every scrub at 1, every
 *       pin released (a scrolled-through page, as a reader leaves it);
 *   A — the first viewport at scroll 0, chrome included: the hero, the header.
 * A is laid over the top of B. Nothing here names a section or a class.
 */
import sharp from 'sharp'

const SETTLE_MS = 1800
const IMAGE_TIMEOUT_MS = 12000

const frame = () => new Promise((r) => requestAnimationFrame(() => r()))

/** Fonts, the veil handshake (docs/04 §4), then one painted frame. */
export async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page
    .waitForFunction(() => document.documentElement.dataset.veil === 'done', null, {
      timeout: 15000,
    })
    .catch(() => {})
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())))
}

/** Scroll the whole page once so every once-only reveal and lazy image fires. */
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    const tick = () => new Promise((r) => requestAnimationFrame(() => r()))
    const max = () => document.documentElement.scrollHeight - window.innerHeight
    const step = window.innerHeight * 0.5
    for (let y = 0; y <= max(); y += step) {
      window.scrollTo(0, y)
      await tick()
      await tick()
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, max())
    await tick()
  })
  await waitForImages(page)
}

/** Every <img> decoded, or the timeout; returns the ones still pending. */
async function waitForImages(page) {
  const deadline = Date.now() + IMAGE_TIMEOUT_MS
  for (;;) {
    const pending = await page.evaluate(() =>
      [...document.images].filter((img) => !img.complete).map((img) => img.currentSrc || img.src)
    )
    if (!pending.length || Date.now() > deadline) return pending
    await page.waitForTimeout(250)
  }
}

const HIDE_ID = 'palette-capture-flatten'

/**
 * Hide fixed chrome, lay sticky elements in flow, and close every released
 * pin's empty run-out: GSAP's `.pin-spacer` keeps the pin's scroll distance
 * as padding and translates the stage to its foot, which a still image shows
 * as a viewport-sized void above each stage. The collapsed height is given
 * back as a tail at the document's end, so the scroll position (and with it
 * every ScrollTrigger's progress) does not move; the caller crops the tail.
 */
async function flatten(page) {
  return page.evaluate(
    ({ id, tail }) => {
      const fixed = []
      const sticky = []
      for (const el of document.querySelectorAll('body *')) {
        const pos = getComputedStyle(el).position
        if (pos === 'fixed') fixed.push(el)
        else if (pos === 'sticky') sticky.push(el)
      }
      const collapsed = [...document.querySelectorAll('.pin-spacer')].reduce((sum, el) => {
        const cs = getComputedStyle(el)
        return sum + Number.parseFloat(cs.paddingTop) + Number.parseFloat(cs.paddingBottom)
      }, 0)
      fixed.forEach((el) => el.setAttribute('data-capture-hide', ''))
      sticky.forEach((el) => el.setAttribute('data-capture-flow', ''))
      const style = document.createElement('style')
      style.id = id
      style.textContent =
        '[data-capture-hide]{visibility:hidden!important}' +
        '[data-capture-flow]{position:relative!important;top:auto!important;bottom:auto!important}' +
        '.pin-spacer{height:auto!important;padding:0!important}' +
        '.pin-spacer>*{transform:none!important}'
      document.head.append(style)
      const spacer = document.createElement('div')
      spacer.id = tail
      spacer.style.height = `${collapsed}px`
      document.body.append(spacer)
      return { fixed: fixed.length, sticky: sticky.length, collapsed: Math.round(collapsed) }
    },
    { id: HIDE_ID, tail: TAIL_ID }
  )
}

const TAIL_ID = 'palette-capture-tail'

async function unflatten(page) {
  await page.evaluate(
    (ids) => {
      for (const id of ids) document.getElementById(id)?.remove()
      for (const el of document.querySelectorAll('[data-capture-hide],[data-capture-flow]')) {
        el.removeAttribute('data-capture-hide')
        el.removeAttribute('data-capture-flow')
      }
    },
    [HIDE_ID, TAIL_ID]
  )
}

/** B: the page scrolled through, full height, no fixed chrome. */
async function shotScrolled(page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(SETTLE_MS)
  const flattened = await flatten(page)
  await page.evaluate(frame)
  const buffer = await page.screenshot({ fullPage: true, animations: 'disabled' })
  await unflatten(page)
  return { buffer, flattened }
}

/** A: the first viewport at rest, chrome included. */
async function shotTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(SETTLE_MS)
  return page.screenshot({ fullPage: false, animations: 'disabled' })
}

/**
 * Viewport-sized, textless, click-through fixed layers (the grain and the
 * vignette) exist once per viewport, so a full-page image can only show them
 * over its first screen, leaving a seam. They are left out of both shots.
 */
async function hideOverlays(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const overlays = [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed' || cs.pointerEvents !== 'none') return false
      const r = el.getBoundingClientRect()
      return r.width >= vw * 0.95 && r.height >= vh * 0.95 && !el.textContent?.trim()
    })
    for (const el of overlays) el.style.setProperty('visibility', 'hidden', 'important')
    return overlays.length
  })
}

/** The rest state: A laid over the top of B. */
export async function captureAtRest(page, outPath) {
  const pendingImages = await waitForImages(page)
  const overlays = await hideOverlays(page)
  const { buffer: full, flattened } = await shotScrolled(page)
  const top = await shotTop(page)
  const [fullMeta, topMeta] = await Promise.all([sharp(full).metadata(), sharp(top).metadata()])
  const scale = fullMeta.width / (await page.evaluate(() => window.innerWidth))
  const height = Math.max(topMeta.height, fullMeta.height - Math.round(flattened.collapsed * scale))
  const body = await sharp(full)
    .extract({ left: 0, top: 0, width: fullMeta.width, height: Math.min(height, fullMeta.height) })
    .toBuffer()
  await sharp(body)
    .composite([{ input: top, left: 0, top: 0 }])
    .png()
    .toFile(outPath)
  return { pendingImages, flattened: { ...flattened, overlays }, height }
}

/**
 * Stale colour audit: any computed colour on the page that is still one of
 * the site's own core colours, for palettes other than Current. A hit means
 * some colour path is not covered by the injection.
 */
export async function staleColours(page, siteCore) {
  return page.evaluate((core) => {
    const toRgb = (hex) => {
      const n = Number.parseInt(hex.slice(1), 16)
      return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
    }
    const wanted = new Map(Object.entries(core).map(([k, hex]) => [toRgb(hex), k]))
    const props = [
      'color',
      'background-color',
      'border-top-color',
      'border-bottom-color',
      'outline-color',
      'fill',
      'stroke',
      'background-image',
    ]
    const hits = {}
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      for (const prop of props) {
        const value = cs.getPropertyValue(prop)
        for (const m of value.matchAll(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/g)) {
          if (m[4] === '0') continue
          const key = wanted.get(`${m[1]}, ${m[2]}, ${m[3]}`)
          if (!key) continue
          const cls = typeof el.className === 'string' ? el.className.split(' ')[0] : ''
          const label = `${key} in ${prop} on ${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`
          hits[label] = (hits[label] ?? 0) + 1
        }
      }
    }
    return hits
  }, siteCore)
}
