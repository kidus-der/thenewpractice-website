import { describe, expect, it } from 'vitest'
import { HOME } from '@/content/pages/home'
import { HOME_SECTION_IDS, MANIFESTO_ID, homeSections, splitPullLine, triadLines } from './home'

describe('homeSections', () => {
  it('resolves the five sections and the manifesto from the content module', () => {
    const sections = homeSections(HOME)
    expect(sections.statement.id).toBe(HOME_SECTION_IDS.statement)
    expect(sections.longRead.id).toBe(HOME_SECTION_IDS.longRead)
    expect(sections.conditions.id).toBe(HOME_SECTION_IDS.conditions)
    expect(sections.philosophy.id).toBe(HOME_SECTION_IDS.philosophy)
    expect(sections.manifesto.id).toBe(MANIFESTO_ID)
    expect(sections.conversation.id).toBe(HOME_SECTION_IDS.conversation)
  })

  it('carries the content the template composes against', () => {
    const { statement, conditions, philosophy, manifesto } = homeSections(HOME)
    expect(statement.subtitle).toBe('One Client. One Team. One Purpose.')
    expect(statement.paragraphs).toHaveLength(4)
    expect(conditions.list).toHaveLength(12)
    expect(philosophy.definitions).toHaveLength(5)
    expect(manifesto.paragraphs).toHaveLength(5)
  })

  it('throws when a section id is missing', () => {
    const broken = { ...HOME, sections: HOME.sections.filter((s) => s.id !== 'who-we-help') }
    expect(() => homeSections(broken)).toThrow(/who-we-help/)
  })

  it('throws when the manifesto subsection is missing', () => {
    const broken = {
      ...HOME,
      sections: HOME.sections.map((s) =>
        s.id === HOME_SECTION_IDS.philosophy ? { ...s, subsections: [] } : s
      ),
    }
    expect(() => homeSections(broken)).toThrow(/why-the-new-practice/)
  })
})

describe('triadLines', () => {
  it('splits the triad into three sentences in the client casing', () => {
    expect(triadLines('One Client. One Team. One Purpose.')).toEqual([
      'One Client.',
      'One Team.',
      'One Purpose.',
    ])
  })

  it('returns a single-sentence subtitle as one line', () => {
    expect(triadLines('Private treatment without compromise.')).toEqual([
      'Private treatment without compromise.',
    ])
  })

  it('ignores surrounding and doubled whitespace', () => {
    expect(triadLines('  One.   Two.  ')).toEqual(['One.', 'Two.'])
  })
})

describe('splitPullLine', () => {
  it('separates the final sentence as the pull line', () => {
    const paragraph = 'First sentence here. Second one follows. Trust is never interrupted.'
    expect(splitPullLine(paragraph)).toEqual({
      body: 'First sentence here. Second one follows.',
      pull: 'Trust is never interrupted.',
    })
  })

  it('returns no pull line for a one-sentence paragraph', () => {
    expect(splitPullLine('Only one sentence.')).toEqual({
      body: 'Only one sentence.',
      pull: null,
    })
  })

  it('handles the real closing paragraph of the long read', () => {
    const { longRead } = homeSections(HOME)
    const last = longRead.paragraphs.at(-1) ?? ''
    const { body, pull } = splitPullLine(last)
    expect(pull).toBe('Recovery succeeds when trust is never interrupted.')
    expect(`${body} ${pull}`).toBe(last)
  })
})
