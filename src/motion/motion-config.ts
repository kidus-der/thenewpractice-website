'use client'

/**
 * Motion (motion/react) configuration. docs/04-motion-system.md §0.
 *
 * Motion owns state-driven transitions only: the route curtain, the nav
 * overlay, form → confirmation, the result reveal. Scroll belongs to GSAP.
 *
 * Every transition here is a tween on the identity's curves. There is no
 * spring in this file and none may be added — `type: 'spring'` is banned by
 * the design system (docs/03 §9), and `useSpring` is lint-banned.
 *
 * Reduced motion: <MotionProvider> sets `reducedMotion="user"`, so under
 * `prefers-reduced-motion: reduce` Motion completes transform and layout
 * animations instantly and keeps only opacity and colour. Components that
 * need a different *shape* under reduced motion (the curtain becomes a fade)
 * read `useReducedMotion()` and pick `fadeVariants` instead.
 */
import { createElement, type ReactNode } from 'react'
import { MotionConfig, stagger, type Transition, type Variants } from 'motion/react'
import { D, STAGGER } from './tokens'

type Bezier = readonly [number, number, number, number]

/** The identity's curves as cubic-bezier arrays. Mirrors --e-* in globals.css. */
export const identityEase = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
} as const satisfies Record<string, Bezier>

/** Durations in seconds — the same object GSAP uses. One source. */
export const durations = D

/** The site-wide fallback: everything entering settles on the expo curve. */
export const defaultTransition = {
  type: 'tween',
  duration: D.base,
  ease: identityEase.outExpo,
} as const satisfies Transition

const inOutQuart = (duration: number): Transition => ({
  type: 'tween',
  duration,
  ease: identityEase.inOutQuart,
})

/** Fully open and fully collapsed clip-path insets. */
const INSET_FULL = 'inset(0 0 0 0)'
const INSET_HIDDEN_BELOW = 'inset(100% 0 0 0)'
const INSET_HIDDEN_ABOVE = 'inset(0 0 100% 0)'

/**
 * Route curtain (docs/04 §4). A canopy panel rises to cover the outgoing
 * page, holds while scroll resets, then wipes away upward.
 *   hidden → cover → reveal → hidden
 * Under reduced motion the curtain uses fadeVariants instead (task 9).
 */
export const curtainVariants = {
  hidden: { clipPath: INSET_HIDDEN_BELOW, transition: { duration: 0 } },
  cover: { clipPath: INSET_FULL, transition: inOutQuart(D.glacial) },
  reveal: { clipPath: INSET_HIDDEN_ABOVE, transition: inOutQuart(D.glacial) },
} as const satisfies Variants

/**
 * Nav overlay (docs/04 §4). `panel` wipes in over --d-slow and out over
 * --d-base; its children (`item`) reveal as masked lines, staggered at the
 * large step. Children wait for the panel on open and finish before it on
 * close. Under reduced motion the y transform is instant and only opacity
 * remains — which is the specified reduced-motion design.
 */
export const overlayVariants = {
  panel: {
    closed: {
      clipPath: INSET_HIDDEN_ABOVE,
      transition: { ...inOutQuart(D.base), when: 'afterChildren' },
    },
    open: {
      clipPath: INSET_FULL,
      transition: {
        ...inOutQuart(D.slow),
        when: 'beforeChildren',
        delayChildren: stagger(STAGGER.large),
      },
    },
  },
  item: {
    closed: { opacity: 0, y: '110%', transition: { ...defaultTransition, duration: D.fast } },
    open: { opacity: 1, y: '0%', transition: { ...defaultTransition, duration: D.slow } },
  },
} as const satisfies Record<string, Variants>

/** Opacity only. The reduced-motion curtain, small swaps, the result reveal. */
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const satisfies Variants

/**
 * Mount once in the root layout around the page. Reduced motion follows the
 * user's OS setting; every child motion component inherits the tween default.
 */
export function MotionProvider({ children }: Readonly<{ children: ReactNode }>) {
  return createElement(
    MotionConfig,
    { reducedMotion: 'user', transition: defaultTransition },
    children
  )
}
