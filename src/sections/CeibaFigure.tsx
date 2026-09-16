'use client'

/**
 * The one place the mark is looked at rather than felt (docs/01 §The mark):
 * the ceiba at ~150px on sand, small, sharp, gold-pointed, drawing itself
 * outward from the point once as the section enters (docs/04 §6 "Mark draw
 * on entry"). Ported from the concept site's §03. No caption: the client's
 * own paragraphs beside it do the explaining (provenance audit, A1).
 *
 * Client component because it owns the draw; everything else in the section
 * is server-rendered. Under reduced motion the strokes render complete
 * (sections.css safety net) and the timeline never starts.
 */
import { useLayoutEffect, useRef } from 'react'
import './CeibaFigure.css'
import { Mark } from '@/components/Mark'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { D, E, REVEAL_START } from '@/motion/tokens'

/** docs/04 §6: strokes staggered 0.09 from centre; the point lands last. */
const STROKE_STAGGER = 0.09
const POINT_OVERLAP = '-=0.4'

export function CeibaFigure() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: REVEAL_START, once: true } })
          .from('.ceiba-figure__mark .mark__stroke', {
            strokeDashoffset: 1,
            stagger: { each: STROKE_STAGGER, from: 'center' },
            ease: E.outQuart,
            duration: D.glacial,
          })
          .from(
            '.ceiba-figure__mark .mark__point',
            { scale: 0, ease: E.outExpo, duration: D.base },
            POINT_OVERLAP
          )
      })
      return () => mm.revert()
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <figure className="ceiba-figure" ref={root}>
      <Mark className="ceiba-figure__mark" animated />
    </figure>
  )
}
