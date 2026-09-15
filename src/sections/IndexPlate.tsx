'use client'

/**
 * The hover plate preview (docs/04 §6): one 3:4 plate that follows the
 * pointer across an index list at a fixed offset, revealed with the `mask`
 * wipe when the active row has an image and swapping image per row with a
 * --d-fast crossfade. Motion, because it is state-driven; the pointer
 * position is written to motion values, never through React state.
 *
 * Mounted by IndexList only on a fine pointer at 1024px and above with
 * motion allowed, and only when some row carries a media key. Every image
 * the list can show is rendered once and stacked, so the swap is an opacity
 * change on a frame that is already there, not a fetch.
 */
import { motion, useMotionValue, type Variants } from 'motion/react'
import { useEffect, type RefObject } from 'react'
import './IndexPlate.css'
import { Plate } from '@/components/Plate'
import type { MediaKey } from '@/content/media'
import type { IndexRow } from '@/lib/indexPage'
import { durations } from '@/motion/motion-config'

/** The plate is clamped to 240px wide (IndexPlate.css). */
const PLATE_SIZES = '240px'

/** docs/04 §3 `mask`: hidden from the bottom, revealed downward from the top. */
const maskVariants = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: { clipPath: 'inset(0 0 0% 0)' },
} as const satisfies Variants

type Props = {
  /** The list wrapper the plate is positioned in and tracks the pointer over. */
  containerRef: RefObject<HTMLElement | null>
  rows: readonly IndexRow[]
  activeMedia: MediaKey | null
}

const uniqueMedia = (rows: readonly IndexRow[]): readonly MediaKey[] =>
  rows.reduce<readonly MediaKey[]>(
    (keys, row) => (row.media && !keys.includes(row.media) ? [...keys, row.media] : keys),
    []
  )

export function IndexPlate({ containerRef, rows, activeMedia }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const media = uniqueMedia(rows)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x.set(event.clientX - rect.left)
      y.set(event.clientY - rect.top)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => el.removeEventListener('pointermove', onMove)
  }, [containerRef, x, y])

  return (
    <motion.div
      className="index-plate"
      aria-hidden="true"
      style={{ x, y }}
      variants={maskVariants}
      initial="hidden"
      animate={activeMedia ? 'visible' : 'hidden'}
    >
      {media.map((key) => (
        <motion.div
          key={key}
          className="index-plate__frame"
          initial={false}
          animate={{ opacity: key === activeMedia ? 1 : 0 }}
          transition={{ duration: durations.fast }}
        >
          <Plate media={key} alt="" sizes={PLATE_SIZES} className="index-plate__plate" />
        </motion.div>
      ))}
    </motion.div>
  )
}
