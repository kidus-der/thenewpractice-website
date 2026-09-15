'use client'

/**
 * The enquiry form — the client half of T7 (docs/05 §T7, docs/04 §6 *Field
 * focus / confirmation*).
 *
 * React Hook Form validates the visible fields on blur with the shared Zod
 * schema; a valid submission is handed to the server action through
 * useActionState. Without JavaScript the same <form> posts to the action and
 * the page re-renders with the returned state, so the form works either way.
 *
 * On `sent` the fields fade out with a short stagger (Motion, state-driven)
 * and the confirmation reveals line by line (GSAP <Reveal>, a different
 * element). Under reduced motion the swap is instant.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react'
import { useForm } from 'react-hook-form'

import { LineActionButton } from '@/components/LineAction'
import { ChoiceField, TextArea, TextField } from '@/components/Field'
import { BRAND } from '@/content/brand'
import { ENQUIRING_FOR, ENQUIRY, PREFERRED_CONTACT } from '@/content/enquiry'
import { Reveal } from '@/motion/Reveal'
import { D, STAGGER } from '@/motion/tokens'
import { submitEnquiry } from '@/server/enquiry.action'
import { INITIAL_ENQUIRY_RESULT } from '@/server/enquiry.handler'
import {
  enquiryFormSchema,
  type EnquiryFieldErrors,
  type EnquiryFieldName,
  type EnquiryFormValues,
} from '@/server/enquiry.schema'

const ID = 'enquiry'
const MESSAGE_ROWS = 4
const NO_ERRORS: EnquiryFieldErrors = {}

const formVariants = {
  exit: { transition: { staggerChildren: STAGGER.fields } },
} as const satisfies Variants

const rowVariants = {
  exit: { opacity: 0, transition: { duration: D.fast } },
} as const satisfies Variants

const noop = () => () => {}

/**
 * Epoch milliseconds of the first client render, "" on the server and until
 * hydration. Read through useSyncExternalStore so the server markup and the
 * hydration pass agree and the stamp is taken once per mount.
 */
function useStartedAt(): string {
  const [clock] = useState(() => {
    let stamp = ''
    return {
      get: () => {
        if (stamp === '') stamp = String(Date.now())
        return stamp
      },
      server: () => '',
    }
  })
  return useSyncExternalStore(noop, clock.get, clock.server)
}

const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`

function Failed() {
  return (
    <p className="enquiry-form__failed t-small" role="status">
      {ENQUIRY.failed}{' '}
      <a className="link" href={telHref(BRAND.phone)}>
        {BRAND.phone}
      </a>{' '}
      {ENQUIRY.failedSeparator}{' '}
      <a className="link" href={`mailto:${BRAND.email}`}>
        {BRAND.email}
      </a>
    </p>
  )
}

function Confirmation() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="enquiry-form__sent" role="status" tabIndex={-1} ref={ref}>
      <Reveal as="p" variant="lines" className="t-d3 enquiry-form__sent-copy">
        {ENQUIRY.confirmation.map((line, index) => (
          <span key={line}>
            {index > 0 && <br />}
            {line}
          </span>
        ))}
      </Reveal>
    </div>
  )
}

export function EnquiryForm({ headingId }: { headingId: string }) {
  const [result, formAction, isPending] = useActionState(submitEnquiry, INITIAL_ENQUIRY_RESULT)
  const reduced = useReducedMotion()
  const startedAt = useStartedAt()
  const hydrated = startedAt !== ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryFormValues>({ resolver: zodResolver(enquiryFormSchema), mode: 'onBlur' })

  const serverErrors = result.status === 'invalid' ? result.fieldErrors : NO_ERRORS
  const errorFor = (name: EnquiryFieldName): string | undefined =>
    errors[name]?.message ?? serverErrors[name]

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending) return
    const form = event.currentTarget
    void handleSubmit(() => {
      startTransition(() => formAction(new FormData(form)))
    })(event)
  }

  const exit = reduced ? undefined : 'exit'

  return (
    <AnimatePresence mode="wait" initial={false}>
      {result.status === 'sent' ? (
        <Confirmation key="sent" />
      ) : (
        <motion.form
          key="form"
          className="enquiry-form"
          action={formAction}
          onSubmit={onSubmit}
          noValidate={hydrated}
          aria-labelledby={headingId}
          variants={formVariants}
          exit={exit}
        >
          <motion.div className="enquiry-form__row" variants={rowVariants}>
            <TextField
              id={`${ID}-name`}
              label={ENQUIRY.fields.name}
              type="text"
              autoComplete="name"
              required
              error={errorFor('name')}
              {...register('name')}
            />
          </motion.div>
          <motion.div className="enquiry-form__row" variants={rowVariants}>
            <TextField
              id={`${ID}-email`}
              label={ENQUIRY.fields.email}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              error={errorFor('email')}
              {...register('email')}
            />
          </motion.div>
          <motion.div className="enquiry-form__row" variants={rowVariants}>
            <TextField
              id={`${ID}-telephone`}
              label={ENQUIRY.fields.telephone}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              error={errorFor('telephone')}
              {...register('telephone')}
            />
          </motion.div>
          <motion.div className="enquiry-form__row" variants={rowVariants}>
            <ChoiceField
              id={`${ID}-enquiringFor`}
              label={ENQUIRY.fields.enquiringFor}
              options={ENQUIRING_FOR.map((value) => ({
                value,
                label: ENQUIRY.options.enquiringFor[value],
              }))}
              error={errorFor('enquiringFor')}
              input={{ required: true, ...register('enquiringFor') }}
            />
          </motion.div>
          <motion.div className="enquiry-form__row" variants={rowVariants}>
            <TextArea
              id={`${ID}-message`}
              label={ENQUIRY.fields.message}
              rows={MESSAGE_ROWS}
              required
              error={errorFor('message')}
              {...register('message')}
            />
          </motion.div>
          <motion.div className="enquiry-form__row" variants={rowVariants}>
            <ChoiceField
              id={`${ID}-preferredContact`}
              label={ENQUIRY.fields.preferredContact}
              options={PREFERRED_CONTACT.map((value) => ({
                value,
                label: ENQUIRY.options.preferredContact[value],
              }))}
              error={errorFor('preferredContact')}
              input={{ required: true, ...register('preferredContact') }}
            />
          </motion.div>

          {/* Anti-abuse. The honeypot is off-canvas and out of the tab order;
              the timing token is stamped on the client and absent without JS. */}
          <div className="enquiry-form__hp" aria-hidden="true">
            <label htmlFor={`${ID}-website`}>{ENQUIRY.honeypot}</label>
            <input
              id={`${ID}-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <input type="hidden" name="startedAt" value={startedAt} />

          <motion.div className="enquiry-form__actions" variants={rowVariants}>
            <LineActionButton type="submit" aria-disabled={isPending || undefined}>
              {isPending ? ENQUIRY.sending : ENQUIRY.submit}
            </LineActionButton>
            {result.status === 'failed' && <Failed />}
          </motion.div>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
