/**
 * Regrades the site's stills and video posters into a palette's duotone.
 *
 * The pipeline (scripts/prepare-assets.mjs) maps a greyscale frame linearly
 * onto SHADOW → HIGHLIGHT. That map is invertible: each served pixel gives
 * back its grey level t = (v − shadow) / (highlight − shadow), averaged over
 * the three channels, and t is mapped onto the palette's own shadow →
 * highlight. So the regrade reads whatever is in public/media today (other
 * tasks add frames; nothing here names them) and needs no network or
 * source files. SHADOW and HIGHLIGHT are read out of prepare-assets.mjs so a
 * change to the house grade is followed without an edit here.
 *
 * Output: design/palettes/out/graded/<palette>/<key>.webp (gitignored). The
 * capture serves these by request interception; public/ is never written.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import sharp from 'sharp'
import { parseHex } from './color.mjs'
import { PALETTES_FILE, PALETTE_DIR, ROOT } from './palettes.mjs'

export const MEDIA_DIR = join(ROOT, 'public', 'media')
export const GRADED_DIR = join(PALETTE_DIR, 'out', 'graded')
const PIPELINE = join(ROOT, 'scripts', 'prepare-assets.mjs')

/** The house duotone, read from the pipeline's source. */
export function houseGrade() {
  const src = readFileSync(PIPELINE, 'utf8')
  const read = (name) => {
    const m = new RegExp(
      `const ${name} = \\{ r: (0x[0-9a-f]+|\\d+), g: (0x[0-9a-f]+|\\d+), b: (0x[0-9a-f]+|\\d+) \\}`,
      'i'
    ).exec(src)
    if (!m) throw new Error(`Could not read ${name} from prepare-assets.mjs`)
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
  }
  return { shadow: read('SHADOW'), highlight: read('HIGHLIGHT') }
}

/** Every served still: the WebP twin of each frame in public/media. */
export function mediaKeys() {
  if (!existsSync(MEDIA_DIR)) return []
  return readdirSync(MEDIA_DIR)
    .filter((f) => f.endsWith('.webp'))
    .map((f) => basename(f, '.webp'))
    .sort()
}

/** Per-pixel inverse of the house duotone, then the palette's duotone. */
function remap(data, channels, from, to) {
  const out = Buffer.alloc(data.length)
  const lo = [from.shadow.r, from.shadow.g, from.shadow.b]
  const span = [from.highlight.r - lo[0], from.highlight.g - lo[1], from.highlight.b - lo[2]]
  const toLo = [to.shadow.r, to.shadow.g, to.shadow.b]
  const toSpan = [to.highlight.r - toLo[0], to.highlight.g - toLo[1], to.highlight.b - toLo[2]]
  for (let i = 0; i < data.length; i += channels) {
    let t = 0
    for (let c = 0; c < 3; c++) t += (data[i + c] - lo[c]) / span[c]
    t = Math.min(1, Math.max(0, t / 3))
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(toLo[c] + toSpan[c] * t)
    for (let c = 3; c < channels; c++) out[i + c] = data[i + c]
  }
  return out
}

async function gradeOne(key, target, house, outPath) {
  const { data, info } = await sharp(join(MEDIA_DIR, `${key}.webp`))
    .raw()
    .toBuffer({ resolveWithObject: true })
  const mapped = remap(data, info.channels, house, target)
  await sharp(mapped, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .webp({ quality: 82 })
    .toFile(outPath)
}

const mtime = (path) => (existsSync(path) ? statSync(path).mtimeMs : 0)

/**
 * Grades every served still for one palette, skipping frames already graded
 * since both the source frame and palettes.json last changed. Returns the
 * directory the graded frames are in.
 */
export async function gradePalette(palette, { log = () => {} } = {}) {
  const dir = join(GRADED_DIR, palette.id)
  mkdirSync(dir, { recursive: true })
  const house = houseGrade()
  const target = {
    shadow: parseHex(palette.grade.shadow),
    highlight: parseHex(palette.grade.highlight),
  }
  const stamp = mtime(PALETTES_FILE)
  let graded = 0
  for (const key of mediaKeys()) {
    const outPath = join(dir, `${key}.webp`)
    const fresh = mtime(outPath) > Math.max(stamp, mtime(join(MEDIA_DIR, `${key}.webp`)))
    if (fresh) continue
    await gradeOne(key, target, house, outPath)
    graded += 1
  }
  log(`graded ${graded} frame(s) for ${palette.id} → ${dir}`)
  return dir
}

async function main() {
  const { loadPalettes, selectPalettes } = await import('./palettes.mjs')
  const arg = process.argv.find((a) => a.startsWith('--palettes='))?.split('=')[1]
  const palettes = selectPalettes(loadPalettes(), arg).filter((p) => p.family !== 'current')
  for (const p of palettes) await gradePalette(p, { log: console.log })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
