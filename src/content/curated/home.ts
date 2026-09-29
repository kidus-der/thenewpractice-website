/**
 * Home — what renders of `pages/home.ts` (round 1, R3; docs/06 §Curation,
 * docs/05 §T1). The client asked for less to read and more to see: each
 * section keeps the one or two sentences that carry it, beside a picture.
 * Every string here is the client's; nothing of ours is added.
 *
 * - §1 keeps the triad (the subtitle) and the first sentence of its first
 *   paragraph, set beneath the triad inside the pinned moment. The other
 *   three paragraphs restate the triad and the philosophy below.
 * - §2 keeps the sentence its picture illustrates and the closing line,
 *   which the template lifts out as the pull line.
 * - §3 keeps the colon sentence and all twelve conditions.
 * - §4 keeps the five pillars; _Continuity of Care_ drops its second
 *   sentence, which repeats §2. The manifesto keeps its first paragraph.
 * - §5 keeps its three lines.
 */
import { HOME } from '../pages/home'
import { ALL, curatePage, only, sentencesOf } from './core'

export const HOME_CURATION = curatePage('home', HOME, {
  sections: [
    {
      id: 'private-treatment-without-compromise',
      paragraphs: [sentencesOf(0, [0])],
    },
    {
      id: 'recovery-without-interruption',
      paragraphs: [sentencesOf(2, [1, 2])],
    },
    { id: 'who-we-help', list: ALL },
    {
      id: 'our-philosophy',
      definitions: [0, 1, { at: 2, description: only([0]) }, 3, 4],
      subsections: [{ id: 'why-the-new-practice', paragraphs: [0] }],
    },
    { id: 'begin-the-conversation', paragraphs: ALL },
  ],
})

export const HOME_CURATED = HOME_CURATION.value
