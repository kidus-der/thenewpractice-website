import { describe, expect, it } from 'vitest'

import { ASSESSMENTS, ASSESSMENTS_PAGE } from '@/content/assessments'
import { assessmentHref, serviceHref, teamHref } from '@/content/nav'
import { pageSchema, type Section } from '@/content/schemas'
import { SERVICES } from '@/content/services'
import { TEAM, TEAM_PAGE } from '@/content/team'
import {
  appendParagraphs,
  hasRowImages,
  liftHeader,
  liftLead,
  rowsFromAssessments,
  rowsFromServices,
  rowsFromTeam,
} from './indexPage'

const section = (id: string, paragraphs: readonly string[], title?: string): Section => ({
  id,
  title,
  paragraphs: [...paragraphs],
})

describe('rowsFromServices', () => {
  const rows = rowsFromServices(SERVICES)

  it('makes one linked row per service, in document order, with no image', () => {
    expect(rows).toHaveLength(11)
    expect(rows.map((r) => r.title)).toEqual(SERVICES.map((s) => s.title))
    expect(rows[0]).toEqual({
      href: serviceHref('addiction-treatment'),
      title: 'Addiction Treatment',
    })
    for (const row of rows) expect(row.media).toBeUndefined()
  })

  it('sorts by the document order, not array position', () => {
    const shuffled = [...SERVICES].reverse()
    expect(rowsFromServices(shuffled).map((r) => r.title)).toEqual(rows.map((r) => r.title))
  })
})

describe('rowsFromTeam', () => {
  const rows = rowsFromTeam(TEAM)

  it('makes one linked row per member with the name as title and the role beneath', () => {
    expect(rows).toHaveLength(11)
    expect(rows[0]).toEqual({
      href: teamHref('lowell-monkhouse'),
      title: 'Lowell Monkhouse',
      meta: 'Founder and Clinical Director',
    })
    expect(rows.map((r) => r.title)).toEqual(TEAM.map((m) => m.name))
  })

  it('carries no portrait until portraits arrive', () => {
    for (const row of rows) expect(row.media).toBeUndefined()
    expect(hasRowImages(rows)).toBe(false)
  })
})

describe('rowsFromAssessments', () => {
  const rows = rowsFromAssessments(ASSESSMENTS, 'Fifteen questions')

  it('makes one linked row per questionnaire with the shared length line', () => {
    expect(rows).toHaveLength(10)
    expect(rows[0]).toEqual({
      href: assessmentHref('alcohol'),
      title: 'Alcohol Addiction Self-Assessment',
      meta: 'Fifteen questions',
    })
  })

  it('matches the titles the document lists under Available Self-Assessments', () => {
    const listed = ASSESSMENTS_PAGE.sections.find((s) => s.id === 'available-self-assessments')
    expect(rows.map((r) => r.title)).toEqual(listed?.list)
  })
})

describe('hasRowImages', () => {
  it('is true when any row carries a media key', () => {
    expect(hasRowImages([{ href: '/a', title: 'A' }])).toBe(false)
    expect(
      hasRowImages([
        { href: '/a', title: 'A' },
        { href: '/b', title: 'B', media: 'index-01' },
      ])
    ).toBe(true)
    expect(hasRowImages([])).toBe(false)
  })
})

describe('liftLead', () => {
  const page = pageSchema.parse({
    slug: 'p',
    title: 'P',
    sections: [section('intro', ['First.', 'Second.']), section('body', ['Body.'], 'Body')],
  })

  it('moves the first paragraph of the named section into the page lead', () => {
    const lifted = liftLead(page, 'intro')
    expect(lifted.lead).toBe('First.')
    expect(lifted.sections[0]?.paragraphs).toEqual(['Second.'])
    expect(lifted.sections[1]).toEqual(page.sections[1])
  })

  it('drops the section when nothing is left of it', () => {
    const single = { ...page, sections: [section('intro', ['Only.']), ...page.sections.slice(1)] }
    const lifted = liftLead(single, 'intro')
    expect(lifted.lead).toBe('Only.')
    expect(lifted.sections.map((s) => s.id)).toEqual(['body'])
  })

  it('does not mutate the page it is given', () => {
    const before = JSON.stringify(page)
    liftLead(page, 'intro')
    expect(JSON.stringify(page)).toBe(before)
  })

  it('returns the page unchanged when the section has no paragraph or does not exist', () => {
    expect(liftLead(page, 'missing')).toBe(page)
    const empty = { ...page, sections: [section('intro', [])] }
    expect(liftLead(empty, 'intro')).toBe(empty)
  })

  it('lifts the Team page opening line', () => {
    const lifted = liftLead(TEAM_PAGE, 'intro')
    expect(lifted.lead).toBe(TEAM_PAGE.sections[0]?.paragraphs[0])
    expect(lifted.sections).toHaveLength(TEAM_PAGE.sections.length)
  })
})

describe('liftHeader', () => {
  it('sets the first paragraph as the serif header line and keeps the rest as prose', () => {
    const lifted = liftHeader(section('d', ['Opening.', 'Then this.'], 'D'))
    expect(lifted.header).toBe('Opening.')
    expect(lifted.paragraphs).toEqual(['Then this.'])
    expect(lifted.title).toBe('D')
  })

  it('leaves a section with no paragraphs alone', () => {
    const empty = section('d', [])
    expect(liftHeader(empty)).toBe(empty)
  })
})

describe('appendParagraphs', () => {
  it('returns a new section with the extra lines after the document ones', () => {
    const base = section('h', ['One.'])
    const out = appendParagraphs(base, ['Two.', 'Three.'])
    expect(out.paragraphs).toEqual(['One.', 'Two.', 'Three.'])
    expect(base.paragraphs).toEqual(['One.'])
  })
})
