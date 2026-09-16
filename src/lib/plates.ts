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

/** Frames that ship below the default quality, with the reason kept beside the key. */
const REDUCED_QUALITY_FRAMES: ReadonlySet<MediaKey> = new Set<MediaKey>([
  // canopy silhouette: 424 kB at 1080 wide and quality 75; 372 kB at 60
  'index-01',
])

export function plateQuality(media: MediaKey): number {
  return REDUCED_QUALITY_FRAMES.has(media) ? REDUCED_PLATE_QUALITY : DEFAULT_PLATE_QUALITY
}

/** Whether a frame is one of the standing 3:4 plates (they are capped to part of a column). */
export function isPortrait(media: MediaKey): boolean {
  const frame = MEDIA[media]
  return plateRatio(frame.width, frame.height) === '3:4'
}
