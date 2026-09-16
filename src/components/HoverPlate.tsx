'use client'

/**
 * The hover plate preview (docs/04 §6): one 3:4 plate that rides beside the
 * pointer over a list — to its right, centred on it — and shows the active
 * row's frame. One element for the whole list, never one image per row: every
 * frame the list can show is rendered once and stacked, so a swap is an
 * opacity change on a frame that is already there, not a fetch. It moves on
 * GSAP's ticker through quickTo (pointer-driven, no spring); the show and the
 * per-row crossfade are stylesheet transitions on data attributes, so no
 * element is driven by two libraries (docs/04 §0).
 *
 * Shared by the home conditions list and the index lists (ledger, Task 16
 * triage). The caller decides when it exists: from 1024px with a fine pointer
 * and motion allowed, and only when there is something to show.
 */
import { useLayoutEffect, useRef, type RefObject } from 'react'
import './HoverPlate.css'
import { Plate } from '@/components/Plate'
import type { MediaKey } from '@/content/media'
import { cn } from '@/lib/cn'
import { gsap } from '@/motion/gsap'
import { D, E } from '@/motion/tokens'

/** The plate is clamped to 240px wide (HoverPlate.css); next/image needs no more. */
const PLATE_SIZES = '240px'

type Props = Readonly<{
  /** The positioned ancestor the plate moves within and listens on. */
  within: RefObject<HTMLElement | null>
  /** Every frame the list can show, in any order; duplicates are rendered once. */
  plates: readonly MediaKey[]
  /** The frame to show, or null to hide the plate. */
  active: MediaKey | null
}>

const unique = (keys: readonly MediaKey[]): readonly MediaKey[] => Array.from(new Set(keys))

/** Follows the pointer inside `host`: x to the right of it, y centred on it. */
function useFollowPointer(
  frame: RefObject<HTMLDivElement | null>,
  host: RefObject<HTMLElement | null>
) {
  useLayoutEffect(() => {
    const el = frame.current
    const root = host.current
    if (!el || !root) return

    const ctx = gsap.context(() => {
      const toX = gsap.quickTo(el, 'x', { duration: D.base, ease: E.outExpo })
      const toY = gsap.quickTo(el, 'y', { duration: D.base, ease: E.outExpo })
      const onMove = (event: PointerEvent) => {
        const box = root.getBoundingClientRect()
        toX(event.clientX - box.left)
        toY(event.clientY - box.top)
      }
      root.addEventListener('pointermove', onMove, { passive: true })
      return () => root.removeEventListener('pointermove', onMove)
    }, el)

    return () => ctx.revert()
  }, [frame, host])
}

export function HoverPlate({ within, plates, active }: Props) {
  const frame = useRef<HTMLDivElement>(null)
  useFollowPointer(frame, within)

  return (
    <div ref={frame} className="hover-plate" data-shown={active !== null} aria-hidden="true">
      {unique(plates).map((key) => (
        <Plate
          key={key}
          media={key}
          alt=""
          sizes={PLATE_SIZES}
          className={cn('hover-plate__frame', key === active && 'is-active')}
        />
      ))}
    </div>
  )
}
