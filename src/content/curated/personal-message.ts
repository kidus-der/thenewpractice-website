/**
 * /a-personal-message, curated (round 1, R4a; docs/06 §Curation). The letter
 * at about half its length, every line the client's, the valediction and the
 * signature kept (src/lib/letter.ts lifts the closing line into the
 * signature). Cut: the four decades, the lesson's lead-in, the Kusnacht
 * lineage (About carries it) and the promise to guide, which the invitation
 * and the closing line already make.
 */
import { PERSONAL_MESSAGE } from '../pages/personal-message'
import { curatePage } from './core'

export const PERSONAL_MESSAGE_CURATION = curatePage('personal-message', PERSONAL_MESSAGE, {
  sections: [{ id: 'letter', paragraphs: [0, 3, 5, 7, 8, 9] }],
})

export const PERSONAL_MESSAGE_CURATED = PERSONAL_MESSAGE_CURATION.value
