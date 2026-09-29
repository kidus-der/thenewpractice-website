/**
 * /fees, curated (round 1, R4a; docs/06 §Curation). The statement is short
 * and renders verbatim; the curation exists so the route reads through the
 * layer like its neighbours and a change to the client's text is checked.
 */
import { FEES } from '../pages/fees'
import { ALL, curatePage } from './core'

export const FEES_CURATION = curatePage('fees', FEES, {
  sections: [{ id: 'cost', paragraphs: ALL }],
})

export const FEES_CURATED = FEES_CURATION.value
