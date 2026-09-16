'use client'

/**
 * The entry veil. docs/04-motion-system.md §4.
 *
 * 1.8s budget, skippable by any input, once per session, short-circuited on a
 * warm cache. Skipped entirely under reduced motion.
 *
 * Shows once per session on whichever route is entered first; client-side
 * navigations after that are covered by the route curtain (task 9), which
 * listens for the same `veil:done` handshake.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { BRAND } from '@/content/brand'
import { gsap } from '@/motion/gsap'
import { D, E, prefersReducedMotion } from '@/motion/tokens'
import { startScroll, stopScroll } from '@/motion/SmoothScroll'
import { Mark } from './Mark'

const SESSION_KEY = 'thenewpractice:seen-veil'

/** The hero waits for this so the two entrance moments never overlap. */
function markVeilDone() {
  if (document.documentElement.dataset.veil === 'done') return
  document.documentElement.dataset.veil = 'done'
  window.dispatchEvent(new Event('veil:done'))
}

export function Preloader() {
  const [active, setActive] = useState(true)
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const seen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)

    if (seen || prefersReducedMotion()) {
      // Genuinely a post-mount decision: it depends on sessionStorage, which
      // the server cannot see. Rendering the veil and removing it is correct —
      // the alternative is a hydration mismatch on the element that covers the
      // whole page.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(false)
      markVeilDone()
      return
    }

    sessionStorage.setItem(SESSION_KEY, '1')
    stopScroll()
    // The lock is reference-counted (SmoothScroll): one hold, one release,
    // whether the veil completes or the component unmounts first.
    let released = false
    const release = () => {
      if (released) return
      released = true
      startScroll()
    }

    const ctx = gsap.context(() => {
      // A warm cache should not be made to wait.
      const warm = performance.now() < 400
      const scale = warm ? 0.5 : 1

      const tl = gsap.timeline({
        onComplete: () => {
          setActive(false)
          release()
          markVeilDone()
        },
      })

      // The tree draws itself outward from the single point it converges on —
      // the entire proposition, stated before a word is read.
      tl.from('.preloader__ceiba .mark__stroke', {
        strokeDashoffset: 1,
        stagger: { each: 0.1, from: 'center' },
        duration: D.glacial * scale,
        ease: E.outQuart,
      })
        .from(
          '.preloader__ceiba .mark__point',
          { scale: 0, duration: D.base * scale, ease: E.outExpo },
          '-=0.4'
        )
        .to(
          '.preloader__mark',
          {
            opacity: 1,
            letterSpacing: '0.3em',
            duration: D.glacial * scale,
            ease: E.outExpo,
          },
          '-=0.7'
        )
        .from('.preloader__rule', { scaleX: 0, duration: D.slow * scale, ease: E.outExpo }, '<0.2')
        // The hold. The pause is the luxury.
        .to({}, { duration: 0.2 * scale })
        .to('.preloader__veil', {
          clipPath: 'inset(50% 0 50% 0)',
          duration: D.glacial * scale,
          ease: E.inOutQuart,
        })
        .to('.preloader__inner', { opacity: 0, duration: D.base * scale }, '<')

      const skip = () => {
        tl.progress(1)
      }
      window.addEventListener('keydown', skip, { once: true })
      window.addEventListener('pointerdown', skip, { once: true })
      window.addEventListener('wheel', skip, { once: true, passive: true })

      return () => {
        window.removeEventListener('keydown', skip)
        window.removeEventListener('pointerdown', skip)
        window.removeEventListener('wheel', skip)
      }
    }, root.current ?? undefined)

    return () => {
      ctx.revert()
      release()
    }
  }, [])

  if (!active) return null

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="preloader__veil">
        <div className="preloader__inner">
          <Mark className="preloader__ceiba" animated />
          <div className="preloader__mark">{BRAND.nameUpper}</div>
          <div className="preloader__rule" />
          <div className="preloader__descriptor t-eyebrow">{BRAND.tagline}</div>
        </div>
      </div>
    </div>
  )
}
