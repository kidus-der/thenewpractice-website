'use client'

/**
 * The timeline rule (docs/04 §6 "Timeline rule", docs/05 §T2): the one place
 * a scroll-scrubbed effect is literal rather than atmospheric, because the
 * content is a progression. Ported from the concept site's §05 "A Day".
 *
 * A hairline the list's full height; over it a brass rule whose `scaleY`
 * follows the reading line 1:1 (`scrub: true`, no lag); each paragraph is a
 * marker — its tick turns brass and its text lifts from `--fg-muted` to
 * `--fg` as the rule passes. The client wrote no clock times, so the
 * paragraphs themselves are the markers, in their order; nothing is invented.
 *
 * Client component: it owns the scrub. Everything is inside
 * `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`; the
 * stylesheet's safety net draws the rule complete and sets every marker to
 * `--fg` under reduced motion. Replaces a section's prose through
 * `InteriorTemplate`'s `bodies`.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import './DayTimeline.css'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { E } from '@/motion/tokens'

/**
 * One line for both the rule and the markers: the brass tip is then always
 * exactly at a marker's tick the moment that marker lights.
 */
const READING_LINE = 'top 70%'
const LIST_END = 'bottom 70%'
const NONE_PASSED = -1

type Props = { paragraphs: readonly string[] }

export function DayTimeline({ paragraphs }: Props) {
  const list = useRef<HTMLOListElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const [passed, setPassed] = useState(NONE_PASSED)

  useLayoutEffect(() => {
    const el = list.current
    if (!el) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          fill.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: E.linear,
            scrollTrigger: { trigger: el, start: READING_LINE, end: LIST_END, scrub: true },
          }
        )
        gsap.utils.toArray<HTMLElement>('.day-timeline__marker', el).forEach((marker, i) => {
          ScrollTrigger.create({
            trigger: marker,
            start: READING_LINE,
            onEnter: () => setPassed((p) => Math.max(p, i)),
            onLeaveBack: () => setPassed(i - 1),
          })
        })
      })
      return () => mm.revert()
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [paragraphs])

  return (
    <ol className="day-timeline" ref={list}>
      <span className="day-timeline__rule" aria-hidden="true">
        <span className="day-timeline__fill" ref={fill} />
      </span>
      {paragraphs.map((text, i) => (
        <li
          key={text}
          className="day-timeline__marker t-body"
          data-passed={i <= passed ? 'true' : undefined}
        >
          {text}
        </li>
      ))}
    </ol>
  )
}
