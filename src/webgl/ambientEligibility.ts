/**
 * The decision behind the ambient gradient. docs/04-motion-system.md §8.
 *
 * Pure: takes a snapshot of the environment, returns a boolean. The hook in
 * useAmbientEligible.ts samples the browser and feeds it here, so the rule is
 * unit-testable without a DOM. Every guard is one of the budget's conditions;
 * none may be dropped without a change to docs/04 §8.
 */

/** Below this, when the browser reports it, the gradient does not mount. */
export const MIN_DEVICE_MEMORY_GB = 4

/** The desktop gate: the threshold for desktop-only behaviour (docs/03 §7). */
export const DESKTOP_POINTER_QUERY = '(min-width: 1024px) and (pointer: fine)'
export const MOTION_OK_QUERY = '(prefers-reduced-motion: no-preference)'

export type AmbientEnv = Readonly<{
  /** `(prefers-reduced-motion: no-preference)` matches. */
  motionOk: boolean
  /** `(min-width: 1024px) and (pointer: fine)` matches. */
  desktopPointer: boolean
  /** A WebGL2 context could be created. */
  webgl2: boolean
  /** `navigator.connection.saveData`; undefined when unreported. */
  saveData: boolean | undefined
  /** `navigator.deviceMemory` in GB; undefined when unreported. */
  deviceMemory: number | undefined
}>

export function decideAmbientEligibility(env: AmbientEnv): boolean {
  if (!env.motionOk) return false
  if (!env.desktopPointer) return false
  if (!env.webgl2) return false
  if (env.saveData === true) return false
  if (env.deviceMemory !== undefined && env.deviceMemory < MIN_DEVICE_MEMORY_GB) return false
  return true
}
