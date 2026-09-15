'use client'

/**
 * The single RAF loop. docs/04-motion-system.md §2, docs/07-tech-stack.md.
 *
 * No component may import Lenis directly — use scrollTo() from here.
 */
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './tokens'

let lenis: Lenis | null = null

export function scrollTo(target: string | number | HTMLElement, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 })
    return
  }
  // reduced motion / Lenis disabled — native scroll
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (el instanceof HTMLElement) {
    window.scrollTo({ top: el.offsetTop + offset, behavior: 'auto' })
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: 'auto' })
  }
}

export function SmoothScroll() {
  useEffect(() => {
    // Belt and braces for the head script, which is what actually prevents the
    // browser restoring a reload into the middle of a pinned section. A hash
    // link (#enquire) is an intentional destination and is left alone.
    if (!window.location.hash) window.scrollTo(0, 0)

    if (prefersReducedMotion()) {
      // Native scroll. ScrollTrigger still needs a refresh once laid out.
      ScrollTrigger.refresh()
      return
    }

    lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(raf)

    // Width-only resize handling — mobile browser chrome changes viewport
    // height constantly and refreshing on that thrashes pinned sections.
    let lastWidth = window.innerWidth
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      clearTimeout(timer)
      timer = setTimeout(() => ScrollTrigger.refresh(), 200)
    }
    window.addEventListener('resize', onResize)

    ScrollTrigger.refresh()

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
      gsap.ticker.remove(raf)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  return null
}

/**
 * Route curtain: jump to the top while the page is covered. Native first, so
 * the reduced-motion path (no Lenis) resets too; `force` because the curtain
 * has stopped Lenis, and a stopped instance otherwise ignores scrollTo.
 */
export function resetScroll() {
  window.scrollTo(0, 0)
  lenis?.scrollTo(0, { immediate: true, force: true })
}

export function stopScroll() {
  lenis?.stop()
  document.body.dataset.locked = 'true'
}

export function startScroll() {
  lenis?.start()
  document.body.dataset.locked = 'false'
}
