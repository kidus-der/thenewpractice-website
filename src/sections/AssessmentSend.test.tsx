/**
 * The opt-in beneath a result (round 1, R6): nothing is sent until the
 * visitor opens the form, fills it in and submits it; what is submitted is
 * exactly the sheet the result was scored from; the result stays on screen.
 * The server action is replaced by a spy (its own tests are in src/server).
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { ASSESSMENTS, ASSESSMENTS_PAGE } from '@/content/assessments'
import { answerTypesFor } from '@/content/assessment-answers'
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import { BRAND } from '@/content/brand'
import { NAV } from '@/content/nav'
import { UI_ASSESSMENT } from '@/content/ui'
import { AssessmentForm } from './AssessmentForm'

const action = vi.hoisted(() => ({
  send: vi.fn<(previous: unknown, data: FormData) => Promise<{ status: string }>>(async () => ({
    status: 'sent',
  })),
}))
vi.mock('@/server/assessment.action', () => ({ sendAssessment: action.send }))
vi.mock('@/motion/Reveal', () => ({
  Reveal: ({
    as: Tag = 'div',
    children,
    className,
  }: {
    as?: 'div'
    children: ReactNode
    className?: string
  }) => <Tag className={className}>{children}</Tag>,
}))
vi.mock('@/motion/SmoothScroll', () => ({ scrollTo: vi.fn() }))

const assessment = ASSESSMENTS.find((a) => a.slug === 'alcohol')
const section = (id: string) => ASSESSMENTS_PAGE.sections.find((s) => s.id === id)
const consultation = section('a-confidential-consultation')
const disclaimer = section('important-disclaimer')
const [enquire] = NAV.utility
if (!assessment || !consultation || !disclaimer || !enquire) throw new Error('content missing')
const types = answerTypesFor(assessment.slug)
const SHEET = types.map((type, i) => (type === 'scale' ? String((i % 10) + 1) : 'maybe'))

async function revealResult() {
  const user = userEvent.setup()
  render(
    <AssessmentForm
      assessment={assessment!}
      answerTypes={types}
      disclaimer={disclaimer!}
      consultation={consultation!}
      enquire={enquire!}
    />
  )
  SHEET.forEach((value, i) => {
    const radio = document
      .querySelectorAll('fieldset')
      [i]?.querySelector<HTMLInputElement>(`input[value="${value}"]`)
    if (!radio) throw new Error(`no ${value} in row ${i}`)
    fireEvent.click(radio)
  })
  await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))
  return user
}

const openButton = () => screen.getByRole('button', { name: ASSESSMENT_SEND.open })
const sendForm = () => screen.getByRole('form', { name: ASSESSMENT_SEND.formLabel })

describe('AssessmentSend', { timeout: 20_000 }, () => {
  afterEach(() => action.send.mockClear())

  it('offers the send beneath the result, collapsed, and sends nothing until asked', async () => {
    await revealResult()

    expect(openButton()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(action.send).not.toHaveBeenCalled()
  })

  it('opens to the form with focus on the name, and still sends nothing', async () => {
    const user = await revealResult()
    await user.click(openButton())

    expect(openButton()).toHaveAttribute('aria-expanded', 'true')
    expect(openButton()).toHaveAttribute('aria-controls', sendForm().id)
    expect(screen.getByLabelText(ASSESSMENT_SEND.fields.name)).toHaveFocus()
    expect(within(sendForm()).getByText(ASSESSMENT_SEND.intro)).toBeInTheDocument()
    expect(action.send).not.toHaveBeenCalled()
  })

  it('names what is missing and does not submit an incomplete form', async () => {
    const user = await revealResult()
    await user.click(openButton())
    await user.click(within(sendForm()).getByRole('button', { name: ASSESSMENT_SEND.submit }))

    expect(await screen.findByText(ASSESSMENT_SEND.errors.name)).toBeInTheDocument()
    expect(screen.getByText(ASSESSMENT_SEND.errors.preferredContact)).toBeInTheDocument()
    expect(screen.getByText(ASSESSMENT_SEND.errors.consent)).toBeInTheDocument()
    expect(action.send).not.toHaveBeenCalled()
  })

  it('submits exactly the sheet and the details, then confirms with the result still shown', async () => {
    const user = await revealResult()
    await user.click(openButton())
    await user.type(screen.getByLabelText(ASSESSMENT_SEND.fields.name), 'Sam Rivera')
    await user.click(screen.getByRole('radio', { name: 'Email' }))
    await user.type(screen.getByLabelText(ASSESSMENT_SEND.fields.email), 'sam@example.com')
    await user.click(screen.getByRole('checkbox', { name: ASSESSMENT_SEND.consent }))
    await user.click(within(sendForm()).getByRole('button', { name: ASSESSMENT_SEND.submit }))

    expect(action.send).toHaveBeenCalledTimes(1)
    const data = action.send.mock.calls[0]?.[1] as FormData
    expect(JSON.parse(String(data.get('answers')))).toEqual(
      SHEET.map((value) => (/^\d+$/.test(value) ? Number(value) : value))
    )
    expect(Object.fromEntries(data)).toMatchObject({
      slug: 'alcohol',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      telephone: '',
      preferredContact: 'email',
      consent: 'yes',
      website: '',
    })
    expect(String(data.get('startedAt'))).toMatch(/^\d+$/)
    const sent = await screen.findByTestId('assessment-send-sent')
    expect(sent).toHaveTextContent(ASSESSMENT_SEND.confirmation[1])
    expect(sent).toHaveFocus()
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('shows the failure line with the practice’s telephone and email', async () => {
    action.send.mockImplementationOnce(async () => ({ status: 'failed' }))
    const user = await revealResult()
    await user.click(openButton())
    await user.type(screen.getByLabelText(ASSESSMENT_SEND.fields.name), 'Sam')
    await user.click(screen.getByRole('radio', { name: 'Telephone' }))
    await user.type(screen.getByLabelText(ASSESSMENT_SEND.fields.telephone), '+1 555 010 0199')
    await user.click(screen.getByRole('checkbox', { name: ASSESSMENT_SEND.consent }))
    await user.click(within(sendForm()).getByRole('button', { name: ASSESSMENT_SEND.submit }))

    expect(await screen.findByText(ASSESSMENT_SEND.failed, { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: BRAND.phone })).toBeInTheDocument()
    expect(sendForm()).toBeInTheDocument()
  })
})
