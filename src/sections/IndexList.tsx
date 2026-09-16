'use client'

/**
 * The numbered editorial list (docs/05 §T6, docs/04 §6 "Travelling glow" and
 * "Hover plate preview"). Rows are `01 — Addiction Treatment`: numeral in
 * the muted register, the title in the Didone, an optional line beneath in
 * the eyebrow register; the whole row is one link; a hairline between rows.
 *
 * One glow travels between rows on pointer and on focus — the shared RowGlow,
 * a single element, so the movement reads as one gesture — and carries the
 * brass tick in the margin. This list owns the active row; the glow follows.
 *
 * Plates appear only where a row has a media key. On a fine pointer at
 * 1024px and above with motion allowed, one 3:4 plate follows the pointer
 * and swaps image per row (the shared HoverPlate). On touch, or under reduced
 * motion, each row shows its plate as a static thumbnail instead. With no
 * images anywhere — the three collections today — nothing is added.
 */
import Link from 'next/link'
import { useRef, useState } from 'react'
import './IndexList.css'
import { Plate } from '@/components/Plate'
import { hasRowImages, type IndexRow } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import { releaseRow } from '@/lib/rowGlow'
import { Reveal } from '@/motion/Reveal'
import { DESKTOP, useMediaQuery, useRichPointer } from '@/motion/useMediaQuery'
import { HoverPlate } from '@/components/HoverPlate'
import { RowGlow } from './RowGlow'

/** The static thumbnail column is 96px wide at most (IndexList.css). */
const THUMB_SIZES = '96px'

type Props = { rows: readonly IndexRow[] }

export function IndexList({ rows }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)

  const richPointer = useRichPointer()
  const desktop = useMediaQuery(DESKTOP)
  const withImages = hasRowImages(rows)
  const followPlate = withImages && desktop && richPointer
  const staticThumbs = withImages && !followPlate

  const clear = (index: number) => setActive((current) => releaseRow(current, index))
  const activeMedia = active === null ? null : (rows[active]?.media ?? null)
  const plates = rows.flatMap((row) => (row.media ? [row.media] : []))

  return (
    <div className="index-list" ref={wrap} onPointerLeave={() => setActive(null)}>
      <RowGlow within={wrap} rows=".index-list__row" active={active} />

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

      {followPlate && <HoverPlate within={wrap} plates={plates} active={activeMedia} />}
    </div>
  )
}
