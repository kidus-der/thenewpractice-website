/**
 * The scorer keeps its answers in React state and nowhere else. This test
 * answers a questionnaire in jsdom and then looks everywhere a page could have
 * put something — storage, cookies, the URL, the network — and expects nothing.
 * The reveal primitive is replaced by a plain element: GSAP has no viewport
 * here and the motion is verified in the browser by Playwright.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { ASSESSMENTS, ASSESSMENTS_PAGE } from '@/content/assessments'
import { NAV } from '@/content/nav'
import { QUESTIONS_PER_ASSESSMENT } from '@/content/schemas'
import { UI_ASSESSMENT } from '@/content/ui'
import { answerTypesFor } from '@/content/assessment-answers'
import { progressLabel, scoreLabel } from '@/lib/assessment'
import { AssessmentForm } from './AssessmentForm'

vi.mock('@/motion/Reveal', () => ({
  // The reveal's own props stop here; only DOM attributes reach the element.
  Reveal: ({
    as: Tag = 'div',
    children,
    className,
    id,
  }: {
    as?: 'div'
    children: ReactNode
    className?: string
    id?: string
    variant?: string
    staggerChildren?: boolean
  }) => (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  ),
}))

vi.mock('@/motion/SmoothScroll', () => ({ scrollTo: vi.fn() }))

const [assessment] = ASSESSMENTS
const section = (id: string) => ASSESSMENTS_PAGE.sections.find((s) => s.id === id)
const consultation = section('a-confidential-consultation')
const disclaimer = section('important-disclaimer')
const [enquire] = NAV.utility
if (!assessment || !consultation || !disclaimer || !enquire) {
  throw new Error('content missing for the test')
}
const types = answerTypesFor(assessment.slug)

const N = QUESTIONS_PER_ASSESSMENT
const moderate = assessment.scoring.bands.find((b) => b.key === 'moderate')
if (!moderate) throw new Error('no moderate band')

const setup = () => {
  const user = userEvent.setup()
  render(
    <AssessmentForm
      assessment={assessment}
      answerTypes={types}
      disclaimer={disclaimer}
      consultation={consultation}
      enquire={enquire}
    />
  )
  return user
}

const rows = () => screen.getAllByRole('radiogroup')
const radioIn = (index: number, value: string) => {
  const radio = document
    .querySelectorAll('fieldset')
    [index]?.querySelector<HTMLInputElement>(`input[value="${value}"]`)
  if (!radio) throw new Error(`no ${value} radio in row ${index}`)
  return radio
}
/** By selector and a plain click: fifteen role queries and pointer sequences per sheet are slow in jsdom. */
const answer = (index: number, value: string) => fireEvent.click(radioIn(index, value))

/** Every question at 5 or maybe: an average of 5.0, the moderate band. */
const answerAllMiddle = () =>
  types.forEach((type, i) => answer(i, type === 'scale' ? '5' : 'maybe'))

/** An in-memory Storage that records every write; Node 26's jsdom exposes none of its own. */
const storageSpy = () => {
  const store = new Map<string, string>()
  return {
    setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
  }
}

// Every test renders and answers a sheet of fifteen; on a shared, loaded machine
// that has run past Vitest's 5 s default (ledger, R7 acceptance note).
describe('AssessmentForm', { timeout: 20_000 }, () => {
  const fetchSpy = vi.fn()
  const local = storageSpy()
  const session = storageSpy()

  beforeEach(() => {
    local.clear()
    session.clear()
    vi.stubGlobal('localStorage', local)
    vi.stubGlobal('sessionStorage', session)
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    // RTL cleanup runs from vitest.setup.ts
    vi.unstubAllGlobals()
    fetchSpy.mockReset()
    local.setItem.mockClear()
    session.setItem.mockClear()
  })

  it('renders every question as a radio group named by its question, answered its own way', () => {
    setup()
    const groups = rows()
    expect(groups).toHaveLength(N)
    assessment.questions.forEach((question, i) => {
      const group = groups[i]!
      expect(group).toHaveAccessibleName(question)
      // By selector: 150 role queries are slow in jsdom; the group roles are asserted above.
      const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      if (types[i] === 'scale') {
        expect(radios.map((r) => r.getAttribute('value'))).toEqual(
          Array.from({ length: 10 }, (_, n) => String(n + 1))
        )
        expect(group).toHaveAccessibleDescription(UI_ASSESSMENT.scaleHint)
      } else {
        expect(radios.map((r) => (r.closest('label') as HTMLElement).textContent)).toEqual([
          UI_ASSESSMENT.yes,
          UI_ASSESSMENT.no,
          UI_ASSESSMENT.maybe,
        ])
        expect(group).not.toHaveAttribute('aria-describedby')
      }
    })
  })

  it('shows no tally until the first answer, then counts up', () => {
    setup()
    const tally = screen.getByTestId('assessment-tally')
    expect(tally).toHaveAttribute('aria-live', 'polite')
    expect(tally).toHaveTextContent('')
    answer(0, '7')
    expect(tally).toHaveTextContent(progressLabel(1, N))
    answer(0, '2')
    expect(tally).toHaveTextContent(progressLabel(1, N))
    answer(1, 'yes')
    expect(tally).toHaveTextContent(progressLabel(2, N))
  })

  it('moves focus to the next unanswered question after a choice, then to the action', () => {
    setup()
    answer(0, '3')
    expect(radioIn(1, 'yes')).toHaveFocus()
    // Out of order: moving on means forward, to the next question still unanswered.
    answer(2, '4')
    expect(radioIn(3, '1')).toHaveFocus()
    // From the last question it wraps to the first one left.
    answer(N - 1, '6')
    expect(radioIn(1, 'yes')).toHaveFocus()
    for (let i = 1; i < N - 2; i += 1) answer(i, types[i] === 'scale' ? '5' : 'no')
    expect(radioIn(N - 2, '1')).toHaveFocus()
    answer(N - 2, '6')
    expect(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult })).toHaveFocus()
  })

  it('stays on the question while the arrow keys move through its answers', () => {
    setup()
    const group = rows()[0]!
    radioIn(0, '1').focus()
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    fireEvent.click(radioIn(0, '2'))
    radioIn(0, '2').focus()
    expect(radioIn(0, '2')).toBeChecked()
    expect(radioIn(0, '2')).toHaveFocus()
    // Space (or a click) after the arrows moves on.
    fireEvent.keyDown(group, { key: ' ' })
    fireEvent.click(radioIn(0, '3'))
    expect(radioIn(1, 'yes')).toHaveFocus()
  })

  it('keeps the result action disabled and inert until every question is answered', async () => {
    const user = setup()
    const button = screen.getByRole('button', { name: UI_ASSESSMENT.seeResult })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await user.click(button)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    answerAllMiddle()
    expect(button).not.toHaveAttribute('aria-disabled')
  })

  it('reveals the average, the band, the interpretation, the disclaimer and the consultation', async () => {
    const user = setup()
    answerAllMiddle()
    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))

    const result = screen.getByRole('status')
    expect(result).toHaveFocus()
    expect(result).toHaveTextContent(scoreLabel(5))
    expect(within(result).getByRole('heading', { level: 2 })).toHaveTextContent(moderate.label)
    expect(result).toHaveTextContent(assessment.interpretation)
    const [note, invitation] = within(result).getAllByRole('heading', { level: 3 })
    expect(note).toHaveTextContent(disclaimer.title ?? '')
    for (const paragraph of disclaimer.paragraphs) expect(result).toHaveTextContent(paragraph)
    expect(invitation).toHaveTextContent(consultation.title ?? '')
    for (const paragraph of consultation.paragraphs) expect(result).toHaveTextContent(paragraph)
    expect(within(result).getByRole('link', { name: enquire.label })).toHaveAttribute(
      'href',
      enquire.href
    )
    expect(screen.queryByRole('button', { name: UI_ASSESSMENT.seeResult })).not.toBeInTheDocument()
    // The retired scoring line renders nowhere.
    expect(document.body).not.toHaveTextContent(/1 point for each/)
  })

  it('withdraws the result when an answer changes, and clears everything on start again', async () => {
    const user = setup()
    answerAllMiddle()
    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))
    answer(0, '9')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult })).not.toHaveAttribute(
      'aria-disabled'
    )

    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))
    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.startAgain }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('assessment-tally')).toHaveTextContent('')
    expect(document.querySelectorAll('input:checked')).toHaveLength(0)
  })

  it('keeps the answers in component state and nowhere else', async () => {
    const user = setup()
    const href = window.location.href
    answerAllMiddle()
    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))

    expect(local.setItem).not.toHaveBeenCalled()
    expect(session.setItem).not.toHaveBeenCalled()
    expect(local.length).toBe(0)
    expect(session.length).toBe(0)
    expect(document.cookie).toBe('')
    expect(window.location.href).toBe(href)
    expect(fetchSpy).not.toHaveBeenCalled()
    // No <form>: nothing can submit the answers anywhere, by Enter or otherwise.
    expect(document.querySelector('form')).toBeNull()
  })
})
