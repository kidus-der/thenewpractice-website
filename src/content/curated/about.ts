/**
 * /about, curated (round 1, R4a; docs/06 §Curation). Seven short sections,
 * each a spread of client sentences beside one picture, the principles
 * excepted. Nothing here is ours: every sentence is the client's.
 *
 * Kept: the ceiba in full (the identity's one explanation); the practice in
 * three paragraphs; the founder's message at a quarter of its length with the
 * signature; the place, the sea and the jungle as three short sections; the
 * six principles as written.
 * Cut: the Kusnacht history (the founder's message carries the lineage), the
 * sub-heading _From Kusnacht to Puerto Aventuras_ that introduced it, the
 * jungle's research paragraphs and the Maya healing sentence (docs/01: the
 * place is named, not mythologised).
 * Merged: _A Place Chosen for Healing_ and _Privacy, Safety and Peace_ read as
 * one section under the client's own heading _PUERTO AVENTURAS_.
 */
import { ABOUT } from '../pages/about'
import type { Page, Section } from '../schemas'
import { ALL, curate, sentencesOf, type Curator, type SectionSpec } from './core'

const PUERTO_AVENTURAS = 'puerto-aventuras'

/** The client's _PUERTO AVENTURAS_ with only its heading; a missing id is reported. */
const placeHeading = (c: Curator): Section | undefined =>
  c.sections(ABOUT.sections, [{ id: PUERTO_AVENTURAS }], 'sections')[0]

/** Subsections of _PUERTO AVENTURAS_, picked and lifted to the top level. */
const placeSections = (c: Curator, specs: readonly SectionSpec[]): Section[] =>
  c.sections(
    ABOUT.sections.find((s) => s.id === PUERTO_AVENTURAS)?.subsections ?? [],
    specs,
    `sections.${PUERTO_AVENTURAS}.subsections`
  )

/** The place and its privacy as one section under the client's heading for both. */
function puertoAventuras(c: Curator): Section[] {
  const heading = placeHeading(c)
  const parts = placeSections(c, [
    { id: 'a-place-chosen-for-healing', paragraphs: [0, 1, 2] },
    { id: 'privacy-safety-and-peace', paragraphs: [1] },
  ])
  return heading ? [{ ...heading, paragraphs: parts.flatMap((p) => p.paragraphs) }] : []
}

export const ABOUT_CURATION = curate('about', (c): Page => ({
  ...ABOUT,
  sections: [
    ...c.sections(
      ABOUT.sections,
      [
        { id: 'our-logo-the-ceiba', paragraphs: [0, 1] },
        {
          id: 'about-the-new-practice',
          subtitle: null,
          paragraphs: [0, 3, 4],
        },
        {
          id: 'a-message-from-the-founder',
          paragraphs: [0, 8, 9, sentencesOf(10, [0, 1]), sentencesOf(11, [0, 1])],
        },
      ],
      'sections'
    ),
    ...puertoAventuras(c),
    ...placeSections(c, [
      { id: 'the-caribbean-sea', paragraphs: [0, 1, 3] },
      { id: 'the-healing-power-of-the-mayan-jungle', paragraphs: [3, 4, 5] },
    ]),
    ...c.sections(
      ABOUT.sections,
      [{ id: 'our-principles', paragraphs: ALL, definitions: ALL }],
      'sections'
    ),
  ],
}))

export const ABOUT_CURATED = ABOUT_CURATION.value
