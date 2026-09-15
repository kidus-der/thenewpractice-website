'use client'

/**
 * The hairline rows and the plate that follows the pointer over them
 * (docs/04 §6 "Hover plate preview"). One plate element for the whole list
 * — never twelve images — with the index frames stacked inside it and the
 * row's frame brought forward with a --d-fast crossfade. It moves on GSAP's
 * ticker through quickTo (pointer-driven, no spring) and exists only from
 * 1024px with a fine pointer and motion allowed; touch and reduced motion
 * get the list alone. Every row is a real link.
 */
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'
import type { MediaKey } from '@/content/media'
import { Plate } from '@/components/Plate'
import { gsap } from '@/motion/gsap'
import { D, E } from '@/motion/tokens'
import { useMediaQuery, useRichPointer } from '@/motion/useMediaQuery'
import { Reveal } from '@/motion/Reveal'
import { plateForRow } from '@/lib/home'
import { cn } from '@/lib/cn'

const DESKTOP = '(min-width: 1024px)'
/** The plate rides beside the pointer: to its right, centred on it vertically. */
const OFFSET_X = 40
/** The plate is narrow; next/image needs no more than this at 2× density. */
const PLATE_SIZES = '240px'

type Props = Readonly<{ items: readonly string[]; href: string; plates: readonly MediaKey[] }>

type HoverPlateProps = Readonly<{
  plates: readonly MediaKey[]
  active: number | null
  /** The positioned ancestor the plate moves within and listens on. */
  within: RefObject<HTMLDivElement | null>
}>

function HoverPlate({ plates, active, within }: HoverPlateProps) {
  const frame = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = frame.current
    const host = within.current
    if (!el || !host) return

    const ctx = gsap.context(() => {
      const toX = gsap.quickTo(el, 'x', { duration: D.base, ease: E.outExpo })
      const toY = gsap.quickTo(el, 'y', { duration: D.base, ease: E.outExpo })
      const onMove = (e: PointerEvent) => {
        const box = host.getBoundingClientRect()
        toX(e.clientX - box.left + OFFSET_X)
        toY(e.clientY - box.top - el.offsetHeight / 2)
      }
      host.addEventListener('pointermove', onMove, { passive: true })
      return () => host.removeEventListener('pointermove', onMove)
    }, el)

    return () => ctx.revert()
  }, [within])

  const activeKey = active === null ? null : plateForRow(active, plates)
  const unique = Array.from(new Set(plates))

  return (
    <div
      ref={frame}
      className="conditions__plate"
      data-shown={activeKey !== null}
      aria-hidden="true"
    >
      {unique.map((key) => (
        <Plate
          key={key}
          media={key}
          alt=""
          sizes={PLATE_SIZES}
          className={cn('conditions__frame', key === activeKey && 'is-active')}
        />
      ))}
    </div>
  )
}

/** The row index from the link's own data attribute; null off a row. */
function rowIndex(target: EventTarget | null): number | null {
  const row = (target as HTMLElement | null)?.closest<HTMLElement>('[data-row]')
  const n = row ? Number(row.dataset.row) : Number.NaN
  return Number.isInteger(n) ? n : null
}

export function ConditionsList({ items, href, plates }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const rich = useRichPointer()
  const desktop = useMediaQuery(DESKTOP)
  const plateOn = rich && desktop && plates.length > 0

  return (
    <div className="conditions__wrap" ref={wrap}>
      <Reveal>
        <ul className="conditions__list">
          {items.map((item, i) => (
            <li key={item} className="conditions__row" data-row={i}>
              <Link
                className="conditions__link t-body"
                href={href}
                onPointerEnter={plateOn ? (e) => setActive(rowIndex(e.currentTarget)) : undefined}
                onPointerLeave={plateOn ? () => setActive(null) : undefined}
              >
                <span className="conditions__numeral t-eyebrow" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="conditions__label">{item}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
      {plateOn && <HoverPlate plates={plates} active={active} within={wrap} />}
    </div>
  )
}
