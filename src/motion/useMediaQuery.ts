'use client'

import { useSyncExternalStore } from 'react'

/**
 * Capability detection that survives hydration. Reading matchMedia in an effect
 * and calling setState works, but it is a cascading render and React now warns
 * about it; subscribing is both correct and reactive — plug in a display, turn
 * on Reduce Motion mid-session, and the UI follows.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    // Server render assumes the conservative answer: no fine pointer, and
    // motion reduced. Nothing may depend on animation to be visible anyway.
    () => false
  )
}

export const FINE_POINTER = '(hover: hover) and (pointer: fine)'
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
/** docs/03 §7: the threshold for desktop-only behaviour (indexes, pointer-following plates). */
export const DESKTOP = '(min-width: 1024px)'

/** True only on a desktop-style pointer with motion permitted. */
export function useRichPointer(): boolean {
  const fine = useMediaQuery(FINE_POINTER)
  const motion = useMediaQuery(MOTION_OK)
  return fine && motion
}
