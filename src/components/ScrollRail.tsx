'use client'

/**
 * An 88px hairline in the right margin with an --accent segment tracking page
 * progress, and the current section numeral beside it. Silent, precise,
 * aria-hidden — it is a visual affordance, and announcing it is noise.
 *
 * The numeral is derived from the same measurement the ground uses, so the two
 * can never disagree. Per-section enter/leave callbacks were wrong here: a
 * pinned section still owns the viewport long after the next section's box has
 * entered it.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { activeIndex, measureStops, type SectionStop } from '@/motion/sectionStops'

export function ScrollRail() {
  const fill = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState('00')

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      let stops: SectionStop[] = []
      let last = -1

      const read = () => {
        if (!stops.length) return
        const i = activeIndex(stops, window.scrollY, window.innerHeight)
        // Guard the setState: React bails out on an identical value, but it
        // still schedules work, and this runs on every scroll frame.
        if (i === last) return
        last = i
        setN(stops[i]!.el.dataset.n ?? '00')
      }

      const refresh = () => {
        stops = measureStops('main [data-n]')
        read()
      }

      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onRefresh: refresh,
        onUpdate: (self) => {
          gsap.set(fill.current, { scaleY: self.progress })
          read()
        },
      })
      refresh()
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="scroll-rail" aria-hidden="true">
      <span className="scroll-rail__n t-eyebrow faint">{n}</span>
      <span className="scroll-rail__track">
        <span className="scroll-rail__fill" ref={fill} />
      </span>
    </div>
  )
}
