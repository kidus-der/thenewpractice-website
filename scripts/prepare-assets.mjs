/**
 * prepare-assets.mjs — asset pipeline for the demo.
 *
 * Downloads placeholder frames and maps each one into the brand's two-colour
 * range — canopy green in the shadows, bone in the highlights — per
 * docs/08-asset-pipeline.md. Writes AVIF + WebP derivatives plus an LQIP
 * manifest into public/media and src/content/media.ts.
 *
 * PLACEHOLDER SOURCE. Every frame is a stand-in from Lorem Picsum (Unsplash
 * Licence). None of it was shot in the Riviera Maya. The duotone is what makes
 * a set of unrelated stock photographs read as one commission — and it is the
 * reason the geography does not fight the identity. See design/ASSETS.md.
 *
 * Run: npm run assets
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = join(process.cwd(), 'public', 'media')
const MANIFEST = join(process.cwd(), 'src', 'content', 'media.ts')

/**
 * The two ends of the brand's range. Nothing is mapped outside them.
 *
 * The shadow is a *lifted* canopy green rather than the identity's #14231C:
 * mapped straight, the dark end crushes to near-black and the green never
 * reads — the frames come back looking like plain greyscale. Lifting the
 * shadow point is what makes the duotone legible as a colour decision.
 */
const SHADOW = { r: 0x18, g: 0x2a, b: 0x21 }
const HIGHLIGHT = { r: 0xe9, g: 0xe2, b: 0xd3 }

const GRADE = {
  contrast: 0.95,
  /** Negative: these frames want to sit low and deep, not open and airy. */
  lift: -22,
  gamma: 1,
  /** How far each frame travels toward pure duotone. 1 = fully in-brand. */
  strength: 1,
}

const FRAMES = [
  // key, picsum id, w, h, crop position, exposure trim
  { key: 'hero', id: 189, w: 2400, h: 1350, pos: 'centre', ev: 2 },
  { key: 'plate-01', id: 11, w: 1040, h: 1387, pos: 'centre', ev: -30 },
  { key: 'plate-02', id: 194, w: 1040, h: 1387, pos: 'centre', ev: -34 },
  { key: 'plate-03', id: 326, w: 1040, h: 1387, pos: 'centre', ev: -12 },
  { key: 'plate-04', id: 15, w: 1040, h: 1387, pos: 'centre', ev: -6 },
  { key: 'plate-05', id: 28, w: 1040, h: 1387, pos: 'centre', ev: -40 },
  { key: 'discretion', id: 338, w: 2100, h: 900, pos: 'centre', ev: -10 },
  { key: 'team-01', id: 189, w: 560, h: 747, pos: 'left', ev: 4 },
  { key: 'team-02', id: 15, w: 560, h: 747, pos: 'right', ev: -6 },
  { key: 'team-03', id: 194, w: 560, h: 747, pos: 'centre', ev: -34 },
]

async function fetchSource(id) {
  // Ask for generously larger than target so the crop has room to be brave.
  const url = `https://picsum.photos/id/${id}/3000/2000`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Greyscale, then remap the single channel across SHADOW→HIGHLIGHT. sharp's
 * linear() takes per-channel multipliers and offsets, which is exactly the
 * shape of a duotone: out = (high - low)/255 * grey + low.
 */
function duotone(pipeline) {
  const k = GRADE.strength
  const lerp = (a, b) => a + (b - a) * k
  const low = {
    r: lerp(0, SHADOW.r),
    g: lerp(0, SHADOW.g),
    b: lerp(0, SHADOW.b),
  }
  const high = {
    r: lerp(255, HIGHLIGHT.r),
    g: lerp(255, HIGHLIGHT.g),
    b: lerp(255, HIGHLIGHT.b),
  }
  return (
    pipeline
      // modulate, not greyscale(): greyscale collapses to a single band and
      // linear() cannot expand bands, so the per-channel map below would fail.
      .modulate({ saturation: 0 })
      .linear(
        [(high.r - low.r) / 255, (high.g - low.g) / 255, (high.b - low.b) / 255],
        [low.r, low.g, low.b]
      )
  )
}

async function grade(buf, { w, h, pos, ev = 0 }) {
  // ev is a per-frame exposure trim in 0–255 units. Source frames vary a lot
  // in brightness and a single global curve leaves the airy ones washed out.
  //
  // Two passes on purpose: sharp stores a single linear() per pipeline, so
  // chaining exposure and the duotone map on one instance silently discards
  // the first — the frames come back correctly toned and wrongly exposed.
  const exposed = await sharp(buf)
    .resize(w, h, { fit: 'cover', position: pos })
    .linear(GRADE.contrast, GRADE.lift + ev)
    .png()
    .toBuffer()

  return duotone(sharp(exposed))
}

async function lqip(buf) {
  const small = await sharp(buf)
    .resize(20, null, { fit: 'inside' })
    .webp({ quality: 40 })
    .toBuffer()
  return `data:image/webp;base64,${small.toString('base64')}`
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const manifest = {}

  for (const frame of FRAMES) {
    process.stdout.write(`  ${frame.key} … `)
    const src = await fetchSource(frame.id)
    const graded = await grade(src, frame)
    const base = await graded.png().toBuffer()

    await sharp(base)
      .avif({ quality: 55, effort: 6 })
      .toFile(join(OUT, `${frame.key}.avif`))
    await sharp(base)
      .webp({ quality: 78 })
      .toFile(join(OUT, `${frame.key}.webp`))

    manifest[frame.key] = {
      src: `/media/${frame.key}.webp`,
      width: frame.w,
      height: frame.h,
      blurDataURL: await lqip(base),
    }
    console.log('done')
  }

  const body = `// GENERATED by scripts/prepare-assets.mjs — do not edit by hand.
// All imagery is PLACEHOLDER, duotoned into the brand range. See design/ASSETS.md.
export const MEDIA = ${JSON.stringify(manifest, null, 2)} as const

export type MediaKey = keyof typeof MEDIA
`
  await mkdir(join(process.cwd(), 'src', 'content'), { recursive: true })
  await writeFile(MANIFEST, body, 'utf8')
  console.log(`\nWrote ${Object.keys(manifest).length} frames → public/media`)
  console.log(`Wrote manifest → src/content/media.ts`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
