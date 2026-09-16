/**
 * Motion tokens — mirrored from globals.css. docs/04-motion-system.md §1.
 * A component never invents a duration or an easing curve.
 */
export const D = {
  instant: 0.12,
  fast: 0.24,
  base: 0.48,
  slow: 0.8,
  glacial: 1.4,
  /** Seconds per cycle of the footer marquee, the site's one continuous loop (docs/04 §4). */
  marquee: 40,
} as const

export const E = {
  outExpo: 'expo.out',
  outQuart: 'quart.out',
  inOutQuart: 'quart.inOut',
  linear: 'none',
} as const

export const STAGGER = {
  chars: 0.04,
  /** Form fields fading out before a confirmation (docs/04 §6). */
  fields: 0.04,
  default: 0.06,
  large: 0.08,
} as const

/** Reveal trigger point — element top hits 85% of viewport height. */
export const REVEAL_START = 'top 85%'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
