'use client'

/**
 * *Send my answers to the practice* (round 1, R6; docs/05 §Self-assessment,
 * docs/09 §3 *Self-assessment data handling*). Beneath a revealed result: one
 * line action, a disclosure, that reveals a short form (name, email,
 * telephone, preferred contact, a one-line consent). Nothing leaves the
 * browser until the visitor submits it; then the answers, the questionnaire's
 * slug and the details go to the server action, which re-scores the sheet,
 * emails the practice and keeps nothing. The result stays on screen
 * throughout; the form becomes a calm confirmation, or a failure line with
 * the practice's telephone and email.
 *
 * React Hook Form validates on blur with the shared Zod schema; the honeypot
 * and the timing token (stamped when the form opens) ride along as with the
 * enquiry form. The form exists only with JavaScript, as the questionnaire
 * does.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { startTransition, useActionState, useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import './AssessmentSend.css'
import { CheckField, ChoiceField, TextField } from '@/components/Field'
import { LineActionButton } from '@/components/LineAction'
import { useStartedAt } from '@/components/useStartedAt'
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import { BRAND } from '@/content/brand'
import { ENQUIRY, PREFERRED_CONTACT } from '@/content/enquiry'
import type { Answer } from '@/lib/assessment'
import { mailHref, telHref } from '@/lib/contact'
import { Reveal } from '@/motion/Reveal'
import { sendAssessment } from '@/server/assessment.action'
import type { AssessmentSendResult } from '@/server/assessment.handler'
import {
  CONSENT_VALUE,
  assessmentSendFormSchema,
  type AssessmentSendFieldErrors,
  type AssessmentSendFieldName,
  type AssessmentSendValues,
} from '@/server/assessment.schema'
import { IDLE } from '@/server/results'
import { bringIntoView } from './assessmentScroll'

type Props = Readonly<{
  /** The questionnaire, by slug; the server re-reads it. */
  slug: string
  /** The complete sheet the result was scored from. */
  answers: readonly Answer[]
}>

const NO_ERRORS: AssessmentSendFieldErrors = {}
const INITIAL: AssessmentSendResult = IDLE

function Failed() {
  return (
    <p className="assessment-send__failed t-small" role="status">
      {ASSESSMENT_SEND.failed}{' '}
      <a className="link" href={telHref(BRAND.phone)}>
        {BRAND.phone}
      </a>{' '}
      {ASSESSMENT_SEND.failedSeparator}{' '}
      <a className="link" href={mailHref(BRAND.email)}>
        {BRAND.email}
      </a>
    </p>
  )
}

function Confirmation() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <div
      className="assessment-send__sent"
      role="status"
      tabIndex={-1}
      ref={ref}
      data-testid="assessment-send-sent"
    >
      <Reveal as="p" variant="lines" className="t-d3 assessment-send__sent-copy">
        {ASSESSMENT_SEND.confirmation.map((line, index) => (
          <span key={line}>
            {index > 0 && <br />}
            {line}
          </span>
        ))}
      </Reveal>
    </div>
  )
}

type FormProps = Props &
  Readonly<{
    id: string
    result: AssessmentSendResult
    formAction: (data: FormData) => void
    isPending: boolean
  }>

function SendForm({ id, slug, answers, result, formAction, isPending }: FormProps) {
  const startedAt = useStartedAt()
  const formRef = useRef<HTMLFormElement>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssessmentSendValues>({
    resolver: zodResolver(assessmentSendFormSchema),
    mode: 'onBlur',
  })

  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')
    if (!first) return
    first.focus({ preventScroll: true })
    bringIntoView(first)
  }, [])

  const serverErrors = result.status === 'invalid' ? result.fieldErrors : NO_ERRORS
  const errorFor = (name: AssessmentSendFieldName): string | undefined =>
    errors[name]?.message ?? serverErrors[name]

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending) return
    const form = event.currentTarget
    void handleSubmit(() => {
      startTransition(() => formAction(new FormData(form)))
    })(event)
  }

  return (
    <form
      id={id}
      ref={formRef}
      className="assessment-send__form"
      noValidate
      aria-label={ASSESSMENT_SEND.formLabel}
      onSubmit={onSubmit}
    >
      <p className="assessment-send__intro t-small">{ASSESSMENT_SEND.intro}</p>
      <TextField
        id={`${id}-name`}
        label={ASSESSMENT_SEND.fields.name}
        type="text"
        autoComplete="name"
        required
        error={errorFor('name')}
        {...register('name')}
      />
      <ChoiceField
        id={`${id}-preferredContact`}
        label={ASSESSMENT_SEND.fields.preferredContact}
        options={PREFERRED_CONTACT.map((value) => ({
          value,
          label: ENQUIRY.options.preferredContact[value],
        }))}
        error={errorFor('preferredContact')}
        input={{
          required: true,
          'aria-describedby': `${id}-hint`,
          ...register('preferredContact'),
        }}
      />
      <p id={`${id}-hint`} className="assessment-send__hint t-small">
        {ASSESSMENT_SEND.contactHint}
      </p>
      <TextField
        id={`${id}-email`}
        label={ASSESSMENT_SEND.fields.email}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errorFor('email')}
        {...register('email')}
      />
      <TextField
        id={`${id}-telephone`}
        label={ASSESSMENT_SEND.fields.telephone}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        error={errorFor('telephone')}
        {...register('telephone')}
      />
      <CheckField
        id={`${id}-consent`}
        label={ASSESSMENT_SEND.consent}
        error={errorFor('consent')}
        input={{ value: CONSENT_VALUE, required: true, ...register('consent') }}
      />

      {/* Anti-abuse and the sheet: the honeypot is off-canvas and out of the tab order. */}
      <div className="assessment-send__hp" aria-hidden="true">
        <label htmlFor={`${id}-website`}>{ASSESSMENT_SEND.honeypot}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      <div className="assessment-send__actions">
        <LineActionButton type="submit" aria-disabled={isPending || undefined}>
          {isPending ? ASSESSMENT_SEND.sending : ASSESSMENT_SEND.submit}
        </LineActionButton>
        {result.status === 'failed' && <Failed />}
      </div>
    </form>
  )
}

export function AssessmentSend({ slug, answers }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [result, formAction, isPending] = useActionState(sendAssessment, INITIAL)

  if (result.status === 'sent') {
    return (
      <div className="assessment-send">
        <Confirmation />
      </div>
    )
  }
  const formId = `${id}-form`
  return (
    <div className="assessment-send" data-testid="assessment-send">
      <LineActionButton
        type="button"
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {ASSESSMENT_SEND.open}
      </LineActionButton>
      {open && (
        <SendForm
          id={formId}
          slug={slug}
          answers={answers}
          result={result}
          formAction={formAction}
          isPending={isPending}
        />
      )}
    </div>
  )
}
