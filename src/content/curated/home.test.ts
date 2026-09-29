import { describe, expect, it } from 'vitest'

import { homeSections } from '@/lib/home'
import { HOME } from '../pages/home'
import { HOME_CURATION, HOME_CURATED } from './home'

const curated = homeSections(HOME_CURATED)
const source = homeSections(HOME)

describe('the home curation', () => {
  it('resolves every reference and adds no string of ours', () => {
    expect(HOME_CURATION.problems).toEqual([])
    expect(HOME_CURATION.ours).toEqual([])
  })

  it('keeps the hero, the contact block and all five sections in page order', () => {
    expect(HOME_CURATED.hero).toBe(HOME.hero)
    expect(HOME_CURATED.contact).toBe(HOME.contact)
    expect(HOME_CURATED.sections.map((s) => s.id)).toEqual(HOME.sections.map((s) => s.id))
  })

  it('keeps the triad and one sentence of the statement', () => {
    expect(curated.statement.subtitle).toBe(source.statement.subtitle)
    expect(curated.statement.paragraphs).toEqual([
      'The New Practice is a private behavioural health practice based in Puerto Aventuras, in Mexico’s Riviera Maya.',
    ])
  })

  it('keeps one paragraph of the long read, ending on the pull line', () => {
    expect(curated.longRead.paragraphs).toHaveLength(1)
    expect(curated.longRead.paragraphs[0]).toMatch(/^A dedicated live-in clinician/)
    expect(curated.longRead.paragraphs[0]).toMatch(
      /Recovery succeeds when trust is never interrupted\.$/
    )
  })

  it('keeps all twelve conditions and their sentence', () => {
    expect(curated.conditions.list).toEqual(source.conditions.list)
    expect(curated.conditions.listHeading).toBe(source.conditions.listHeading)
  })

  it('keeps the five pillars and the first paragraph of the manifesto', () => {
    const terms = (s: typeof curated.philosophy) => s.definitions?.map((d) => d.term)
    expect(terms(curated.philosophy)).toEqual(terms(source.philosophy))
    expect(curated.philosophy.definitions?.[2]?.description).toBe(
      'The therapeutic relationship extends far beyond your stay in the Mayan jungle.'
    )
    expect(curated.manifesto.paragraphs).toEqual(source.manifesto.paragraphs.slice(0, 1))
  })

  it('keeps the three lines of the conversation', () => {
    expect(curated.conversation.paragraphs).toEqual(source.conversation.paragraphs)
  })
})
