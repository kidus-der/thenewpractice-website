'use client'

/**
 * The numbered editorial list (docs/05 §T6, docs/04 §6 "Travelling glow" and
 * "Hover plate preview"). Rows are `01 — Addiction Treatment`: numeral in
 * the muted register, the title in the Didone, an optional line beneath in
 * the eyebrow register; the whole row is one link; a hairline between rows.
 *
 * One glow travels between rows on pointer and on focus — a single element,
 * so the movement reads as one gesture — and carries the brass tick in the
 * margin. It is GSAP (docs/04 §0 lists it there): `y` as a transform over
 * --d-base on the expo curve, instant under reduced motion.
 *
 * Plates appear only where a row has a media key. On a fine pointer at
 * 1024px and above with motion allowed, one 3:4 plate follows the pointer
 * and swaps image per row (IndexPlate, Motion). On touch, or under reduced
 * motion, each row shows its plate as a static thumbnail instead. With no
 * images anywhere — the three collections today — nothing is added.
 */
import Link from 'next/link'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import './IndexList.css'
import { Plate } from '@/components/Plate'
import { hasRowImages, type IndexRow } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import { gsap } from '@/motion/gsap'
import { Reveal } from '@/motion/Reveal'
import { D, E } from '@/motion/tokens'
import { DESKTOP, MOTION_OK, useMediaQuery, useRichPointer } from '@/motion/useMediaQuery'
import { IndexPlate } from './IndexPlate'

/** The static thumbnail column is 96px wide at most (IndexList.css). */
const THUMB_SIZES = '96px'

type Props = { rows: readonly IndexRow[] }

/** Moves the glow to the active row; hides it when there is none. */
function useTravellingGlow(
  glow: RefObject<HTMLSpanElement | null>,
  wrap: RefObject<HTMLDivElement | null>,
  active: number | null,
  motionOk: boolean
) {
  useLayoutEffect(() => {
    const el = glow.current
    // Queried rather than ref'd: <Reveal> owns its ref and does not forward one.
    const ol = wrap.current?.querySelector<HTMLOListElement>('.index-list__rows')
    if (!el || !ol) return

    // Under reduced motion the glow is placed, not moved: gsap.set lands in
    // this same layout pass, where a zero-length tween would wait a tick.
    if (active === null) {
      if (!motionOk) gsap.set(el, { opacity: 0 })
      else gsap.to(el, { opacity: 0, duration: D.fast, ease: E.outQuart, overwrite: 'auto' })
      return
    }
    const row = ol.children[active]
    if (!(row instanceof HTMLElement)) return

    // The glow is out of flow; its height is set, never animated. The bleed
    // past the row is the stylesheet's (padding and a negative top margin),
    // so only the row's own box is measured here.
    const target = { y: row.offsetTop, opacity: 1 }
    gsap.set(el, { height: row.offsetHeight })
    if (!motionOk) {
      gsap.set(el, target)
      return
    }
    gsap.to(el, { ...target, duration: D.base, ease: E.outExpo, overwrite: 'auto' })
  }, [glow, wrap, active, motionOk])
}

export function IndexList({ rows }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState<number | null>(null)

  const motionOk = useMediaQuery(MOTION_OK)
  const richPointer = useRichPointer()
  const desktop = useMediaQuery(DESKTOP)
  const withImages = hasRowImages(rows)
  const followPlate = withImages && desktop && richPointer
  const staticThumbs = withImages && !followPlate

  useTravellingGlow(glow, wrap, active, motionOk)

  const clear = (index: number) => setActive((current) => (current === index ? null : current))
  const activeMedia = active === null ? null : (rows[active]?.media ?? null)

  return (
    <div className="index-list" ref={wrap} onPointerLeave={() => setActive(null)}>
      <span
        className="index-list__glow"
        ref={glow}
        aria-hidden="true"
        data-row={active ?? undefined}
      />

      <Reveal as="ol" staggerChildren className="index-list__rows">
        {rows.map((row, i) => (
          <li
            key={row.href}
            className="index-list__row"
            data-active={active === i ? 'true' : undefined}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => clear(i)}
          >
            <Link className="index-list__link" href={row.href}>
              <span className="index-list__numeral t-eyebrow" aria-hidden="true">
                {numeral(i + 1)}
              </span>
              <span className="index-list__text">
                <span className="index-list__title t-d3">{row.title}</span>
                {row.meta && <span className="index-list__meta t-eyebrow">{row.meta}</span>}
              </span>
              {staticThumbs && row.media && (
                <span className="index-list__thumb" aria-hidden="true">
                  <Plate media={row.media} alt="" sizes={THUMB_SIZES} />
                </span>
              )}
            </Link>
          </li>
        ))}
      </Reveal>

      {followPlate && <IndexPlate containerRef={wrap} rows={rows} activeMedia={activeMedia} />}
    </div>
  )
}
