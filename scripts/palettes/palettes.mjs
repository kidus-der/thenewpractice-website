/**
 * Loads design/palettes/palettes.json, fills each palette's defaults and
 * validates it against the identity's colour rules (CLAUDE.md §3): hex only,
 * no pure black or white, no neutral grey, the seven core tokens present.
 *
 * A palette's fields, beyond the seven core tokens:
 *   ink          text on the light grounds (default: core.canopy, as today)
 *   dark.fg      text on the "dark" ground (default: core.bone, as today)
 *   dark.lift    0..1, lifts every dark-ground text alpha (≥ 0.35) toward
 *                opaque, so muted text holds on a lighter dark ground
 *   scrim        { colour, strength } for the hero scrim (default canopy, 1)
 *   grade        { shadow, highlight } — the duotone the stills are mapped to
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NEUTRAL_SPREAD, luminance, parseHex, spread } from './color.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const PALETTE_DIR = join(ROOT, 'design', 'palettes')
export const PALETTES_FILE = join(PALETTE_DIR, 'palettes.json')

/** The site's shipped core values, the keys the CSS rewrite looks for. */
export const SITE_CORE = Object.freeze({
  canopy: '#14231c',
  canopySoft: '#1c2e25',
  bone: '#f1ece0',
  sand: '#e3dccb',
  clay: '#c8b9a0',
  stone: '#566059',
  brass: '#a9895c',
})

export const CORE_KEYS = Object.freeze(Object.keys(SITE_CORE))

/** Text alphas below this are rules and hairlines; lift leaves them alone. */
export const TEXT_ALPHA_FLOOR = 0.35

/** A dark-ground text alpha after the palette's lift. */
export function liftAlpha(alpha, lift) {
  if (alpha < TEXT_ALPHA_FLOOR) return alpha
  return alpha + (1 - alpha) * lift
}

function resolve(raw) {
  const core = Object.freeze({ ...raw.core })
  return Object.freeze({
    id: raw.id,
    name: raw.name,
    family: raw.family,
    character: raw.character,
    core,
    ink: raw.ink ?? core.canopy,
    dark: Object.freeze({ fg: raw.dark?.fg ?? core.bone, lift: raw.dark?.lift ?? 0 }),
    scrim: Object.freeze({
      colour: raw.scrim?.colour ?? core.canopy,
      strength: raw.scrim?.strength ?? 1,
    }),
    grade: Object.freeze({ shadow: raw.grade.shadow, highlight: raw.grade.highlight }),
  })
}

function colourProblems(label, hex) {
  try {
    parseHex(hex)
  } catch (error) {
    return [`${label}: ${error.message}`]
  }
  const problems = []
  const l = luminance(hex)
  if (l <= 0.002 || l >= 0.95) problems.push(`${label} ${hex} is too close to black or white`)
  if (spread(hex) < NEUTRAL_SPREAD) problems.push(`${label} ${hex} is a neutral grey`)
  return problems
}

/** Every rule a palette breaks, as sentences. Empty means valid. */
export function validate(p) {
  const problems = []
  for (const field of ['id', 'name', 'family', 'character']) {
    if (!p[field]) problems.push(`missing ${field}`)
  }
  if (!/^[a-z][a-z0-9-]*$/.test(p.id ?? '')) problems.push(`id "${p.id}" must be kebab-case`)
  for (const key of CORE_KEYS) {
    if (!p.core[key]) problems.push(`core.${key} missing`)
    else problems.push(...colourProblems(`core.${key}`, p.core[key]))
  }
  problems.push(...colourProblems('ink', p.ink))
  problems.push(...colourProblems('dark.fg', p.dark.fg))
  problems.push(...colourProblems('scrim.colour', p.scrim.colour))
  problems.push(...colourProblems('grade.shadow', p.grade.shadow))
  problems.push(...colourProblems('grade.highlight', p.grade.highlight))
  if (p.dark.lift < 0 || p.dark.lift > 1) problems.push('dark.lift must be within 0..1')
  if (p.scrim.strength < 0 || p.scrim.strength > 1.4) problems.push('scrim.strength out of range')
  return problems.map((m) => `${p.id ?? '?'}: ${m}`)
}

/** All palettes, resolved and validated. Throws on the first invalid file. */
export function loadPalettes(file = PALETTES_FILE) {
  const json = JSON.parse(readFileSync(file, 'utf8'))
  const palettes = json.palettes.map(resolve)
  const problems = palettes.flatMap(validate)
  const ids = palettes.map((p) => p.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) problems.push(`duplicate ids: ${dupes.join(', ')}`)
  if (problems.length) throw new Error(`Invalid palettes:\n  ${problems.join('\n  ')}`)
  return palettes
}

/** Palettes selected by a comma list of ids, or all of them. */
export function selectPalettes(palettes, list) {
  if (!list) return palettes
  const wanted = list.split(',').map((s) => s.trim())
  const unknown = wanted.filter((id) => !palettes.some((p) => p.id === id))
  if (unknown.length) throw new Error(`Unknown palette ids: ${unknown.join(', ')}`)
  return palettes.filter((p) => wanted.includes(p.id))
}
