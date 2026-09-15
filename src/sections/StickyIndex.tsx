'use client'

/**
 * The sticky section index (docs/04 §6 "Sticky index", docs/05 §T2): a list
 * of the page's section titles that stays in the left column from 1024px
 * while the reader moves through the body. One ScrollTrigger per section
 * marks the item whose section currently holds the reading line; a brass
 * rule draws beside it. Items are plain anchors — the browser handles the
 * jump and moves the sequential-focus point with it, and the route curtain
 * leaves same-page hash changes alone.
 *
 * Client component: it owns the active state. The triggers are not gated by
 * reduced motion because nothing here is an animation — the index answers
 * "where am I", and the CSS safety net removes the transitions.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import './StickyIndex.css'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import type { IndexItem } from '@/lib/interior'

/** A section owns the index while it spans the reading line, 60% down the viewport. */
const READING_LINE = '60%'

type Props = {
  items: readonly IndexItem[]
  label: string
}

export function StickyIndex({ items, label }: Props) {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState<string | null>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      items.forEach((item) => {
        const section = document.getElementById(item.id)
        if (!section) return
        ScrollTrigger.create({
          trigger: section,
          start: `top ${READING_LINE}`,
          end: `bottom ${READING_LINE}`,
          onEnter: () => setActive(item.id),
          onEnterBack: () => setActive(item.id),
        })
      })
    }, el)

    return () => ctx.revert()
  }, [items])

  return (
    <nav className="sticky-index" aria-label={label} ref={root}>
      <ol className="sticky-index__list">
        {items.map((item) => (
          <li key={item.id} className="sticky-index__item">
            <a
              className="sticky-index__link t-small"
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
            >
              <span className="sticky-index__rule" aria-hidden="true" />
              <span className="sticky-index__numeral t-eyebrow" aria-hidden="true">
                {item.numeral}
              </span>
              <span className="sticky-index__title">{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
