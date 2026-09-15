/**
 * prepare-video.mjs — hero loop pipeline.
 *
 * For each entry in design/media.manifest.json `video[]`: download the source
 * (cached), cut `trimSeconds` from `trimStart`, scale and crop to 1920×1080,
 * grade it toward the still duotone without going all the way (the surf must
 * still read as water — docs/02 §Treatment), close the loop with a crossfade
 * of the last `loopSeconds` into the first, and encode
 *
 *   public/video/<key>.mp4   H.264, CRF 24, preset slow, faststart, yuv420p, no audio
 *   public/video/<key>.webm  VP9, CRF 34, constant quality, no audio
 *
 * It then extracts a poster frame at 1 s from the finished loop into the cache;
 * prepare-assets.mjs puts that frame through the still grade as `<key>-poster`.
 *
 * Requires ffmpeg and ffprobe on PATH (`brew install ffmpeg`).
 *
 * Run: node scripts/prepare-video.mjs && node scripts/prepare-assets.mjs
 */
import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { POSTER_DIR, fetchCached, readManifest } from './prepare-assets.mjs'

const run = promisify(execFile)

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public', 'video')

const FRAME = { width: 1920, height: 1080 }
const POSTER_AT_SECONDS = 1

/**
 * Defaults; a manifest entry may override `crf` (mp4) and `webmCrf` when a
 * clip's texture (surf foam, wet leaves) will not fit the 4 MB budget at the
 * default. Overrides are recorded in design/ASSETS.md.
 */
const ENCODE = {
  mp4: { crf: 24, preset: 'slow' },
  webm: { crf: 34, cpuUsed: 2 },
}

/**
 * Mild temporal denoise before the encoder. Overcast footage carries sensor
 * noise that costs more bits than the picture does; smoothing it is the
 * difference between 10 MB and 4 MB at the same visible quality. Kept light
 * so the surf keeps its texture.
 */
const DENOISE = 'hqdn3d=1.5:1.5:5:5'

/**
 * The video grade: the same direction as the stills (docs/08 §The grade),
 * stopped well short of duotone.
 *
 *   curves        lift the blacks to ~6% and roll the highlights off at ~95%
 *   eq            desaturate by ~40%, ease contrast
 *   colorbalance  cool the shadows and mids toward canopy green
 */
const GRADE_FILTERS = [
  "curves=all='0/0.06 0.25/0.27 0.75/0.74 1/0.95'",
  'eq=saturation=0.6:contrast=0.95',
  'colorbalance=rs=-0.06:gs=0.05:bs=-0.02:rm=-0.04:gm=0.03:bm=-0.02:rh=-0.02:gh=0.02:bh=-0.01',
].join(',')

const SCALE_CROP = [
  `scale=${FRAME.width}:${FRAME.height}:force_original_aspect_ratio=increase`,
  `crop=${FRAME.width}:${FRAME.height}`,
].join(',')

/**
 * Seamless loop by crossfade. Given source S from `trimStart` for L + d seconds:
 *   main = S[d .. L+d]   (length L)
 *   head = S[0 .. d]     (length d)
 * xfade main→head over the last d seconds. Output length is L, its first frame
 * is S[d] and its last frame has faded fully into S[d], so the join is invisible.
 */
function buildFilterGraph({ trimSeconds, loopSeconds }) {
  const L = trimSeconds
  const d = loopSeconds
  return [
    `[0:v]${SCALE_CROP},split[a][b]`,
    `[a]trim=start=${d}:end=${L + d},setpts=PTS-STARTPTS[main]`,
    `[b]trim=start=0:end=${d},setpts=PTS-STARTPTS[head]`,
    `[main][head]xfade=transition=fade:duration=${d}:offset=${L - d}[looped]`,
    `[looped]${GRADE_FILTERS},${DENOISE},format=yuv420p[out]`,
  ].join(';')
}

function inputArgs(source, { trimStart, trimSeconds, loopSeconds }) {
  return ['-ss', String(trimStart), '-t', String(trimSeconds + loopSeconds), '-i', source]
}

async function encodeMp4(source, video, out) {
  const crf = video.crf ?? ENCODE.mp4.crf
  await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    ...inputArgs(source, video),
    '-filter_complex', buildFilterGraph(video), '-map', '[out]',
    '-an',
    '-c:v', 'libx264', '-crf', String(crf), '-preset', ENCODE.mp4.preset,
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    out,
  ])
}

async function encodeWebm(source, video, out) {
  const crf = video.webmCrf ?? ENCODE.webm.crf
  await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    ...inputArgs(source, video),
    '-filter_complex', buildFilterGraph(video), '-map', '[out]',
    '-an',
    '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0',
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', String(ENCODE.webm.cpuUsed),
    '-pix_fmt', 'yuv420p',
    out,
  ])
}

async function extractPoster(mp4, key) {
  await mkdir(POSTER_DIR, { recursive: true })
  const out = join(POSTER_DIR, `${key}-poster.png`)
  await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(POSTER_AT_SECONDS), '-i', mp4,
    '-frames:v', '1', out,
  ])
  return out
}

async function probe(file) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration,size',
    '-of', 'json', file,
  ])
  const info = JSON.parse(stdout)
  const video = info.streams.find((s) => s.codec_type === 'video')
  const audio = info.streams.filter((s) => s.codec_type === 'audio').length
  return {
    codec: video?.codec_name,
    size: `${video?.width}x${video?.height}`,
    seconds: Number(info.format.duration).toFixed(2),
    megabytes: (Number(info.format.size) / 1e6).toFixed(2),
    audioStreams: audio,
  }
}

function assertLoopFits(video, sourceSeconds) {
  const needed = video.trimStart + video.trimSeconds + video.loopSeconds
  if (needed > sourceSeconds) {
    throw new Error(
      `${video.key}: needs ${needed}s of source (trimStart + trimSeconds + loopSeconds) but the clip is ${sourceSeconds}s`
    )
  }
}

async function prepareOne(video, log) {
  log(`  ${video.key} … download `)
  const source = await fetchCached(video.key, video.url)
  const sourceInfo = await probe(source)
  assertLoopFits(video, Number(sourceInfo.seconds))

  const mp4 = join(OUT_DIR, `${video.key}.mp4`)
  const webm = join(OUT_DIR, `${video.key}.webm`)
  log('mp4 ')
  await encodeMp4(source, video, mp4)
  log('webm ')
  await encodeWebm(source, video, webm)
  log('poster ')
  await extractPoster(mp4, video.key)
  log('done\n')

  return { key: video.key, mp4: await probe(mp4), webm: await probe(webm) }
}

function report(results, log) {
  for (const { key, mp4, webm } of results) {
    log(`  ${key}.mp4   ${mp4.codec} ${mp4.size} ${mp4.seconds}s ${mp4.megabytes} MB audio=${mp4.audioStreams}\n`)
    log(`  ${key}.webm  ${webm.codec} ${webm.size} ${webm.seconds}s ${webm.megabytes} MB audio=${webm.audioStreams}\n`)
  }
}

async function main() {
  const log = (text) => process.stdout.write(text)
  const only = process.argv.slice(2)
  const { video } = await readManifest()
  const selected = only.length ? video.filter((v) => only.includes(v.key)) : video
  if (selected.length === 0) throw new Error(`no manifest video matches ${only.join(', ')}`)

  await mkdir(OUT_DIR, { recursive: true })
  const results = []
  for (const entry of selected) results.push(await prepareOne(entry, log))
  log('\n')
  report(results, log)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
