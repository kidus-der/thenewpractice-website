/**
 * CHROME STRINGS — docs/06-copy-deck.md
 *
 * The handful of user-facing strings that belong to the site's chrome rather
 * than to any page: the skip link, the scroll cue. Components never contain
 * literals, and brand.ts is reserved for the identity, so they live here.
 *
 * Task 5 adds nav.ts (labels and routes) beside this file; the two stay
 * separate because navigation is derived from the page set and this is not.
 */
export const UI = {
  skipLink: 'Skip to content',
  /** The client's own cue from the home page brief. */
  scrollCue: 'Scroll to discover',
} as const

/**
 * FOOTER STRINGS — Task 8. Landmark names and the two decorative glyphs the
 * footer needs. The confidentiality line is not here: it is the client's own
 * sentence and the footer reads it from pages/home.ts.
 */
export const UI_FOOTER = {
  /** aria-label on the footer <nav>. */
  navLabel: 'Footer',
  /** Visually hidden heading over the sitemap columns. */
  sitemapHeading: 'Sitemap',
  /** Precedes the year and the practice name in the legal line. */
  copyright: '©',
  /** Decorative separator between marquee repetitions; never read aloud. */
  marqueeSeparator: '·',
} as const

/**
 * INTERIOR TEMPLATE STRINGS — Task 11. Landmark names for the sticky section
 * index and the previous/next rail, and the ceiba figure's caption. The
 * caption is factual — the species and the Yucatec Maya name of the tree the
 * mark is drawn from — and makes no claim (docs/01 §On the Maya material).
 */
export const UI_INTERIOR = {
  /** aria-label on the sticky index <nav>. */
  indexLabel: 'On this page',
  /** aria-label on the previous/next <nav>. */
  railLabel: 'Adjacent pages',
  previous: 'Previous',
  next: 'Next',
  ceibaCaption: 'Ceiba pentandra · Ya’axché',
} as const

/**
 * HOME TEMPLATE STRINGS — Task 16. The audio toggle's two labels (docs/08
 * §Audio: the button reads what pressing it will do) and the landmark name
 * of the philosophy pillars' index. The hero's own words — title, subtitle,
 * cue — are the client's and live in pages/home.ts.
 */
export const UI_HOME = {
  listen: 'Listen',
  mute: 'Mute',
  /** aria-label on the pillars' sticky index <nav>. */
  pillarsIndexLabel: 'Our philosophy',
} as const
