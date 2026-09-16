/**
 * Reading the travelling glow (docs/04 §6; `src/sections/RowGlow.tsx`).
 * The functions that run in the page are self-contained: Playwright
 * serialises their source, so they may close over nothing.
 */

/** The one glow element a list renders. */
export const GLOW = '.row-glow'
/** The glow tweens over --d-base; poll well past it. */
export const GLOW_SETTLE_MS = 2000
/**
 * Under reduced motion the glow is placed, not tweened; the computed style
 * catches up a few frames later because the global safety net gives every
 * element a 0.01ms transition (one frame was not always enough; Task 19), so
 * poll briefly — far inside the --d-base tween the other projects run.
 */
export const REDUCED_SETTLE_MS = 500

/** The glow's translate, from its computed transform matrix. */
export const glowTranslate = (el: Element): { x: number; y: number } => {
  const transform = getComputedStyle(el).transform
  if (transform === 'none') return { x: 0, y: 0 }
  const parts = transform.match(/matrix\((.+)\)/)?.[1]?.split(',') ?? []
  return { x: Number(parts[4] ?? 0), y: Number(parts[5] ?? 0) }
}

/** The glow's translateY, from its computed transform matrix. */
export const glowY = (el: Element): number => {
  const transform = getComputedStyle(el).transform
  if (transform === 'none') return 0
  const parts = transform.match(/matrix\((.+)\)/)?.[1]?.split(',') ?? []
  return Number(parts[5] ?? 0)
}

/** A row's layout offsets against the list wrapper, the glow's coordinate space. */
export const rowOffset = (el: Element): { x: number; y: number } => ({
  x: (el as HTMLElement).offsetLeft,
  y: (el as HTMLElement).offsetTop,
})
