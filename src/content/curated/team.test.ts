import { describe, expect, it } from 'vitest'

import { sentences } from '../sentences'
import { TEAM, TEAM_PAGE } from '../team'
import { TEAM_CURATED, TEAM_CURATION, TEAM_PAGE_CURATED, TEAM_PAGE_CURATION } from './team'

/** Every sentence the client wrote anywhere in a member's biography. */
const clientSentences = (paragraphs: readonly string[]): ReadonlySet<string> =>
  new Set(paragraphs.flatMap((p) => sentences(p)))

const words = (text: string): number => text.split(/\s+/).length

describe('the team index curation', () => {
  it('resolves every reference and adds no string of ours', () => {
    expect(TEAM_PAGE_CURATION.problems).toEqual([])
    expect(TEAM_PAGE_CURATION.ours).toEqual([])
  })

  it('keeps the title and lifts the opening’s first sentence to the lead', () => {
    expect(TEAM_PAGE_CURATED.title).toBe(TEAM_PAGE.title)
    expect(TEAM_PAGE_CURATED.lead).toBe(
      'The quality of any treatment program is ultimately determined by the quality of the people delivering it.'
    )
  })

  it('renders only the multidisciplinary roles, all twenty, under the client’s colon line', () => {
    expect(TEAM_PAGE_CURATED.sections.map((s) => s.id)).toEqual(['a-multidisciplinary-team'])
    const [roles] = TEAM_PAGE_CURATED.sections
    const source = TEAM_PAGE.sections
      .flatMap((s) => s.subsections ?? [])
      .find((s) => s.id === 'a-multidisciplinary-team')
    expect(roles?.title).toBe(source?.title)
    expect(roles?.list).toEqual(source?.list)
    expect(roles?.list).toHaveLength(20)
    expect(roles?.listHeading).toBe(source?.listHeading)
    expect(roles?.paragraphs).toEqual([
      'Every discipline contributes its expertise while remaining focused on the same treatment goals.',
    ])
    expect(roles?.outro).toBeUndefined()
  })
})

describe('the team biographies curation', () => {
  it('resolves every reference; the one string of ours restates Lowell’s graduate school', () => {
    expect(TEAM_CURATION.problems).toEqual([])
    expect(TEAM_CURATION.ours.map((o) => o.text)).toEqual([
      'Lowell is a graduate of the Hazelden Betty Ford Graduate School of Addiction Studies.',
    ])
  })

  it('keeps all eleven members in order with their names, roles and credentials', () => {
    expect(TEAM_CURATED).toHaveLength(11)
    TEAM_CURATED.forEach((member, i) => {
      const source = TEAM[i]
      expect(member.slug).toBe(source?.slug)
      expect(member.name).toBe(source?.name)
      expect(member.role).toBe(source?.role)
      expect(member.credentials).toBe(source?.credentials)
    })
  })

  it('curates every member to one or two short paragraphs', () => {
    for (const member of TEAM_CURATED) {
      const { paragraphs } = member
      expect(paragraphs.length, member.slug).toBeGreaterThanOrEqual(1)
      expect(paragraphs.length, member.slug).toBeLessThanOrEqual(2)
      const total = words(paragraphs.join(' '))
      expect(total, member.slug).toBeLessThanOrEqual(120)
    }
  })

  it('renders only the client’s own sentences, apart from the one of ours', () => {
    const ours = new Set(TEAM_CURATION.ours.map((o) => o.text))
    TEAM_CURATED.forEach((member, i) => {
      const client = clientSentences(TEAM[i]?.paragraphs ?? [])
      const rendered = member.paragraphs.flatMap((p) => sentences(p))
      const foreign = rendered.filter((s) => !client.has(s) && !ours.has(s))
      expect(foreign, member.slug).toEqual([])
    })
  })

  it('keeps the trademark and the en dash sentences out of the biographies', () => {
    const all = TEAM_CURATED.flatMap((m) => m.paragraphs).join(' ')
    expect(all).not.toMatch(/[™–—]/)
  })

  it('leaves the psychiatrist’s two paragraphs as the client wrote them', () => {
    const elena = TEAM.find((m) => m.slug === 'elena-vasquez-whitfield')
    const curated = TEAM_CURATED.find((m) => m.slug === 'elena-vasquez-whitfield')
    expect(curated?.paragraphs).toEqual(elena?.paragraphs)
  })
})
