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
import { PALETTE, readToken } from '@/lib/tokens'

const SELECTOR = 'main [data-ground], footer[data-ground]'

type GroundKey = 'dark' | 'light' | 'mid'
type GroundPaint = Readonly<{ bg: string; fg: string }>

const isGroundKey = (value: string | undefined): value is GroundKey =>
  value === 'dark' || value === 'light' || value === 'mid'

/**
 * The three grounds and the legible foreground for each, read from the
 * stylesheet at mount (docs/03 §1 "Chrome ground"). Bone and sand take ink,
 * canopy takes bone — the same answer the old luminance threshold gave, now
 * stated rather than computed, so no hex is parsed or spelled here.
 */
function readGrounds(): Readonly<Record<GroundKey, GroundPaint>> {
  const canopy = readToken('--c-canopy', PALETTE.canopy)
  const bone = readToken('--c-bone', PALETTE.bone)
  const sand = readToken('--c-sand', PALETTE.sand)
  return {
    dark: { bg: canopy, fg: bone },
    light: { bg: bone, fg: canopy },
    mid: { bg: sand, fg: canopy },
  }
}

export function GroundManager() {
  useLayoutEffect(() => {
    const root = document.documentElement

    const ctx = gsap.context(() => {
      const grounds = readGrounds()
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

        const key = stops[i]!.el.dataset.ground
        const ground = grounds[isGroundKey(key) ? key : 'dark']

        // Only on change. Writing a custom property on <html> invalidates style
        // for every element that references it — i.e. the whole document — so
        // doing it once per scroll frame is a real cost for no visible effect.
        if (ground.bg === painted) return
        painted = ground.bg
        root.style.setProperty('--ground', ground.bg)
        root.style.setProperty('--ground-fg', ground.fg)
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
