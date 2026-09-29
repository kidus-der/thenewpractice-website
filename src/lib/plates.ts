/**
 * Per-frame image decisions for <Plate> (docs/08 §Formats and sizes, Task 20).
 *
 * next/image re-encodes every frame per served width at quality 75; the sizes
 * that ship are read with the Playwright audit in the Task 20 ledger entry,
 * not from disk. One frame, the canopy silhouette `index-01`, is so
 * high-frequency that at 75 it is 156 kB at 640 wide and 424 kB at 1080; a
 * lower quality is the only lever short of replacing the frame, and the
 * duotone grade plus the grain overlay hide the difference at plate size.
 * Every quality named here must be listed in `images.qualities`
 * (next.config.ts), or Next coerces it to the nearest allowed value.
 */
import { MEDIA, type MediaKey } from '@/content/media'
import { plateRatio } from '@/lib/interior'

export const DEFAULT_PLATE_QUALITY = 75
export const REDUCED_PLATE_QUALITY = 60
export const LOW_PLATE_QUALITY = 45

/**
 * Frames still over budget at the reduced quality where they are served most:
 * the kapok roots beside the manifesto (round 1, R3) are 138 kB at 750 wide
 * and 60 (122 kB at 50), the width 3× phones and 2× tablets take; 45 brings
 * them under the 120 kB plate budget (R9, measured on the production server).
 */
const LOW_QUALITY_FRAMES: ReadonlySet<MediaKey> = new Set<MediaKey>(['home-philosophy'])

/** Frames that ship below the default quality, with the reason kept beside the key. */
const REDUCED_QUALITY_FRAMES: ReadonlySet<MediaKey> = new Set<MediaKey>([
  // canopy silhouette: 424 kB at 1080 wide and quality 75; 372 kB at 60
  'index-01',
  // round 1 (R4a): graded frames over the 120 kB budget on disk (webp at 1040 wide)
  'about-ceiba', // 265 kB
  'process-lead-clinician', // 173 kB
  'about-practice', // 155 kB
  'fees', // 154 kB
  'about-founder', // 129 kB
])

export function plateQuality(media: MediaKey): number {
  if (LOW_QUALITY_FRAMES.has(media)) return LOW_PLATE_QUALITY
  return REDUCED_QUALITY_FRAMES.has(media) ? REDUCED_PLATE_QUALITY : DEFAULT_PLATE_QUALITY
}

/** Whether a frame is one of the standing 3:4 plates (they are capped to part of a column). */
export function isPortrait(media: MediaKey): boolean {
  const frame = MEDIA[media]
  return plateRatio(frame.width, frame.height) === '3:4'
}
