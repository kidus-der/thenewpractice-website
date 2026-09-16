/**
 * The route curtain's phase store — module-level, so it survives the root
 * template re-mounting mid-transition (RouteCurtain.tsx explains why). One
 * immutable state object, replaced never mutated; React reads it through
 * useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react'

export type Phase = 'idle' | 'covering' | 'covered' | 'revealing'
export type CurtainState = Readonly<{ phase: Phase; skipped: boolean }>

const IDLE: CurtainState = { phase: 'idle', skipped: false }
let state: CurtainState = IDLE
const listeners = new Set<() => void>()

export const curtainStore = {
  get: (): CurtainState => state,
  set: (patch: Partial<CurtainState>): void => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
} as const

const getPhase = (): Phase => state.phase
const getServerPhase = (): Phase => 'idle'

/** The current phase, for a view that paints it. */
export const useCurtainPhase = (): Phase =>
  useSyncExternalStore(curtainStore.subscribe, getPhase, getServerPhase)

export const isCovered = (phase: Phase): boolean => phase === 'covered' || phase === 'revealing'
