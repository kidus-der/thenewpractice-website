/**
 * BRAND IDENTITY — docs/01-brand-strategy.md
 *
 * Real, supplied by the client in "The New Practice - Logo Concept.pdf" and
 * the home page of their content document. The name, tagline, mark, palette
 * and contact details are theirs.
 *
 * This is the only place the brand exists in the codebase. Every page that
 * shows a name, a phone number or an email address reads it from here, so the
 * contact page and the home page can never disagree (plan §8, R8).
 */
type Founder = {
  name: string
  /** Post-nominal letters, rendered after the name. */
  credentials: string
  role: string
}

type Brand = {
  name: string
  /** Set letterspaced in the Didone, as in the client's lockup. */
  nameUpper: string
  /**
   * The client's page title carries ™. It is kept apart from the wordmark so a
   * template can choose to render it (title, footer legal line) or not (the
   * hero lockup, where a superscript would fight the letterspacing).
   */
  trademark: string
  tagline: string
  locale: string
  phone: string
  email: string
  founder: Founder
  /** The mark's meaning, in the client's own words. */
  markStory: string
}

export const BRAND: Brand = {
  name: 'The New Practice',
  nameUpper: 'THE NEW PRACTICE',
  trademark: '™',
  tagline: 'Private treatment without compromise',
  locale: 'Puerto Aventuras, Riviera Maya, Quintana Roo, Mexico',

  phone: '+1 778-679-3369',
  email: 'lowell@thenewpractice.health',

  founder: {
    name: 'Lowell Monkhouse',
    credentials: 'MA',
    role: 'Founder & Clinical Director',
  },

  markStory:
    'The ceiba — the Maya world tree, joining the underworld, the earthly plane and the heavens through a single trunk. Three branches rise, three roots descend, and all six meet at one point.',
}
