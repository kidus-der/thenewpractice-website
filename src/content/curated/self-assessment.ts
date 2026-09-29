/**
 * /self-assessment — round 1, R5 (docs/06 §Curation, docs/05 §T6).
 *
 * The tab page reads in a glance, then the tests: the client's two sentences
 * on what the self-assessments are for, the first sentence of their
 * disclaimer as the one line beside the list, and their own heading over the
 * ten questionnaires. The rest of the page (the section titles, the how-to,
 * the disclaimer's other sentences, *A Confidential Consultation*) moves to
 * each questionnaire's instruction and result, or does not render.
 */
import { ASSESSMENTS_PAGE } from '../assessments'
import { curatePage } from './core'

export const SELF_ASSESSMENT_INTRO = 'understanding-yourself-is-the-first-step-toward-recovery'
export const SELF_ASSESSMENT_DISCLAIMER = 'important-disclaimer'
export const SELF_ASSESSMENT_LIST = 'available-self-assessments'

export const SELF_ASSESSMENT_CURATION = curatePage('self-assessment', ASSESSMENTS_PAGE, {
  sections: [
    // "Our self-assessments have been developed to help … They offer a confidential opportunity …"
    { id: SELF_ASSESSMENT_INTRO, title: null, paragraphs: [1] },
    // "The New Practice Self-Assessment Series is designed as a screening tool only."
    { id: SELF_ASSESSMENT_DISCLAIMER, title: null, paragraphs: [0] },
    // The heading only; the rows are the questionnaires themselves.
    { id: SELF_ASSESSMENT_LIST, listHeading: null },
  ],
})

export const SELF_ASSESSMENT_CURATED = SELF_ASSESSMENT_CURATION.value
