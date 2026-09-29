/**
 * Contact — what renders of `pages/contact.ts` (round 1, R4d; docs/06
 * §Curation, docs/05 §T7). The client asked for less to read and less
 * friction: the form sits beside the letter from the first viewport, and the
 * letter keeps only what a person needs before writing. Every string here is
 * the client's; nothing of ours is added.
 *
 * - The title page keeps the eyebrow, _Begin the Conversation_ and the lead.
 * - _Begin the Conversation_ keeps two sentences of its second paragraph:
 *   every enquiry is personal and confidential (the sentence the `contact`
 *   picture illustrates), and the practice will say so if another approach
 *   would serve better. Its first paragraph names who may write, which the
 *   form's _I am enquiring for_ already asks.
 * - _Who Contacts Us_ is cut: the twelve kinds of enquirer restate the same
 *   point, and the form's three choices cover them.
 * - _International Services_ keeps its first paragraph: where the practice
 *   is and that it works with clients from around the world.
 * - _Confidential Consultation_ keeps its line; the founder's details follow.
 */
import { CONTACT } from '../pages/contact'
import { curatePage, sentencesOf } from './core'

export const CONTACT_CURATION = curatePage('contact', CONTACT, {
  sections: [
    { id: 'begin-the-conversation', paragraphs: [sentencesOf(1, [0, 2])] },
    { id: 'international-services', paragraphs: [0] },
    { id: 'confidential-consultation', paragraphs: [0] },
  ],
})

export const CONTACT_CURATED = CONTACT_CURATION.value
