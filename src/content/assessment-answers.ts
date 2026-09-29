/**
 * HOW EACH QUESTION IS ANSWERED — round 1, R5 (ledger, owner decisions;
 * docs/06 §Module map, docs/05 §Self-assessment, CONTENT-GAPS C1).
 *
 * The client asked for answers on a 1 to 10 scale; the owner added that the
 * scale indicates severity and that a question may take yes / no / maybe
 * where that is the more meaningful answer. This module records that content
 * decision per question, beside the client's questions in `assessments.ts`,
 * which stay as generated.
 *
 * The rule the entries follow:
 *
 * - `scale` (1 to 10) where the question asks about degree or frequency:
 *   how often, how much, how strongly. "Do you drink to cope with stress?",
 *   "Do you feel guilt or shame?", "Do you struggle to set boundaries?"
 * - `yesNoMaybe` where the question asks about a fact: something that has
 *   happened or is present. Every "Have you" and "Has it" question (a failed
 *   attempt to stop, tolerance, others' concern, harm to health, work or
 *   relationships), and the "Do you" questions that name one: withdrawal or
 *   restlessness when cutting down, needing more over time, use in dangerous
 *   or risky situations, continuing despite harm, borrowing to gamble,
 *   purging, what others say, staying in unhealthy relationships, repeating
 *   unhealthy relationship patterns.
 *
 * Hand-written, ours; nothing clinical is added: the questions are the
 * client's, only the form of the answer is chosen here. `content.checks.ts`
 * fails when a questionnaire has no entry or an entry of the wrong length.
 */

/** 1 to 10 severity, or yes / no / maybe. */
export type AnswerType = 'scale' | 'yesNoMaybe'

const S: AnswerType = 'scale'
const F: AnswerType = 'yesNoMaybe'

/** Questionnaire slug → one answer type per question, in the client's order. */
export const ANSWER_TYPES: Readonly<Record<string, readonly AnswerType[]>> = {
  //        1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
  alcohol: [S, F, S, S, F, F, F, F, F, F, F, S, F, S, S],
  drugs: [S, F, S, S, F, F, F, F, F, F, F, S, F, S, S],
  gambling: [S, F, F, F, S, S, S, F, F, F, S, S, F, S, F],
  food: [S, S, S, S, S, S, S, S, F, S, F, S, S, S, F],
  'eating-disorders': [S, S, S, F, S, S, S, S, F, S, S, S, F, S, F],
  'sex-and-pornography': [S, F, S, S, F, S, S, F, F, S, S, F, F, S, F],
  work: [S, S, S, S, S, S, S, S, S, S, F, S, S, S, S],
  'social-media-and-technology': [S, S, S, F, S, S, S, S, S, S, S, S, F, S, S],
  codependency: [S, S, S, S, S, S, S, S, F, S, S, S, S, S, S],
  'adult-children': [S, S, S, S, S, S, S, S, S, S, S, S, S, F, S],
}

/** The answer types of one questionnaire; a build error, not a blank sheet, if one is missing. */
export function answerTypesFor(slug: string): readonly AnswerType[] {
  const types = ANSWER_TYPES[slug]
  if (!types) throw new Error(`assessment-answers.ts: no answer types for ${slug}`)
  return types
}
