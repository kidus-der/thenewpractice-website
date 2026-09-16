/**
 * A reference-counted lock. The nav overlay, the preloader and the route
 * curtain each stop and start page scroll; without a count the first one to
 * finish released everyone else's lock (ledger, Task 7 findings). `stop`
 * engages on the first holder, `start` releases on the last, and a release
 * without a matching stop is ignored rather than driving the count negative.
 * Pure: the side effects are the two callbacks, so SmoothScroll can supply
 * Lenis and the body attribute and a unit test can supply spies.
 */
export type ScrollLock = Readonly<{
  stop: () => void
  start: () => void
  /** How many holders currently have the page locked. */
  depth: () => number
}>

type Effects = Readonly<{ onLock: () => void; onRelease: () => void }>

export function createScrollLock({ onLock, onRelease }: Effects): ScrollLock {
  let holders = 0
  return {
    stop: () => {
      holders += 1
      if (holders === 1) onLock()
    },
    start: () => {
      if (holders === 0) return
      holders -= 1
      if (holders === 0) onRelease()
    },
    depth: () => holders,
  }
}
