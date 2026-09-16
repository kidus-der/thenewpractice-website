'use client'

/**
 * The footer wordmark marquee — the one permitted marquee on the site
 * (docs/02 §Anti-patterns, docs/04 §4). A continuous linear loop on GSAP's
 * ticker, paused while the band is offscreen, and a static single repetition
 * under reduced motion (Footer.css hides everything after the first item).
 *
 * Decorative: the wordmark exists as real text in the footer lockup, so the
 * whole band is hidden from assistive technology and its letters are drawn
 * by CSS from data attributes rather than as text nodes. The set is rendered
 * twice and the track travels -50%, so the second set exists only to make
 * the loop seamless.
 */
import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { D, E } from '@/motion/tokens'
import { MOTION_OK } from '@/motion/useMediaQuery'

/** Repetitions per set: one set must be wider than any viewport. */
const REPEATS = 3

type Props = {
  text: string
  separator: string
  className?: string
}

export function Marquee({ text, separator, className }: Props) {
  const track = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = track.current
    if (!el) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)

      mm.add(MOTION_OK, () => {
        gsap.set(el, { willChange: 'transform' })
        const loop = gsap.to(el, {
          xPercent: -50,
          duration: D.marquee,
          ease: E.linear,
          repeat: -1,
          paused: true,
        })
        // No animation runs while its section is outside the viewport (docs/04 §8).
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
        })
        if (trigger.isActive) loop.play()

        return () => {
          loop.kill()
          gsap.set(el, { clearProps: 'willChange,transform' })
        }
      })

      return () => mm.revert()
    }, el)

    return () => ctx.revert()
  }, [])

  // The wordmark and the separator are painted by the stylesheet from these
  // attributes (Footer.css `::before` / `::after`), not written as text nodes:
  // axe measures visible text for contrast whether or not it is aria-hidden,
  // and a ghost at 0.06 alpha can never clear the floor. The real wordmark is
  // in the lockup below (ledger, Task 11 / 15 findings; Task 19).
  const items = Array.from({ length: REPEATS }, (_, i) => (
    <span className="marquee__item" key={i} data-text={text} data-sep={separator} />
  ))

  return (
    <div className={cn('marquee', className)} aria-hidden="true">
      <div className="marquee__track t-hero" ref={track}>
        <span className="marquee__set">{items}</span>
        <span className="marquee__set marquee__set--dup" aria-hidden="true">
          {items}
        </span>
      </div>
    </div>
  )
}
