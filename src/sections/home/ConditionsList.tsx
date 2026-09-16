'use client'

/**
 * The hairline rows and the one light that travels between them (docs/04 §6
 * "Travelling glow"): the shared RowGlow, one element for the whole list,
 * moved from the active row to the next by the pointer or by keyboard focus,
 * with the brass tick in the margin. Leaving the list eases it out; a tap on
 * touch places it on the tapped row and nothing follows the finger; under
 * reduced motion it is placed, never moved. Every row is a real link.
 */
import { useRef, useState } from 'react'
import Link from 'next/link'
import { releaseRow } from '@/lib/rowGlow'
import { Reveal } from '@/motion/Reveal'
import { RowGlow } from '@/sections/RowGlow'

type Props = Readonly<{ items: readonly string[]; href: string }>

export function ConditionsList({ items, href }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const clear = (index: number) => setActive((current) => releaseRow(current, index))

  return (
    <div className="conditions__wrap" ref={wrap} onPointerLeave={() => setActive(null)}>
      <RowGlow within={wrap} rows=".conditions__row" active={active} />
      <Reveal>
        <ul className="conditions__list">
          {items.map((item, i) => (
            <li
              key={item}
              className="conditions__row"
              data-active={active === i ? 'true' : undefined}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => clear(i)}
            >
              <Link className="conditions__link t-body" href={href}>
                <span className="conditions__numeral t-eyebrow" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="conditions__label">{item}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}
