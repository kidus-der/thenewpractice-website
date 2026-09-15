import type { ComponentPropsWithRef } from 'react'
import './Field.css'
import { cn } from '@/lib/cn'

/**
 * Form field primitives — docs/03 §5 *Form fields*.
 *
 * Bottom rule only; the label sits on the baseline and floats up on focus
 * or once filled; a brass underline wipes in from the left on focus. The
 * error line lives outside the control, in --accent, as a `role="alert"`
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
