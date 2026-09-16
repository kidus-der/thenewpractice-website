'use client'

/**
 * The travelling glow (docs/04 §6): one light that moves from the active row
 * of a hairline list to the next as the pointer or keyboard focus moves. One
 * element for the whole list, so the movement reads as a single gesture; it
 * carries the brass tick in the margin. GSAP moves it (docs/04 §0 lists it
 * there): `x`/`y` as a transform over --d-base on the expo curve; under
 * reduced motion it is placed, never moved.
 *
 * Shared by the index lists (T6) and the home page's conditions (T1 §3). The
 * list owns the active index — pointer enter, focus, blur, pointer leaving
 * the list — and this component only follows it.
 */
import { useLayoutEffect, useRef, type RefObject } from 'react'
import './RowGlow.css'
import { glowBox } from '@/lib/rowGlow'
import { gsap } from '@/motion/gsap'
import { D, E } from '@/motion/tokens'
import { MOTION_OK, useMediaQuery } from '@/motion/useMediaQuery'

type Props = Readonly<{
  /** The positioned ancestor the glow moves within; the rows are found inside it. */
  within: RefObject<HTMLElement | null>
  /** Selects the rows, in order, inside `within`. */
  rows: string
  /** The row that holds the glow, or null for none. */
  active: number | null
}>

/** Moves the glow to the active row; eases it out when there is none. */
function useTravellingGlow(
  glow: RefObject<HTMLSpanElement | null>,
  within: RefObject<HTMLElement | null>,
  rows: string,
  active: number | null,
  motionOk: boolean
) {
  useLayoutEffect(() => {
    const el = glow.current
    const host = within.current
    if (!el || !host) return

    // Under reduced motion the glow is placed, not moved: gsap.set lands in
    // this same layout pass, where a zero-length tween would wait a tick.
    if (active === null) {
      if (!motionOk) gsap.set(el, { opacity: 0 })
      else gsap.to(el, { opacity: 0, duration: D.fast, ease: E.outQuart, overwrite: 'auto' })
      return
    }
    const row = host.querySelectorAll<HTMLElement>(rows)[active]
    if (!row) return

    // The glow is out of flow; its size is set, never animated. From hidden it
    // is placed under the row and fades in there; from a row it travels.
    const { x, y, width, height } = glowBox(row)
    const hidden = Number(gsap.getProperty(el, 'opacity')) === 0
    gsap.set(el, { width, height })
    if (!motionOk || hidden) gsap.set(el, { x, y })
    if (!motionOk) {
      gsap.set(el, { opacity: 1 })
      return
    }
    gsap.to(el, { x, y, opacity: 1, duration: D.base, ease: E.outExpo, overwrite: 'auto' })
  }, [glow, within, rows, active, motionOk])
}

export function RowGlow({ within, rows, active }: Props) {
  const glow = useRef<HTMLSpanElement>(null)
  const motionOk = useMediaQuery(MOTION_OK)
  useTravellingGlow(glow, within, rows, active, motionOk)

  return <span className="row-glow" ref={glow} aria-hidden="true" data-row={active ?? undefined} />
}
