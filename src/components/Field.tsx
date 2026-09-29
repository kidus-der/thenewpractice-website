import type { ComponentPropsWithRef } from 'react'
import './Field.css'
import { cn } from '@/lib/cn'

/**
 * Form field primitives — docs/03 §5 *Form fields*.
 *
 * Bottom rule only; the label sits on the baseline and floats up on focus
 * or once filled; a brass underline wipes in from the left on focus. The
 * error line lives outside the control, in ink (--fg), as a `role="alert"`
 * region that is always present so its arrival announces and never shifts
 * the layout. No user-facing literal here: every string arrives as a prop.
 */
type Shell = {
  id: string
  label: string
  error?: string
  className?: string
}

const errorId = (id: string): string => `${id}-error`

function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    <p className="field__error t-small" id={errorId(id)} role="alert">
      {error}
    </p>
  )
}

type TextFieldProps = Shell & Omit<ComponentPropsWithRef<'input'>, 'id' | 'className'>

export function TextField({ id, label, error, className, ...input }: TextFieldProps) {
  return (
    <div className={cn('field', className)}>
      <div className="field__control">
        <input
          id={id}
          className="field__input"
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId(id) : undefined}
          {...input}
        />
        <span className="field__underline" aria-hidden="true" />
        <label className="field__label t-small" htmlFor={id}>
          {label}
        </label>
      </div>
      <FieldError id={id} error={error} />
    </div>
  )
}

type TextAreaProps = Shell & Omit<ComponentPropsWithRef<'textarea'>, 'id' | 'className'>

export function TextArea({ id, label, error, className, ...textarea }: TextAreaProps) {
  return (
    <div className={cn('field field--multiline', className)}>
      <div className="field__control">
        <textarea
          id={id}
          className="field__input"
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId(id) : undefined}
          {...textarea}
        />
        <span className="field__underline" aria-hidden="true" />
        <label className="field__label t-small" htmlFor={id}>
          {label}
        </label>
      </div>
      <FieldError id={id} error={error} />
    </div>
  )
}

export type ChoiceOption = Readonly<{ value: string; label: string }>

type ChoiceFieldProps = Shell & {
  options: readonly ChoiceOption[]
  /** Spread onto every radio: name, required, and React Hook Form's register(). */
  input: Omit<ComponentPropsWithRef<'input'>, 'id' | 'type' | 'value' | 'className'>
}

type ChoiceToggleProps = {
  id: string
  label: string
  /** Spread onto the radio: name, value, checked, onChange, required, register(). */
  input: Omit<ComponentPropsWithRef<'input'>, 'id' | 'type' | 'className'>
}

/**
 * One radio painted as a line-action toggle: letterspaced caps with a brass
 * tick drawn beside the word when chosen, no box. The radio itself stays in
 * the document, unpainted, so the native keyboard model (arrow keys move,
 * Space selects) and the group semantics come for free. Used by ChoiceField
 * below and by the self-assessment scorer (Task 18b).
 */
export function ChoiceToggle({ id, label, input }: ChoiceToggleProps) {
  return (
    <label className="choice__option" htmlFor={id}>
      <input id={id} className="choice__input" type="radio" {...input} />
      <span className="choice__tick" aria-hidden="true" />
      <span className="choice__label t-eyebrow">{label}</span>
    </label>
  )
}

/**
 * One radio painted as a cell in a row of equal answers: the word or number
 * on a hairline, the brass rule under the chosen one. The self-assessment's
 * 1 to 10 scale and its yes / no / maybe use it (round 1, R5). As with
 * ChoiceToggle the radio stays in the document, unpainted, so the arrow keys
 * and the group semantics are the browser's own.
 */
export function ChoiceCell({
  id,
  label,
  input,
  className,
  labelClassName,
}: ChoiceToggleProps & { className?: string; labelClassName?: string }) {
  return (
    <label className={cn('choice__cell', className)} htmlFor={id}>
      <input id={id} className="choice__input" type="radio" {...input} />
      <span className={cn('choice__cell-label', labelClassName)}>{label}</span>
    </label>
  )
}

/**
 * A radio group rendered as line-action toggles: letterspaced caps, a brass
 * tick drawn beside the chosen word, no boxes. Native radios carry the
 * keyboard model (arrow keys move, Space selects) and the group semantics.
 */
export function ChoiceField({ id, label, error, className, options, input }: ChoiceFieldProps) {
  return (
    <fieldset
      id={id}
      className={cn('field choice', className)}
      role="radiogroup"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId(id) : undefined}
    >
      <legend className="choice__legend t-eyebrow">{label}</legend>
      <div className="choice__options">
        {options.map((option) => (
          <ChoiceToggle
            key={option.value}
            id={`${id}-${option.value}`}
            label={option.label}
            input={{ value: option.value, ...input }}
          />
        ))}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  )
}

type CheckFieldProps = Shell & {
  /** Spread onto the checkbox: name, value, required, register(). */
  input: Omit<ComponentPropsWithRef<'input'>, 'id' | 'type' | 'className'>
}

/**
 * One checkbox with its sentence beside it: a hairline square in the muted
 * ink, filled with a small brass square when ticked. The native checkbox
 * stays in the document, unpainted, so Space toggles it and the label is its
 * name. Used for the self-assessment's one-line consent (round 1, R6).
 */
export function CheckField({ id, label, error, className, input }: CheckFieldProps) {
  return (
    <div className={cn('field check', className)}>
      <label className="check__option" htmlFor={id}>
        <input
          id={id}
          className="choice__input"
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId(id) : undefined}
          {...input}
        />
        <span className="check__box" aria-hidden="true" />
        <span className="check__label t-small">{label}</span>
      </label>
      <FieldError id={id} error={error} />
    </div>
  )
}
