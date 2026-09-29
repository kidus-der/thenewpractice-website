/**
 * How a palette reaches a running production build without touching it.
 *
 * 1. rewriteCss() — every stylesheet response is rewritten in flight. The
 *    build minifies colour literals to hex (`rgb(20 35 28 / .14)` ships as
 *    `#14231c24`), so the rewrite works on the shipped text, by role:
 *      - the seven core hexes → the palette's core (the token definitions)
 *      - `--fg:var(--c-canopy)` / `color:var(--c-canopy)` / canopy tints in
 *        color-mix → the palette's ink (canopy doubles as ink on the site)
 *      - `--fg:var(--c-bone)` / `color:var(--c-bone)` / bone at any alpha →
 *        the palette's dark-ground text, text alphas lifted by `dark.lift`
 *      - canopy alpha inside `--rule` → ink; any other canopy alpha (the hero
 *        scrim, the vignette) → the palette's scrim colour × strength
 *    Nothing names a component or class, so pages that change shape keep
 *    working; only the token names and the house hexes are assumed.
 * 2. initScript() — runs before the app: skips the preloader for the session
 *    (the site's own `seen-veil` flag) and corrects the chrome's --ground-fg.
 *    GroundManager pairs canopy with bone and every other ground with canopy
 *    (src/components/GroundManager.tsx); a palette whose dark-ground text or
 *    ink differs needs the pairing restated, so --ground-fg writes on <html>
 *    are mapped from the --ground written just before them.
 */
import { alphaHex } from './color.mjs'
import { SITE_CORE, liftAlpha } from './palettes.mjs'

const HEX2 = '([0-9a-f]{2})'
const ALPHA_FN = (r, g, b) =>
  new RegExp(`rgba?\\(\\s*${r}[\\s,]+${g}[\\s,]+${b}\\s*[/,]\\s*([\\d.]+%?)\\s*\\)`, 'gi')

const parseAlpha = (text) => (text.endsWith('%') ? Number.parseFloat(text) / 100 : Number(text))
const hexAlpha = (hex2) => Number.parseInt(hex2, 16) / 255

/** Normalises rgb()/rgba() literals of the two alpha'd house colours to hex8. */
function toHex8(css) {
  return css
    .replace(ALPHA_FN(20, 35, 28), (_, a) => `#14231c${alphaHex(parseAlpha(a))}`)
    .replace(ALPHA_FN(241, 236, 224), (_, a) => `#f1ece0${alphaHex(parseAlpha(a))}`)
}

function rewriteRoles(css, p) {
  const ink = 'var(--pal-ink)'
  const darkFg = 'var(--pal-dark-fg)'
  return css
    .replace(/--fg\s*:\s*var\(--c-canopy\)/g, `--fg:${ink}`)
    .replace(/--fg\s*:\s*var\(--c-bone\)/g, `--fg:${darkFg}`)
    .replace(/(?<![\w-])color\s*:\s*var\(--c-canopy\)/g, `color:${ink}`)
    .replace(/(?<![\w-])color\s*:\s*var\(--c-bone\)/g, `color:${darkFg}`)
    .replace(/color-mix\(\s*in srgb\s*,\s*var\(--c-canopy\)/g, `color-mix(in srgb, ${ink}`)
    .replace(
      new RegExp(`(--rule(?:-strong)?\\s*:\\s*)#14231c${HEX2}`, 'gi'),
      (_, prop, a) => `${prop}${p.ink}${a}`
    )
    .replace(
      new RegExp(`#f1ece0${HEX2}`, 'gi'),
      (_, a) => `${p.dark.fg}${alphaHex(liftAlpha(hexAlpha(a), p.dark.lift))}`
    )
    .replace(
      new RegExp(`#14231c${HEX2}`, 'gi'),
      (_, a) => `${p.scrim.colour}${alphaHex(hexAlpha(a) * p.scrim.strength)}`
    )
}

/** One pass, so a palette value that equals another house hex is not re-mapped. */
function rewriteCore(css, p) {
  const byHex = new Map(Object.entries(SITE_CORE).map(([key, hex]) => [hex, p.core[key]]))
  const any = new RegExp(`(${[...byHex.keys()].join('|')})(?![0-9a-f])`, 'gi')
  return css.replace(any, (hex) => byHex.get(hex.toLowerCase()).toLowerCase())
}

/** The stylesheet text as it would ship with this palette. */
export function rewriteCss(css, p) {
  if (p.family === 'current') return css
  const head = `:root{--pal-ink:${p.ink};--pal-dark-fg:${p.dark.fg}}`
  return `${head}\n${rewriteCore(rewriteRoles(toHex8(css), p), p)}`
}

/** Arguments for initScript(), serialisable into the page. */
export function initArgs(p) {
  if (p.family === 'current') return { canopy: null }
  return { canopy: p.core.canopy.toLowerCase(), darkFg: p.dark.fg, ink: p.ink }
}

/** Runs in the page before any app script (page.addInitScript). */
export function initScript({ canopy, darkFg, ink }) {
  try {
    sessionStorage.setItem('thenewpractice:seen-veil', '1')
  } catch {
    // storage blocked: the veil plays and settle waits it out
  }
  if (!canopy) return
  const norm = (value) => String(value).trim().toLowerCase()
  const native = CSSStyleDeclaration.prototype.setProperty
  let ground = ''
  CSSStyleDeclaration.prototype.setProperty = function setProperty(name, value, priority) {
    const root = document.documentElement
    if (root && this === root.style) {
      if (name === '--ground') ground = norm(value)
      if (name === '--ground-fg')
        return native.call(this, name, ground === canopy ? darkFg : ink, priority)
    }
    return native.call(this, name, value, priority)
  }
}
