/**
 * Colour maths for the palette tooling: hex parsing, WCAG 2.x relative
 * luminance and contrast, and source-over alpha compositing. No site code
 * imports this; it serves scripts/palettes/ only.
 */

/** '#rrggbb' → { r, g, b } in 0..255. Throws on anything else. */
export function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) throw new Error(`Not a 6-digit hex colour: ${hex}`)
  const n = Number.parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function toHex({ r, g, b }) {
  const h = (v) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

const channel = (v) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of an sRGB colour (hex or {r,g,b}). */
export function luminance(colour) {
  const { r, g, b } = typeof colour === 'string' ? parseHex(colour) : colour
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two opaque colours. */
export function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** `top` at `alpha` over opaque `bottom`, in sRGB space as browsers paint it. */
export function over(top, alpha, bottom) {
  const t = typeof top === 'string' ? parseHex(top) : top
  const u = typeof bottom === 'string' ? parseHex(bottom) : bottom
  const mix = (x, y) => x * alpha + y * (1 - alpha)
  return toHex({ r: mix(t.r, u.r), g: mix(t.g, u.g), b: mix(t.b, u.b) })
}

/** Linear sRGB-space mix: t = 0 → a, t = 1 → b. */
export function mix(a, b, t) {
  return over(b, t, a)
}

/**
 * Chroma as the spread of the sRGB channels. Below NEUTRAL_SPREAD a colour
 * reads as grey — barred by CLAUDE.md §3 (no neutral greys).
 */
export const NEUTRAL_SPREAD = 8
export function spread(hex) {
  const { r, g, b } = parseHex(hex)
  return Math.max(r, g, b) - Math.min(r, g, b)
}

/** Two-digit alpha suffix for an 8-digit hex (#rrggbbaa). */
export function alphaHex(alpha) {
  return Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
}
