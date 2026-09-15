'use client'

/**
 * Gates the ambient gradient. docs/04-motion-system.md §8, docs/07.
 *
 * False on the server and during hydration; afterwards, the pure decision in
 * ambientEligibility.ts applied to a live snapshot of the browser. Subscribes
 * to the two media queries so turning on Reduce Motion or narrowing the window
 * mid-session unmounts the gradient — and re-mounts it when they revert.
 */
import { useSyncExternalStore } from 'react'
import {
  DESKTOP_POINTER_QUERY,
  MOTION_OK_QUERY,
  decideAmbientEligibility,
  type AmbientEnv,
} from './ambientEligibility'

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean }
  deviceMemory?: number
}

const QUERIES = [MOTION_OK_QUERY, DESKTOP_POINTER_QUERY] as const

/** Memoised: creating a WebGL2 context is not free, and the answer is stable. */
let webgl2Probe: boolean | undefined

function probeWebGL2(): boolean {
  if (webgl2Probe !== undefined) return webgl2Probe
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    webgl2Probe = gl !== null
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl2Probe = false
  }
  return webgl2Probe
}

function readAmbientEnv(): AmbientEnv {
  const hints = navigator as NavigatorHints
  const base: AmbientEnv = {
    motionOk: window.matchMedia(MOTION_OK_QUERY).matches,
    desktopPointer: window.matchMedia(DESKTOP_POINTER_QUERY).matches,
    webgl2: false,
    saveData: hints.connection?.saveData,
    deviceMemory: hints.deviceMemory,
  }
  // Only pay for the context probe when the cheap guards already pass — a
  // phone under reduced motion should never allocate a GL context to be told no.
  const worthProbing = decideAmbientEligibility({ ...base, webgl2: true })
  return worthProbing ? { ...base, webgl2: probeWebGL2() } : base
}

function subscribe(onChange: () => void): () => void {
  const lists = QUERIES.map((q) => window.matchMedia(q))
  lists.forEach((mql) => mql.addEventListener('change', onChange))
  return () => lists.forEach((mql) => mql.removeEventListener('change', onChange))
}

function getSnapshot(): boolean {
  return decideAmbientEligibility(readAmbientEnv())
}

function getServerSnapshot(): boolean {
  return false
}

export function useAmbientEligible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
