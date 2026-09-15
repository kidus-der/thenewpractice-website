'use client'

/**
 * Tells the fixed chrome — header, scroll rail, cursor — which ground it is
 * currently floating over, by publishing --ground and --ground-fg on <html>.
 *
 * Sections paint their own backgrounds. An earlier version made them
 * transparent and interpolated one fixed ground layer across boundaries, which
 * looked good in the middle of a section and wrong at every edge: a section's
 * text colour switches at its own boundary, so any ground that crossfades
 * across that boundary spends the crossfade mis-paired — bone type on sand,
 * or ink type on ink. Opaque sections cannot get that wrong.
 *
 * The chrome still needs to know, because it sits outside every section and so
 * inherits none of their aliases. The section that owns the chrome is the one
 * under the viewport's top edge, which is where the header is.
 */
import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { measureStops, type SectionStop } from '@/motion/sectionStops'

const GROUND_COLOR: Record<string, string> = {
  dark: '#14231C',
  light: '#F1ECE0',
  mid: '#E3DCCB',
}

const SELECTOR = 'main [data-ground], footer[data-ground]'

/** Relative luminance of a hex colour, thresholded for text. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

export function GroundManager() {
  useLayoutEffect(() => {
    const root = document.documentElement

    const ctx = gsap.context(() => {
      let stops: SectionStop[] = []
      let painted = ''

      const paint = () => {
        if (!stops.length) return
        const y = window.scrollY

        // The section under the viewport's top edge — where the header is.
        let i = 0
        for (let k = 0; k < stops.length; k++) {
          if (y >= stops[k]!.top - 1) i = k
        }

        const color = GROUND_COLOR[stops[i]!.el.dataset.ground ?? 'dark'] ?? GROUND_COLOR.dark!

        // Only on change. Writing a custom property on <html> invalidates style
        // for every element that references it — i.e. the whole document — so
        // doing it once per scroll frame is a real cost for no visible effect.
        if (color === painted) return
        painted = color
        root.style.setProperty('--ground', color)
        root.style.setProperty('--ground-fg', isLight(color) ? '#14231C' : '#F1ECE0')
      }

      const refresh = () => {
        stops = measureStops(SELECTOR)
        paint()
      }

      ScrollTrigger.create({ start: 0, end: 'max', onRefresh: refresh, onUpdate: paint })
      refresh()
    })

    return () => ctx.revert()
  }, [])

  // Sits behind everything so overscroll never exposes bare canvas.
  return <div className="ground" aria-hidden="true" />
}
