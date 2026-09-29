/**
 * Contrast audit for every palette in design/palettes/palettes.json.
 *
 *   node scripts/palettes/contrast.mjs            → prints and writes CONTRAST.md
 *   node scripts/palettes/contrast.mjs --check    → prints; exits 1 on a failure
 *
 * Gates (main-session decision, round 1): every text/ground pair the site
 * uses as reading text clears AA — 4.5:1, or 3:1 for text ≥ 24px — and the
 * accent clears 3:1 as a non-text mark on every ground it sits on. "Current"
 * is reported, never gated: its failures are findings, not blockers.
 * Advisory rows (faint text, accent as error text, the veil descriptor) are
 * printed but do not fail the check.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { contrast, mix, over } from './color.mjs'
import { PALETTE_DIR, liftAlpha, loadPalettes } from './palettes.mjs'

/*
 * The hero scrim (Hero.css) is two layers of the scrim colour: a radial pool
 * of 0.42 behind the lockup and a vertical gradient 0.58 → 0.14 (40%) → 0.72.
 * Combined alpha at the lockup (46% down, on the pool's centre) ≈ 0.535; at
 * the lower-left words (the eyebrow ≈ 75% down, off the pool) ≈ 0.48.
 */
const SCRIM_AT_LOCKUP = 0.535
const SCRIM_AT_WORDS = 0.48
/** Image tones the hero text is tested over: the graded frame's 20% and 80%. */
const IMAGE_TONES = [0.2, 0.8]

const row = (group, label, fg, bg, min, gated = true) => ({
  group,
  label,
  fg,
  bg,
  min,
  gated,
  ratio: contrast(fg, bg),
})

function lightRows(p) {
  const { bone, sand, stone, clay } = p.core
  return [bone, sand].flatMap((bg) => {
    const name = bg === bone ? 'bone' : 'sand'
    return [
      row('light', `ink on ${name}`, p.ink, bg, 4.5),
      row('light', `muted (stone) on ${name}`, stone, bg, 4.5),
      row('light', `faint (clay) on ${name}`, clay, bg, 3, false),
    ]
  })
}

function darkRows(p) {
  const { canopy, canopySoft } = p.core
  const fg = p.dark.fg
  return [
    [canopy, 'canopy'],
    [canopySoft, 'canopy-soft'],
  ].flatMap(([bg, name]) => [
    row('dark', `fg on ${name}`, fg, bg, 4.5),
    row(
      'dark',
      `muted (fg ${liftAlpha(0.64, p.dark.lift).toFixed(2)}) on ${name}`,
      over(fg, liftAlpha(0.64, p.dark.lift), bg),
      bg,
      4.5
    ),
    row(
      'dark',
      `faint (fg ${liftAlpha(0.4, p.dark.lift).toFixed(2)}) on ${name}`,
      over(fg, liftAlpha(0.4, p.dark.lift), bg),
      bg,
      3,
      false
    ),
  ])
}

/** The worst of the two image tones for one piece of hero text. */
function heroRow(p, label, textAlpha, scrimAlpha, min, gated = true) {
  const s = Math.min(1, scrimAlpha * p.scrim.strength)
  const candidates = IMAGE_TONES.map((t) => {
    const image = mix(p.grade.shadow, p.grade.highlight, t)
    const ground = over(p.scrim.colour, s, image)
    return row('hero', label, over(p.dark.fg, textAlpha, ground), ground, min, gated)
  })
  return candidates.reduce((a, b) => (a.ratio <= b.ratio ? a : b))
}

function heroRows(p) {
  const lift = (a) => liftAlpha(a, p.dark.lift)
  return [
    heroRow(p, 'wordmark (≥ 24px) at the lockup', 1, SCRIM_AT_LOCKUP, 3),
    heroRow(
      p,
      `tagline (fg ${lift(0.72).toFixed(2)}) at the lockup`,
      lift(0.72),
      SCRIM_AT_LOCKUP,
      4.5
    ),
    heroRow(p, 'title (≥ 24px) lower left', 1, SCRIM_AT_WORDS, 3),
    heroRow(p, `eyebrow (fg ${lift(0.72).toFixed(2)}) lower left`, lift(0.72), SCRIM_AT_WORDS, 4.5),
    heroRow(p, `cue (fg ${lift(0.5).toFixed(2)})`, lift(0.5), SCRIM_AT_WORDS, 4.5, false),
  ]
}

function accentRows(p) {
  const { brass, bone, sand, canopy, canopySoft } = p.core
  return [
    row('accent', 'accent mark on bone', brass, bone, 3),
    row('accent', 'accent mark on sand', brass, sand, 3),
    row('accent', 'accent mark on canopy', brass, canopy, 3),
    row('accent', 'accent mark on canopy-soft', brass, canopySoft, 3, false),
    row('accent', 'accent as error text on bone', brass, bone, 4.5, false),
  ]
}

function veilRows(p) {
  const { canopy } = p.core
  const a = liftAlpha(0.42, p.dark.lift)
  return [
    row('veil', 'curtain / preloader lockup', p.dark.fg, canopy, 3),
    row(
      'veil',
      `preloader descriptor (fg ${a.toFixed(2)})`,
      over(p.dark.fg, a, canopy),
      canopy,
      4.5,
      false
    ),
  ]
}

export function auditPalette(p) {
  const rows = [...lightRows(p), ...darkRows(p), ...heroRows(p), ...accentRows(p), ...veilRows(p)]
  const gatedFailures = rows.filter((r) => r.gated && r.ratio < r.min)
  const advisories = rows.filter((r) => !r.gated && r.ratio < r.min)
  return { palette: p, rows, gatedFailures, advisories, gates: p.family !== 'current' }
}

const fmt = (r) => r.toFixed(2)

function tableFor({ rows }) {
  const lines = [
    '| Pair | Foreground | Ground | Ratio | Needs | |',
    '| ---- | ---------- | ------ | ----: | ----: | - |',
  ]
  for (const r of rows) {
    const verdict = r.ratio >= r.min ? 'pass' : r.gated ? '**FAIL**' : 'advisory'
    lines.push(
      `| ${r.group}: ${r.label} | \`${r.fg}\` | \`${r.bg}\` | ${fmt(r.ratio)} | ${r.min} | ${verdict} |`
    )
  }
  return lines.join('\n')
}

function summaryLine(a) {
  const p = a.palette
  const minOf = (group) =>
    Math.min(...a.rows.filter((r) => r.group === group && r.gated).map((r) => r.ratio))
  const status = !a.gates
    ? `reported only (${a.gatedFailures.length} below the bar)`
    : a.gatedFailures.length
      ? `**${a.gatedFailures.length} FAIL**`
      : 'all gated pairs pass'
  return `| ${p.name} | ${p.family} | ${fmt(minOf('light'))} | ${fmt(minOf('dark'))} | ${fmt(minOf('hero'))} | ${fmt(minOf('accent'))} | ${status} |`
}

export function renderReport(audits) {
  const head = `# Palette contrast report

Generated by \`node scripts/palettes/contrast.mjs\` from \`design/palettes/palettes.json\`. Do not edit by hand.

**The bar** (round 1, main-session decision). Every text/ground pair the site uses as reading text clears WCAG AA: 4.5:1, or 3:1 for text at 24px and above. The accent clears 3:1 as a non-text mark (the gold point, rules, the focus ring, ticks) on every ground it sits on: bone, sand and canopy. Semi-transparent text is composited onto its ground before measuring. _Current_ is measured and reported, never gated.

**Hero rows are estimates.** The hero text sits on a scrim over a photograph. The scrim's combined alpha is taken at the lockup (${SCRIM_AT_LOCKUP}) and at the lower-left words (${SCRIM_AT_WORDS}) from \`Hero.css\`, and the photograph is modelled as the palette's graded tone at ${IMAGE_TONES.map((t) => `${t * 100}%`).join(' and ')} between shadow and highlight; the worse of the two is reported. A frame brighter or darker than that in the text's exact spot can do worse.

**Advisory rows** are measured and printed, never gated: faint text (\`--fg-faint\`, decorative only, docs/03), the hero cue, the preloader descriptor, the accent on canopy-soft (no mark sits there today) and the accent as error text. The last one is a finding against the site as built: \`.field__error\` sets form errors in \`--accent\`, which is 4.5:1 on bone in no palette that also keeps the accent 3:1 on the dark ground. Errors should move to ink.

**Two families, set by the accent.** One accent at 3:1 against both bone and the dark ground needs the two grounds about 9:1 apart, so the dark ground can lift only so far with bone type on it. The _deep_ palettes (Jungle Shade, Cenote, Clay) take that route: the dark ground rises from the site's luminance 0.014 to about 0.037, keeps bone type, and lifts dark-ground text alphas (\`dark.lift\`) and the hero scrim (\`scrim.strength\`) to hold AA over a lighter veil. The _light_ palettes invert the dark ground into a mid-light tone (luminance 0.4 to 0.6) set with ink, give the hero a light scrim and ink lockup, and darken the point to a bronze that holds 3:1 on every ground; the chrome, menu, curtain and preloader follow the same pairing.

**Captures** of the real site in any palette: \`node scripts/palettes/capture.mjs --palettes=<ids>\` against a running production build (see the script's header).

## Summary (lowest gated ratio per group)

| Palette | Family | Light | Dark | Hero | Accent | Status |
| ------- | ------ | ----: | ---: | ---: | -----: | ------ |
${audits.map(summaryLine).join('\n')}
`
  const sections = audits.map(
    (a) => `## ${a.palette.name}\n\n_${a.palette.character}_\n\n${tableFor(a)}\n`
  )
  return `${head}\n${sections.join('\n')}`
}

/** The report as the repo's Prettier would leave it, so `format` never churns it. */
async function formatted(markdown, file) {
  const prettier = await import('prettier')
  const options = (await prettier.resolveConfig(file)) ?? {}
  return prettier.format(markdown, { ...options, parser: 'markdown' })
}

async function main() {
  const check = process.argv.includes('--check')
  const audits = loadPalettes().map(auditPalette)
  for (const a of audits) {
    const bad = a.gatedFailures.map((r) => `${r.label} ${fmt(r.ratio)} < ${r.min}`)
    const tag = a.gates ? (bad.length ? 'FAIL' : 'ok  ') : 'ref '
    console.log(`${tag} ${a.palette.id.padEnd(14)} ${bad.join('; ')}`)
  }
  if (!check) {
    const out = join(PALETTE_DIR, 'CONTRAST.md')
    writeFileSync(out, await formatted(renderReport(audits), out))
    console.log(`wrote ${out}`)
  }
  const failing = audits.filter((a) => a.gates && a.gatedFailures.length)
  if (failing.length) process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
