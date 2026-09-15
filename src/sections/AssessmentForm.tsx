'use client'

/**
 * The self-assessment scorer (docs/05 §Self-assessment, docs/09 §2 and §3
 * *Self-assessment data handling*). Fifteen questions as a hairline list,
 * each a fieldset whose legend is the question and whose two radios are
 * painted as the line-action toggles the enquiry form uses; a tally that
 * appears after the first answer; one action that reveals the result once
 * every question is answered, and resets the sheet once it has.
 *
 * The answers are one immutable array in a reducer (src/lib/assessment.ts)
 * and nothing else: there is no <form> to submit them, nothing is written to
 * storage, cookies or the URL, and no request is made. Closing the tab is
 * the only exit. The result reveals through the site's reveal primitive; the
 * GSAP match-media gate and the stylesheet safety net make it instant under
 * reduced motion.
 */
import Link from 'next/link'
import { useEffect, useId, useReducer, useRef } from 'react'
import './AssessmentForm.css'
import { ChoiceToggle } from '@/components/Field'
import { LineActionButton } from '@/components/LineAction'
import type { Assessment, NavItem, Section } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import {
  assessmentReducer,
  initialAssessmentState,
  isComplete,
  progressLabel,
  scoreAssessment,
  scoreLabel,
  type Answer,
  type AssessmentScore,
  type ScoringBand,
} from '@/lib/assessment'
import { numeral } from '@/lib/interior'
import { Reveal } from '@/motion/Reveal'

type Props = {
  assessment: Assessment
  /** The client's *A Confidential Consultation* section, shown with the result. */
  consultation: Section
  /** The *Enquire* action, from NAV.utility. */
  enquire: NavItem
}

type RowProps = {
  id: string
  index: number
  question: string
  answer: Answer
  onAnswer: (index: number, value: boolean) => void
}

const YES = 'yes'
const NO = 'no'

function QuestionRow({ id, index, question, answer, onAnswer }: RowProps) {
  const name = `${id}-q${index}`
  const option = (value: boolean) => ({
    name,
    value: value ? YES : NO,
    checked: answer === value,
    onChange: () => onAnswer(index, value),
    autoComplete: 'off',
  })
  return (
    <fieldset className="assessment__row">
      <legend className="assessment__legend">
        <span className="assessment__numeral t-eyebrow" aria-hidden="true">
          {numeral(index + 1)}
        </span>
        <span className="assessment__question t-body">{question}</span>
      </legend>
      <div className="assessment__options">
        <ChoiceToggle id={`${name}-${YES}`} label={UI_ASSESSMENT.yes} input={option(true)} />
        <ChoiceToggle id={`${name}-${NO}`} label={UI_ASSESSMENT.no} input={option(false)} />
      </div>
    </fieldset>
  )
}

type ResultProps = {
  score: AssessmentScore
  band: ScoringBand
  max: number
  interpretation: string
  consultation: Section
  enquire: NavItem
}

function Result({ score, band, max, interpretation, consultation, enquire }: ResultProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="assessment__result" role="status" tabIndex={-1} ref={ref}>
      <p className="assessment__score t-eyebrow">{scoreLabel(score.total, max)}</p>
      <Reveal variant="lines" as="h2" className="t-d2 assessment__band">
        {band.label}
      </Reveal>
      {band.description && (
        <Reveal as="p" className="t-lead assessment__band-description">
          {band.description}
        </Reveal>
      )}
      <Reveal as="p" className="t-body assessment__interpretation">
        {interpretation}
      </Reveal>
      <div className="assessment__consultation">
        {consultation.title && (
          <Reveal variant="lines" as="h3" className="t-d3 assessment__consultation-title">
            {consultation.title}
          </Reveal>
        )}
        <Reveal staggerChildren className="assessment__prose">
          {consultation.paragraphs.map((paragraph) => (
            <p key={paragraph} className="t-body">
              {paragraph}
            </p>
          ))}
        </Reveal>
        <Reveal className="assessment__enquire">
          <Link className="line-action t-eyebrow" href={enquire.href}>
            {enquire.label}
          </Link>
        </Reveal>
      </div>
    </div>
  )
}

export function AssessmentForm({ assessment, consultation, enquire }: Props) {
  const id = useId()
  const [state, dispatch] = useReducer(
    assessmentReducer,
    assessment.questions.length,
    initialAssessmentState
  )
  const score = scoreAssessment(state.answers, assessment.scoring)
  const complete = isComplete(state.answers)
  const tallyId = `${id}-tally`

  const onAnswer = (index: number, value: boolean) => dispatch({ type: 'answer', index, value })
  const onAction = () => {
    if (!complete) return
    dispatch({ type: state.revealed ? 'reset' : 'reveal' })
  }

  return (
    <div className="assessment">
      <div className="assessment__rows">
        {assessment.questions.map((question, index) => (
          <QuestionRow
            key={index}
            id={id}
            index={index}
            question={question}
            answer={state.answers[index] ?? null}
            onAnswer={onAnswer}
          />
        ))}
      </div>

      <div className="assessment__actions">
        {/* Always present so the region exists before it first speaks and the action never shifts. */}
        <p
          id={tallyId}
          className="assessment__tally t-eyebrow"
          aria-live="polite"
          data-testid="assessment-tally"
        >
          {score.answered > 0 ? progressLabel(score.answered, assessment.scoring.max) : null}
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

      {state.revealed && score.band && (
        <Result
          score={score}
          band={score.band}
          max={assessment.scoring.max}
          interpretation={assessment.interpretation}
          consultation={consultation}
          enquire={enquire}
        />
      )}
    </div>
  )
}
