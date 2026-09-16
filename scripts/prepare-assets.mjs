/**
 * prepare-assets.mjs — still-image pipeline.
 *
 * Reads design/media.manifest.json, fetches every still (cached under
 * node_modules/.cache/tnp-media), crops it to its slot's aspect, exposes it,
 * maps it into the brand duotone — canopy green in the shadows, bone in the
 * highlights — and writes AVIF + WebP + an LQIP to public/media/. It then
 * regenerates src/content/media.ts, the `as const` manifest <Plate> reads.
 *
 * Video poster frames are picked up from the cache when prepare-video.mjs has
 * run (node_modules/.cache/tnp-media/posters/<key>-poster.png) and go through
 * the same grade as `<key>-poster`, 16:9.
 *
 * Everything here is licence-free stock chosen to the art direction
 * (docs/02-art-direction.md) and logged in design/ASSETS.md. The grade is
 * documented in docs/08-asset-pipeline.md.
 *
 * Run: node scripts/prepare-video.mjs && node scripts/prepare-assets.mjs
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const MANIFEST_PATH = join(ROOT, 'design', 'media.manifest.json')
const OUT_DIR = join(ROOT, 'public', 'media')
const MEDIA_TS = join(ROOT, 'src', 'content', 'media.ts')
export const CACHE_DIR = join(ROOT, 'node_modules', '.cache', 'tnp-media')
export const SOURCE_DIR = join(CACHE_DIR, 'src')
export const POSTER_DIR = join(CACHE_DIR, 'posters')

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

/** Target pixel size per permitted aspect (docs/02 §Treatment). */
const SIZES = {
  '16:9': { width: 2400, height: 1350 },
  '3:4': { width: 1040, height: 1387 },
  '1:1': { width: 1200, height: 1200 },
  '21:9': { width: 2100, height: 900 },
}

/** Manifest `focus` → sharp crop position. Absent → attention-based crop. */
const FOCUS = {
  top: 'top',
  centre: 'centre',
  bottom: 'bottom',
}

/**
 * The two ends of the brand's range. Nothing is mapped outside them.
 * The shadow is a *lifted* canopy green, not the identity's #14231C: mapped
 * straight, the dark end crushes to near-black and the green never reads.
 */
const SHADOW = { r: 0x18, g: 0x2a, b: 0x21 }
const HIGHLIGHT = { r: 0xe9, g: 0xe2, b: 0xd3 }

const GRADE = {
  contrast: 0.95,
  /** Negative: these frames want to sit low and deep, not open and airy. */
  lift: -22,
}

const ENCODE = {
  avif: { quality: 55, effort: 6 },
  webp: { quality: 78 },
  lqip: { width: 20, quality: 40 },
}

const POSTER_ASPECT = '16:9'

// ---------------------------------------------------------------------------
// Manifest

function fail(message) {
  throw new Error(`media.manifest.json: ${message}`)
}

function validateStill(entry, index) {
  const where = `stills[${index}]`
  if (typeof entry.key !== 'string' || !/^[a-z0-9-]+$/.test(entry.key)) fail(`${where}.key`)
  if (typeof entry.url !== 'string' || !entry.url.startsWith('https://')) fail(`${where}.url`)
  if (!(entry.aspect in SIZES)) fail(`${where}.aspect must be one of ${Object.keys(SIZES)}`)
  if (typeof entry.ev !== 'number') fail(`${where}.ev must be a number`)
  if (entry.focus !== undefined && !(entry.focus in FOCUS)) fail(`${where}.focus`)
  if (typeof entry.alt !== 'string' || entry.alt.length === 0) fail(`${where}.alt is required`)
  if (typeof entry.credit !== 'string') fail(`${where}.credit is required`)
  if (typeof entry.licence !== 'string') fail(`${where}.licence is required`)
  return entry
}

function validateVideo(entry, index) {
  const where = `video[${index}]`
  if (typeof entry.key !== 'string' || !/^[a-z0-9-]+$/.test(entry.key)) fail(`${where}.key`)
  if (typeof entry.url !== 'string' || !entry.url.startsWith('https://')) fail(`${where}.url`)
  if (typeof entry.trimStart !== 'number') fail(`${where}.trimStart`)
  if (typeof entry.trimSeconds !== 'number' || entry.trimSeconds <= 0) fail(`${where}.trimSeconds`)
  if (typeof entry.posterEv !== 'number') fail(`${where}.posterEv must be a number`)
  if (typeof entry.alt !== 'string' || entry.alt.length === 0) fail(`${where}.alt is required`)
  if (typeof entry.credit !== 'string') fail(`${where}.credit is required`)
  if (typeof entry.licence !== 'string') fail(`${where}.licence is required`)
  return entry
}

export async function readManifest() {
  const raw = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  if (!Array.isArray(raw.stills) || !Array.isArray(raw.video)) fail('needs stills[] and video[]')
  return {
    stills: raw.stills.map(validateStill),
    video: raw.video.map(validateVideo),
  }
}

// ---------------------------------------------------------------------------
// Fetch (cached)

async function exists(path) {
  return access(path).then(
    () => true,
    () => false
  )
}

/** Download `url` once into the cache and return the local path. */
export async function fetchCached(key, url) {
  await mkdir(SOURCE_DIR, { recursive: true })
  const ext = extname(new URL(url).pathname) || '.bin'
  const local = join(SOURCE_DIR, `${key}${ext}`)
  if (await exists(local)) return local

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' } })
  if (!res.ok) throw new Error(`${key}: ${url} → HTTP ${res.status}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  if (bytes.length === 0) throw new Error(`${key}: empty response from ${url}`)
  await writeFile(local, bytes)
  return local
}

// ---------------------------------------------------------------------------
// Grade

/**
 * Greyscale, then remap the single channel across SHADOW→HIGHLIGHT. sharp's
 * linear() takes per-channel multipliers and offsets, which is exactly the
 * shape of a duotone: out = (high - low)/255 * grey + low.
 */
function duotone(pipeline) {
  const slope = (hi, lo) => (hi - lo) / 255
  return (
    pipeline
      // modulate, not greyscale(): greyscale collapses to one band and
      // linear() cannot expand bands, so the per-channel map would fail.
      .modulate({ saturation: 0 })
      .linear(
        [slope(HIGHLIGHT.r, SHADOW.r), slope(HIGHLIGHT.g, SHADOW.g), slope(HIGHLIGHT.b, SHADOW.b)],
        [SHADOW.r, SHADOW.g, SHADOW.b]
      )
  )
}

function cropPosition(focus) {
  return focus ? FOCUS[focus] : sharp.strategy.attention
}

/**
 * Crop → expose → duotone. Two sharp passes on purpose: a pipeline holds one
 * linear() and chaining exposure with the duotone map on one instance
 * silently discards the first.
 */
export async function gradeStill(sourcePath, { aspect, ev, focus }) {
  const { width, height } = SIZES[aspect]
  const exposed = await sharp(sourcePath)
    .rotate()
    .resize(width, height, { fit: 'cover', position: cropPosition(focus) })
    .linear(GRADE.contrast, GRADE.lift + ev)
    .png()
    .toBuffer()
  const graded = await duotone(sharp(exposed)).png().toBuffer()
  return { graded, width, height }
}

async function lqip(buffer) {
  const small = await sharp(buffer)
    .resize(ENCODE.lqip.width, null, { fit: 'inside' })
    .webp({ quality: ENCODE.lqip.quality })
    .toBuffer()
  return `data:image/webp;base64,${small.toString('base64')}`
}

async function writeDerivatives(key, graded) {
  await sharp(graded).avif(ENCODE.avif).toFile(join(OUT_DIR, `${key}.avif`))
  await sharp(graded).webp(ENCODE.webp).toFile(join(OUT_DIR, `${key}.webp`))
}

async function processStill(key, sourcePath, options, meta) {
  const { graded, width, height } = await gradeStill(sourcePath, options)
  await writeDerivatives(key, graded)
  return {
    src: `/media/${key}.webp`,
    width,
    height,
    blurDataURL: await lqip(graded),
    alt: meta.alt,
    credit: meta.credit,
    licence: meta.licence,
  }
}

// ---------------------------------------------------------------------------
// Entries

async function buildStillEntries(stills, log) {
  const entries = {}
  for (const still of stills) {
    log(`  ${still.key} (ev ${still.ev}) … `)
    const source = await fetchCached(still.key, still.url)
    entries[still.key] = await processStill(still.key, source, still, still)
    log('done\n')
  }
  return entries
}

/** Poster frames exist only after prepare-video.mjs has run; skip otherwise. */
async function buildPosterEntries(videos, log) {
  const entries = {}
  for (const video of videos) {
    const key = `${video.key}-poster`
    const frame = join(POSTER_DIR, `${key}.png`)
    if (!(await exists(frame))) {
      log(`  ${key} … skipped (run prepare-video.mjs first)\n`)
      continue
    }
    log(`  ${key} (ev ${video.posterEv}) … `)
    const alt = video.alt
    const options = { aspect: POSTER_ASPECT, ev: video.posterEv, focus: video.posterFocus }
    entries[key] = await processStill(key, frame, options, { ...video, alt })
    log('done\n')
  }
  return entries
}

async function buildVideoEntries(videos, posters) {
  const entries = {}
  for (const video of videos) {
    const mp4 = join(ROOT, 'public', 'video', `${video.key}.mp4`)
    const webm = join(ROOT, 'public', 'video', `${video.key}.webm`)
    const posterKey = `${video.key}-poster`
    if (!(await exists(mp4)) || !(await exists(webm)) || !posters[posterKey]) continue
    entries[video.key] = {
      mp4: `/video/${video.key}.mp4`,
      webm: `/video/${video.key}.webm`,
      poster: posterKey,
      width: 1920,
      height: 1080,
      seconds: video.trimSeconds,
      alt: video.alt,
      credit: video.credit,
      licence: video.licence,
    }
  }
  return entries
}

// ---------------------------------------------------------------------------
// media.ts

function renderMediaTs(media, video) {
  return `// GENERATED by scripts/prepare-assets.mjs — do not edit by hand.
// Licence-free stock, duotoned into the brand range. Provenance and licence
// per file in design/ASSETS.md; the pipeline in docs/08-asset-pipeline.md.
export const MEDIA = ${JSON.stringify(media, null, 2)} as const

export type MediaKey = keyof typeof MEDIA
export type MediaEntry = (typeof MEDIA)[MediaKey]

/** Hero and full-bleed loops. \`poster\` is a MediaKey; the poster is the LCP. */
export const VIDEO = ${JSON.stringify(video, null, 2)} as const

export type VideoKey = keyof typeof VIDEO
`
}

async function main() {
  const log = (text) => process.stdout.write(text)
  const manifest = await readManifest()
  await mkdir(OUT_DIR, { recursive: true })

  const stills = await buildStillEntries(manifest.stills, log)
  const posters = await buildPosterEntries(manifest.video, log)
  const video = await buildVideoEntries(manifest.video, posters)
  const media = { ...stills, ...posters }

  await mkdir(join(ROOT, 'src', 'content'), { recursive: true })
  await writeFile(MEDIA_TS, renderMediaTs(media, video), 'utf8')
  log(`\nWrote ${Object.keys(media).length} frames → public/media\n`)
  log(`Wrote ${Object.keys(video).length} video entries and the manifest → src/content/media.ts\n`)
}

const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
