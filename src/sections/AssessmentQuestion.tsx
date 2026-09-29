/**
 * One question of the self-assessment (docs/05 §Self-assessment; round 1,
 * R5): a fieldset with the radio-group role whose legend is the numeral and
 * the client's question, and a row of cells beneath it (beside it from
 * 1024px): ten numbered cells for a 1 to 10 question, three words for a
 * yes / no / maybe one. The cells are native radios painted by ChoiceCell,
 * so Tab moves between questions and the arrow keys within one. A scale
 * group is described by the one line that reads the scale.
 *
 * Rendered only by AssessmentForm, which owns the answers.
 */
import type { KeyboardEvent } from 'react'
import { ChoiceCell } from '@/components/Field'
import type { AnswerType } from '@/content/assessment-answers'
import {
  FACT_ANSWERS,
  SCALE_VALUES,
  factLabel,
  type Answer,
  type FactAnswer,
} from '@/lib/assessment'
import { numeral } from '@/lib/interior'

type Option = Readonly<{ value: FactAnswer | number; label: string }>

const SCALE_OPTIONS: readonly Option[] = SCALE_VALUES.map((value) => ({
  value,
  label: String(value),
}))
const FACT_OPTIONS: readonly Option[] = FACT_ANSWERS.map((value) => ({
  value,
  label: factLabel(value),
}))

export type QuestionProps = {
  /** Unique per form; the radios' `name` and ids derive from it. */
  id: string
  index: number
  question: string
  type: AnswerType
  answer: Answer
  /** The id of the line that reads the 1 to 10 scale. */
  hintId: string
  onAnswer: (index: number, value: FactAnswer | number) => void
  onKeyDown: (event: KeyboardEvent<HTMLFieldSetElement>) => void
}

export function AssessmentQuestion({
  id,
  index,
  question,
  type,
  answer,
  hintId,
  onAnswer,
  onKeyDown,
}: QuestionProps) {
  const name = `${id}-q${index}`
  const scale = type === 'scale'
  const options = scale ? SCALE_OPTIONS : FACT_OPTIONS
  return (
    <fieldset
      className="assessment__row"
      role="radiogroup"
      aria-describedby={scale ? hintId : undefined}
      data-type={type}
      data-answered={answer === null ? undefined : 'true'}
      onKeyDown={onKeyDown}
    >
      <legend className="assessment__legend">
        <span className="assessment__numeral t-eyebrow" aria-hidden="true">
          {numeral(index + 1)}
        </span>
        <span className="assessment__question t-body">{question}</span>
      </legend>
      <div className={`assessment__cells assessment__cells--${type}`}>
        {options.map((option) => (
          <ChoiceCell
            key={option.value}
            id={`${name}-${option.value}`}
            label={option.label}
            labelClassName={scale ? 't-small' : 't-eyebrow'}
            input={{
              name,
              value: String(option.value),
              checked: answer === option.value,
              onChange: () => onAnswer(index, option.value),
              autoComplete: 'off',
            }}
          />
        ))}
      </div>
    </fieldset>
  )
}
