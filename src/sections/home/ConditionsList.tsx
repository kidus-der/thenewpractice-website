'use client'

/**
 * The hairline rows and the plate that follows the pointer over them
 * (docs/04 §6 "Hover plate preview"). The plate is the shared HoverPlate:
 * one element for the whole list, the index frames stacked inside it and the
 * row's frame brought forward. It exists only from 1024px with a fine
 * pointer and motion allowed; touch and reduced motion get the list alone.
 * Every row is a real link.
 */
import { useRef, useState } from 'react'
import Link from 'next/link'
import type { MediaKey } from '@/content/media'
import { HoverPlate } from '@/components/HoverPlate'
import { DESKTOP, useMediaQuery, useRichPointer } from '@/motion/useMediaQuery'
import { Reveal } from '@/motion/Reveal'
import { plateForRow } from '@/lib/home'

type Props = Readonly<{ items: readonly string[]; href: string; plates: readonly MediaKey[] }>

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
  const activeKey = active === null ? null : plateForRow(active, plates)

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
      {plateOn && <HoverPlate within={wrap} plates={plates} active={activeKey} />}
    </div>
  )
}
