'use client'

/**
 * The self-assessment scorer (docs/05 §Self-assessment, docs/09 §2 and §3
 * *Self-assessment data handling*; round 1, R5). The line that reads the
 * 1 to 10 scale, then fifteen questions as a hairline list, each a radio
 * group of cells (AssessmentQuestion: ten numbers, or yes / no / maybe, per
 * `assessment-answers.ts`); a tally that appears after the first answer; one
 * action that reveals the result once every question is answered, and
 * resets the sheet once it has.
 *
 * Answering moves on: a choice made by pointer, or by Space, sends focus to
 * the next unanswered question and brings it gently into view (through the
 * site's one scroll, so reduced motion jumps without animating); after the
 * last, focus goes to the action. Arrow keys move within a question and do
 * not move on, so the keyboard model stays the browser's own.
 *
 * The answers are one immutable array in a reducer (src/lib/assessment.ts)
 * and nothing else: there is no <form> to submit them, nothing is written to
 * storage, cookies or the URL, and no request is made.
 */
import { useEffect, useId, useReducer, useRef, type KeyboardEvent } from 'react'
import './AssessmentForm.css'
import { LineActionButton } from '@/components/LineAction'
import type { AnswerType } from '@/content/assessment-answers'
import type { Assessment, NavItem, Section } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import {
  assessmentReducer,
  initialAssessmentState,
  isComplete,
  progressLabel,
  scoreAssessment,
  type Answer,
  type FactAnswer,
} from '@/lib/assessment'
import { scrollTo } from '@/motion/SmoothScroll'
import { D } from '@/motion/tokens'
import { AssessmentQuestion } from './AssessmentQuestion'
import { AssessmentResult } from './AssessmentResult'

type Props = {
  assessment: Assessment
  /** One per question, from `answerTypesFor(assessment.slug)`. */
  answerTypes: readonly AnswerType[]
  /** The series' *Important Disclaimer*, in full with the result. */
  disclaimer: Section
  /** The series' *A Confidential Consultation*, shown with the result. */
  consultation: Section
  /** The *Enquire* action, from NAV.utility. */
  enquire: NavItem
}

/** A question already this comfortably in view is not scrolled to (fractions of the viewport). */
const COMFORT_TOP = 0.2
const COMFORT_BOTTOM = 0.85
/** Where a question scrolled to comes to rest: its top this far down the viewport. */
const REST_AT = 0.3

/** The first unanswered question after `from`, wrapping to the start; -1 when none is left. */
export function nextUnanswered(answers: readonly Answer[], from: number): number {
  const order = [...answers.keys()].map((i) => (from + 1 + i) % answers.length)
  return order.find((i) => answers[i] === null) ?? -1
}

function bringIntoView(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  if (rect.top >= vh * COMFORT_TOP && rect.bottom <= vh * COMFORT_BOTTOM) return
  scrollTo(Math.max(0, rect.top + window.scrollY - vh * REST_AT), 0, D.slow)
}

export function AssessmentForm({
  assessment,
  answerTypes,
  disclaimer,
  consultation,
  enquire,
}: Props) {
  const id = useId()
  const [state, dispatch] = useReducer(
    assessmentReducer,
    assessment.questions.length,
    initialAssessmentState
  )
  const rowsRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  /** Set by an arrow key, so the change it causes does not move on. */
  const arrowing = useRef(false)
  /** The question just answered by a choice that should move on. */
  const answeredFrom = useRef<number | null>(null)

  const score = scoreAssessment(state.answers, answerTypes, assessment.scoring)
  const complete = isComplete(state.answers)
  const tallyId = `${id}-tally`
  const hintId = `${id}-hint`
  const total = assessment.questions.length

  useEffect(() => {
    const from = answeredFrom.current
    if (from === null) return
    answeredFrom.current = null
    const next = nextUnanswered(state.answers, from)
    const target =
      next === -1
        ? actionsRef.current?.querySelector('button')
        : rowsRef.current?.querySelectorAll('fieldset')[next]?.querySelector('input')
    if (!target) return
    target.focus({ preventScroll: true })
    bringIntoView(next === -1 ? target : (target.closest('fieldset') ?? target))
  }, [state.answers])

  const onAnswer = (index: number, value: FactAnswer | number) => {
    const moveOn = !arrowing.current
    arrowing.current = false
    answeredFrom.current = moveOn ? index : null
    dispatch({ type: 'answer', index, value })
  }
  const onKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    arrowing.current = event.key.startsWith('Arrow')
  }
  const onAction = () => {
    if (!complete) return
    dispatch({ type: state.revealed ? 'reset' : 'reveal' })
  }

  return (
    <div className="assessment">
      <p id={hintId} className="assessment__hint t-small">
        {UI_ASSESSMENT.scaleHint}
      </p>
      <div
        className="assessment__rows"
        ref={rowsRef}
        onPointerDown={() => (arrowing.current = false)}
      >
        {assessment.questions.map((question, index) => (
          <AssessmentQuestion
            key={index}
            id={id}
            index={index}
            question={question}
            type={answerTypes[index] ?? 'scale'}
            answer={state.answers[index] ?? null}
            hintId={hintId}
            onAnswer={onAnswer}
            onKeyDown={onKeyDown}
          />
        ))}
      </div>

      <div className="assessment__actions" ref={actionsRef}>
        {/* Always present so the region exists before it first speaks and the action never shifts. */}
        <p
          id={tallyId}
          className="assessment__tally t-eyebrow"
          aria-live="polite"
          data-testid="assessment-tally"
        >
          {score.answered > 0 ? progressLabel(score.answered, total) : null}
        </p>
        <LineActionButton
          type="button"
          onClick={onAction}
          aria-disabled={complete ? undefined : true}
          aria-describedby={tallyId}
        >
          {state.revealed ? UI_ASSESSMENT.startAgain : UI_ASSESSMENT.seeResult}
        </LineActionButton>
      </div>

      {state.revealed && score.band && score.average !== null && (
        <AssessmentResult
          average={score.average}
          band={score.band}
          interpretation={assessment.interpretation}
          disclaimer={disclaimer}
          consultation={consultation}
          enquire={enquire}
        />
      )}
      {/* R6: the opt-in "send my answers" block sits here, beneath the result. */}
    </div>
  )
}
