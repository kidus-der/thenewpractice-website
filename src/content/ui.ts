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
 * index and the previous/next rail. The ceiba figure carries no caption: the
 * client's own paragraphs beside it name the tree (docs/01 §On the Maya
 * material; docs/CONTENT-PROVENANCE-AUDIT.md A1).
 */
export const UI_INTERIOR = {
  /** aria-label on the sticky index <nav>. */
  indexLabel: 'On this page',
  /** aria-label on the previous/next <nav>. */
  railLabel: 'Adjacent pages',
  previous: 'Previous',
  next: 'Next',
} as const

/**
 * STAGING FLAGS — Task 18. Shown only when the deployment is not the
 * production site (`isIndexable()` is false), so a reviewer on staging can
 * tell a PLACEHOLDER page from a finished one at a glance. Never rendered in
 * production; never client copy.
 */
export const UI_STAGING = {
  /** Eyebrow label over a page whose copy is still a PLACEHOLDER stub. */
  copyPending: 'Copy pending client review',
} as const

/**
 * RESIDENCES TEMPLATE STRINGS — Task 17. Landmark names for the two blocks
 * that have no heading in the content (the plate carousel and the amenities
 * table), and the review flag rendered over the intro on every deployment
 * that is not production, because the page's copy is structural PLACEHOLDER
 * (docs/CONTENT-GAPS.md G1). The flag is interface copy, not page copy, and
 * deliberately does not carry the PLACEHOLDER marker: content.checks.ts
 * confines that marker to the modules where content is known to be missing.
 */
export const UI_RESIDENCES = {
  /** aria-label on the carousel <section>. */
  carouselLabel: 'Plates',
  /** aria-label on the amenities <section>. */
  amenitiesLabel: 'Amenities',
  /** Shown above the intro when SITE_ENV is not production; one string, shared with UI_STAGING. */
  copyPending: UI_STAGING.copyPending,
} as const

/**
 * INDEX TEMPLATE STRINGS — Task 12. The one line the self-assessment index
 * sets beneath each questionnaire's title. Structural, ours: every
 * questionnaire has QUESTIONS_PER_ASSESSMENT questions (schemas.ts), and the
 * content test pins that count, so the word here cannot drift from it.
 */
export const UI_INDEX = {
  /** Beneath each questionnaire title, in the eyebrow register. */
  assessmentLength: 'Fifteen questions',
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

/**
 * TREATMENT TEMPLATE STRINGS — Task 13. The heading over the three other
 * services each page points to (they are the next three in the client's
 * list, so the heading claims no relationship), and the two list headings the
 * template falls back to when a service carries a list without its own
 * introducing line (today every service that has a list also has its
 * heading, so the fallbacks never render). Structural, ours.
 */
export const UI_TREATMENT = {
  /** Over the three other-service rows, in the eyebrow register. */
  relatedHeading: 'Other services',
  /** Fallback over `treats` when a service has no `treatsHeading`. */
  treatsHeading: 'We provide treatment for',
  /** Fallback over `mayInclude` when a service has no `mayIncludeHeading`. */
  mayIncludeHeading: 'Treatment may include',
} as const

/**
 * PROFILE TEMPLATE STRINGS — Task 14. The label the portrait plate carries
 * while it is a placeholder (docs/CONTENT-GAPS.md G4: no portraits yet), and
 * the heading over the three other members each profile points to (the next
 * three in the client's list, so the heading claims no pairing). Structural,
 * ours, promising nothing; the eyebrow label is the collection's own name
 * from seo.ts, not repeated here.
 */
export const UI_PROFILE = {
  /** aria-label on the placeholder plate; replaced by the portrait's alt when one exists. */
  portraitPending: 'Portrait placeholder',
  /** Heading over the three cross-links beneath the biography. */
  worksAlongside: 'Also on the team',
} as const

/**
 * SELF-ASSESSMENT SCORER STRINGS — Task 18b. The questionnaire page's
 * interface copy: the two answer words, the tally, the two actions and the
 * score line. Structural, ours (docs/01 §Voice); every clinical word on the
 * page — the questions, the disclaimer, the band labels, the interpretation,
 * the consultation invitation — is the client's and comes from assessments.ts.
 * `{answered}`, `{total}` and `{max}` are filled by src/lib/assessment.ts.
 */
export const UI_ASSESSMENT = {
  /** aria-label on the questions <section>; the eyebrow heading is UI_INDEX.assessmentLength. */
  sectionLabel: 'Questionnaire',
  /** Joins the series name and the questionnaire's numeral in the title-page eyebrow. */
  eyebrowSeparator: '·',
  yes: 'Yes',
  no: 'No',
  /** The live tally, shown once the first question is answered. */
  tally: '{answered} of {total} answered',
  seeResult: 'See your result',
  startAgain: 'Start again',
  /** The eyebrow line above the band label in the result. */
  score: 'Score {total} of {max}',
} as const
