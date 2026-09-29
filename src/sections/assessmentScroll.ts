/**
 * Moving on through a questionnaire (docs/05 §Self-assessment): a question,
 * the result's action or the send form's first field is brought into view
 * only when it is not already comfortably there, through the site's one
 * scroll (native and instant under reduced motion).
 */
import { scrollTo } from '@/motion/SmoothScroll'
import { D } from '@/motion/tokens'

/** A question already this comfortably in view is not scrolled to (fractions of the viewport). */
const COMFORT_TOP = 0.2
const COMFORT_BOTTOM = 0.85
/** Where a question scrolled to comes to rest: its top this far down the viewport. */
const REST_AT = 0.3

/** Scrolls `el` gently into view through the site's scroll, unless it is already comfortably there. */
export function bringIntoView(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  if (rect.top >= vh * COMFORT_TOP && rect.bottom <= vh * COMFORT_BOTTOM) return
  scrollTo(Math.max(0, rect.top + window.scrollY - vh * REST_AT), 0, D.slow)
}
