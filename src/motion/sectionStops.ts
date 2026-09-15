'use client'

/**
 * Shared section measurement for the two things that track scroll position
 * globally: the ground colour and the scroll rail numeral.
 *
 * Both must agree on where a section *visually* begins, and for a pinned
 * section that is not where its box begins — the previous section owns the
 * viewport until the pin spacer ends. Sections mark themselves with
 * data-pinned so the two consumers can branch identically.
 */
export type SectionStop = {
  el: HTMLElement
  /** Document-space y of the section's top edge. */
  top: number
  pinned: boolean
}

export function measureStops(selector: string): SectionStop[] {
  if (typeof document === 'undefined') return []
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) => ({
    el,
    top: Math.round(el.getBoundingClientRect().top + window.scrollY),
    pinned: el.dataset.pinned === 'true',
  }))
}

/**
 * The scroll range over which a section takes over, in document space.
 *
 * A pinned section's content only appears once the previous section's pin
 * releases — exactly at its top edge — so its handover is a short crossfade
 * landing on the boundary. An unpinned section scrolls up from the viewport
 * bottom, so it has to own the ground well before its top reaches the top.
 */
export function handoverRange(stop: SectionStop, vh: number): [number, number] {
  return stop.pinned
    ? [stop.top - vh * 0.25, stop.top]
    : // Late and short: the incoming section's own top padding absorbs the tail,
      // so the outgoing section spends as little time as possible on a ground
      // that is no longer its own.
      [stop.top - vh * 0.6, stop.top - vh * 0.15]
}

/** Index of the section that currently owns the viewport. */
export function activeIndex(stops: SectionStop[], y: number, vh: number): number {
  let i = 0
  for (let k = 0; k < stops.length; k++) {
    if (y >= handoverRange(stops[k]!, vh)[0]) i = k
  }
  return i
}
