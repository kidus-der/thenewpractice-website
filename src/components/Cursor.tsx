'use client'

/**
 * The quietest possible custom cursor. docs/02-art-direction.md §Cursor.
 * Desktop pointer only — a fine pointer that can hover, motion allowed, and
 * not until a mouse has actually moved; removed entirely on touch and under
 * reduced motion, with the native cursor restored.
 *
 * Three things keep it from feeling laggy, all of which matter:
 *
 * 1. LERP is high enough to read as "attached to the pointer with a little
 *    weight" rather than "trailing behind it". Below ~0.2 it feels broken on a
 *    120Hz display, which is what this audience is on.
 * 2. quickSetter, not gsap.set — set() parses the property and rebuilds the
 *    transform string every frame; quickSetter resolves that once up front.
 * 3. No mix-blend-mode. Difference blending on a viewport-fixed element forces
 *    the compositor to re-read the backdrop every frame, and on a page with a
 *    grain layer and pinned sections underneath that is the single most
 *    expensive thing the cursor was doing. --ground-fg already gives us a
 *    legible colour on either ground for free.
 */
import { useLayoutEffect, useRef } from 'react'
import { gsap } from '@/motion/gsap'
import { useRichPointer } from '@/motion/useMediaQuery'

const LERP = 0.28
/** Below this, snap. Stops the tween chasing sub-pixel deltas forever. */
const EPSILON = 0.1

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const enabled = useRichPointer()

  useLayoutEffect(() => {
    const el = dot.current
    if (!enabled || !el) return

    document.documentElement.dataset.cursor = 'custom'

    const setX = gsap.quickSetter(el, 'x', 'px') as (v: number) => void
    const setY = gsap.quickSetter(el, 'y', 'px') as (v: number) => void

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pos = { ...target }
    let dirty = true

    const onMove = (e: PointerEvent) => {
      // A touch or pen never counts, and the dot is not painted until a mouse
      // has moved: before that it sat at the viewport centre in every
      // headless capture and on touch-emulated viewports (ledger, Task 14).
      if (e.pointerType !== 'mouse') return
      if (el.dataset.seen !== 'true') {
        el.dataset.seen = 'true'
        pos.x = e.clientX
        pos.y = e.clientY
      }
      target.x = e.clientX
      target.y = e.clientY
      dirty = true

      const hit = (e.target as HTMLElement | null)?.closest(
        'a, button, input, textarea, [data-cursor]'
      ) as HTMLElement | null
      const state = hit?.dataset.cursor ?? (hit ? 'active' : 'idle')
      if (el.dataset.state !== state) el.dataset.state = state
      const label = hit?.dataset.cursorLabel ?? ''
      if (el.textContent !== label) el.textContent = label
    }

    const tick = () => {
      if (!dirty) return
      const dx = target.x - pos.x
      const dy = target.y - pos.y

      if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
        pos.x = target.x
        pos.y = target.y
        dirty = false
      } else {
        pos.x += dx * LERP
        pos.y += dy * LERP
      }

      setX(pos.x)
      setY(pos.y)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(tick)
      delete document.documentElement.dataset.cursor
    }
  }, [enabled])

  if (!enabled) return null
  return <div className="cursor t-eyebrow" ref={dot} data-state="idle" aria-hidden="true" />
}
