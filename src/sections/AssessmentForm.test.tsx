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

const [assessment] = ASSESSMENTS
const consultation = ASSESSMENTS_PAGE.sections.find((s) => s.id === 'a-confidential-consultation')
const [enquire] = NAV.utility
if (!assessment || !consultation || !enquire) throw new Error('content missing for the test')

const N = QUESTIONS_PER_ASSESSMENT
const moderate = assessment.scoring.bands.find((b) => b.key === 'moderate')
if (!moderate) throw new Error('no moderate band')

const setup = () => {
  const user = userEvent.setup()
  render(<AssessmentForm assessment={assessment} consultation={consultation} enquire={enquire} />)
  return user
}

const rows = () => screen.getAllByRole('group')
/** By selector and a plain click: fifteen role queries and pointer sequences per sheet are slow in jsdom. */
const answer = async (_user: ReturnType<typeof userEvent.setup>, index: number, yes: boolean) => {
  const row = document.querySelectorAll('fieldset')[index]
  const radio = row?.querySelector<HTMLInputElement>(`input[value="${yes ? 'yes' : 'no'}"]`)
  if (!radio) throw new Error(`no ${yes ? 'yes' : 'no'} radio in row ${index}`)
  fireEvent.click(radio)
}

const answerAll = async (user: ReturnType<typeof userEvent.setup>, yeses: number) => {
  for (let i = 0; i < N; i += 1) await answer(user, i, i < yeses)
}

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

describe('AssessmentForm', () => {
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

  it('renders every question as a radio group named by its question', () => {
    setup()
    const groups = rows()
    expect(groups).toHaveLength(N)
    assessment.questions.forEach((question, i) => {
      expect(groups[i]).toHaveAccessibleName(question)
      expect(within(groups[i]!).getAllByRole('radio')).toHaveLength(2)
    })
  })

  it('shows no tally until the first answer, then counts up', async () => {
    const user = setup()
    const tally = screen.getByTestId('assessment-tally')
    expect(tally).toHaveAttribute('aria-live', 'polite')
    expect(tally).toHaveTextContent('')
    await answer(user, 0, true)
    expect(tally).toHaveTextContent(progressLabel(1, N))
    await answer(user, 0, false)
    expect(tally).toHaveTextContent(progressLabel(1, N))
    await answer(user, 4, true)
    expect(tally).toHaveTextContent(progressLabel(2, N))
  })

  it('keeps the result action disabled and inert until every question is answered', async () => {
    const user = setup()
    const button = screen.getByRole('button', { name: UI_ASSESSMENT.seeResult })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await user.click(button)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await answerAll(user, 6)
    expect(button).not.toHaveAttribute('aria-disabled')
  })

  it('reveals the band, the interpretation and the consultation for six yeses', async () => {
    const user = setup()
    await answerAll(user, 6)
    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))

    const result = screen.getByRole('status')
    expect(result).toHaveFocus()
    expect(within(result).getByRole('heading', { level: 2 })).toHaveTextContent(moderate.label)
    expect(result).toHaveTextContent(scoreLabel(6, N))
    expect(result).toHaveTextContent(assessment.interpretation)
    expect(within(result).getByRole('heading', { level: 3 })).toHaveTextContent(
      consultation.title ?? ''
    )
    for (const paragraph of consultation.paragraphs) expect(result).toHaveTextContent(paragraph)
    expect(within(result).getByRole('link', { name: enquire.label })).toHaveAttribute(
      'href',
      enquire.href
    )
    expect(screen.queryByRole('button', { name: UI_ASSESSMENT.seeResult })).not.toBeInTheDocument()
  })

  it('withdraws the result when an answer changes, and clears everything on start again', async () => {
    const user = setup()
    await answerAll(user, 6)
    await user.click(screen.getByRole('button', { name: UI_ASSESSMENT.seeResult }))
    await answer(user, 0, false)
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
    await answerAll(user, 6)
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
