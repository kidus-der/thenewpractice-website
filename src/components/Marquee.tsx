'use client'

/**
 * The footer wordmark marquee — the one permitted marquee on the site
 * (docs/02 §Anti-patterns, docs/04 §4). A continuous linear loop on GSAP's
 * ticker, paused while the band is offscreen, and a static single repetition
 * under reduced motion (Footer.css hides everything after the first item).
 *
 * Decorative: the wordmark exists as real text in the footer lockup, so the
 * whole band is hidden from assistive technology. The set is rendered twice
 * and the track travels -50%, so the second set exists only to make the loop
 * seamless.
 */
import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { E } from '@/motion/tokens'
import { MOTION_OK } from '@/motion/useMediaQuery'

/**
 * Seconds per cycle — docs/04 §4 specifies 40s. The motion tokens top out at
 * --d-glacial (1.4s); this is the site's one continuous loop, so it is named
 * here rather than invented at the call site.
 */
const CYCLE_SECONDS = 40
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
          duration: CYCLE_SECONDS,
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

  const items = Array.from({ length: REPEATS }, (_, i) => (
    <span className="marquee__item" key={i}>
      {text}
      <span className="marquee__sep">{separator}</span>
    </span>
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
