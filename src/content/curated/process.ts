/**
 * /our-process, curated (round 1, R4a; docs/06 §Curation). Seven short
 * sections in the order a client lives them: the first call, the assessment,
 * the lead clinician, the day, the family, the table, going home. Nothing
 * here is ours: every sentence is the client's.
 *
 * Merged: _Designing Your Program_ into _A Comprehensive Assessment_ (the
 * program is the assessment's outcome); _After Care_ into _Preparing to
 * Return Home_ (the same continuity, before and after the flight home).
 * Cut: _Arriving at The New Practice_ (a home rather than an institution is
 * said on About and in the day's closing line), _One Team Working Together_
 * (the About principles carry it), _Treatment Without Borders_ (treatment at
 * home is said in the family section and on Fees).
 * Moved: _Nutrition as Therapy_, last in the document, sits after the family
 * so the day, the people and the table read together.
 */
import { PROCESS } from '../pages/process'
import type { Page, Section } from '../schemas'
import { curate, sentencesOf, type Curator, type SectionSpec } from './core'

/** Several client sections read as one, under the first one's heading. */
function joined(c: Curator, specs: readonly SectionSpec[]): Section[] {
  const [first, ...rest] = c.sections(PROCESS.sections, specs, 'sections')
  if (!first) return []
  return [{ ...first, paragraphs: [first, ...rest].flatMap((s) => s.paragraphs) }]
}

export const PROCESS_CURATION = curate('process', (c): Page => ({
  ...PROCESS,
  sections: [
    ...c.sections(
      PROCESS.sections,
      [{ id: 'the-new-practice-experience', paragraphs: [1, 2, 3] }],
      'sections'
    ),
    ...joined(c, [
      { id: 'a-comprehensive-assessment', paragraphs: [0, 3, 4] },
      { id: 'designing-your-program', paragraphs: [0, 2] },
    ]),
    ...c.sections(
      PROCESS.sections,
      [
        { id: 'why-we-have-a-lead-clinician', paragraphs: [0, 1, 4, 5] },
        { id: 'a-typical-day', paragraphs: [0, sentencesOf(1, [0]), 2, 4] },
        { id: 'family-participation', paragraphs: [0, 1, 2, 4] },
        { id: 'nutrition-as-therapy', paragraphs: [0, 2, 3] },
      ],
      'sections'
    ),
    ...joined(c, [
      { id: 'preparing-to-return-home', paragraphs: [0, sentencesOf(4, [0]), 5] },
      { id: 'after-care', paragraphs: [0] },
    ]),
  ],
}))

export const PROCESS_CURATED = PROCESS_CURATION.value
