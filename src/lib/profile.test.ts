import { describe, expect, it } from 'vitest'

import { routes, teamHref } from '@/content/nav'
import { ROUTE_SEO } from '@/content/seo'
import { TEAM } from '@/content/team'
import {
  LEAD_MAX_CHARS,
  biographyLead,
  initials,
  memberBySlug,
  profileNumeral,
  profilePrevNext,
  teamIndexItem,
  worksAlongside,
} from './profile'

const slugs = TEAM.map((m) => m.slug)
const first = TEAM[0]
const last = TEAM[TEAM.length - 1]
if (!first || !last) throw new Error('TEAM is empty')

describe('memberBySlug', () => {
  it('finds a member by slug and returns undefined for a stranger', () => {
    expect(memberBySlug('lowell-monkhouse')?.name).toBe('Lowell Monkhouse')
    expect(memberBySlug('nobody')).toBeUndefined()
  })
})

describe('worksAlongside', () => {
  it('returns the next three members in document order', () => {
    expect(worksAlongside('lowell-monkhouse').map((m) => m.slug)).toEqual(slugs.slice(1, 4))
  })

  it('wraps past the end of the team', () => {
    expect(worksAlongside('fernando-escobosa-garcia').map((m) => m.slug)).toEqual(slugs.slice(0, 3))
    expect(worksAlongside('nicolas-neduchal').map((m) => m.slug)).toEqual([
      'fernando-escobosa-garcia',
      'lowell-monkhouse',
      'nathaniel-bruce',
    ])
  })

  it('never includes the member themself and honours n', () => {
    for (const slug of slugs) {
      const others = worksAlongside(slug)
      expect(others).toHaveLength(3)
      expect(others.map((m) => m.slug)).not.toContain(slug)
    }
    expect(worksAlongside('iona-hames', 5)).toHaveLength(5)
    expect(worksAlongside('iona-hames', 0)).toEqual([])
  })

  it('sorts by the document order, not array position, and does not mutate the input', () => {
    const shuffled = [...TEAM].reverse()
    const before = shuffled.map((m) => m.slug)
    expect(worksAlongside('lowell-monkhouse', 3, shuffled).map((m) => m.slug)).toEqual(
      slugs.slice(1, 4)
    )
    expect(shuffled.map((m) => m.slug)).toEqual(before)
  })

  it('throws on an unknown slug rather than returning an arbitrary trio', () => {
    expect(() => worksAlongside('nobody')).toThrow(/nobody/)
  })
})

describe('profileNumeral', () => {
  it('is the two-digit document order', () => {
    expect(profileNumeral(first)).toBe('01')
    expect(profileNumeral(last)).toBe('11')
  })
})

describe('initials', () => {
  it('takes the first letter of the first two names', () => {
    expect(initials('Lowell Monkhouse')).toBe('LM')
    expect(initials('Caroline Adams')).toBe('CA')
  })

  it('drops an honorific prefix', () => {
    expect(initials('Dr. Elena Vasquez-Whitfield')).toBe('EV')
    expect(initials('Dr Elena Vasquez-Whitfield')).toBe('EV')
    expect(initials('Prof. Ada Lovelace')).toBe('AL')
  })

  it('keeps the first of a double surname and upper-cases accented letters', () => {
    expect(initials('Dr. Fernando Escobosa García')).toBe('FE')
    expect(initials('élodie durand')).toBe('ÉD')
  })

  it('copes with one name, extra spaces and an empty string', () => {
    expect(initials('Prince')).toBe('P')
    expect(initials('  Iona   Hames  ')).toBe('IH')
    expect(initials('')).toBe('')
    expect(initials('Dr.')).toBe('')
  })
})

describe('teamIndexItem', () => {
  it('is the collection page by its own name', () => {
    expect(teamIndexItem()).toEqual({ label: ROUTE_SEO.team.name, href: routes.team })
  })
})

describe('profilePrevNext', () => {
  it('links the neighbours in document order', () => {
    const { prev, next } = profilePrevNext('nathaniel-bruce')
    expect(prev).toEqual({ label: first.name, href: teamHref(first.slug) })
    expect(next).toEqual({
      label: 'Dr. Elena Vasquez-Whitfield',
      href: teamHref('elena-vasquez-whitfield'),
    })
  })

  it('wraps both ends to the team index', () => {
    expect(profilePrevNext(first.slug).prev).toEqual(teamIndexItem())
    expect(profilePrevNext(first.slug).next?.href).toBe(teamHref(slugs[1] ?? ''))
    expect(profilePrevNext(last.slug).next).toEqual(teamIndexItem())
    expect(profilePrevNext(last.slug).prev?.href).toBe(teamHref(slugs[slugs.length - 2] ?? ''))
  })

  it('throws on an unknown slug', () => {
    expect(() => profilePrevNext('nobody')).toThrow(/nobody/)
  })
})

describe('biographyLead', () => {
  const member = { ...first, paragraphs: ['A short opening line.', 'The rest.', 'And more.'] }

  it('lifts a short opening paragraph into the lead and leaves the rest', () => {
    expect(biographyLead(member)).toEqual({
      lead: 'A short opening line.',
      paragraphs: ['The rest.', 'And more.'],
    })
  })

  it('leaves a long opening paragraph in the body', () => {
    const long = 'x'.repeat(LEAD_MAX_CHARS + 1)
    expect(biographyLead({ ...member, paragraphs: [long, 'The rest.'] })).toEqual({
      lead: undefined,
      paragraphs: [long, 'The rest.'],
    })
  })

  it('lifts exactly at the threshold', () => {
    const edge = 'x'.repeat(LEAD_MAX_CHARS)
    expect(biographyLead({ ...member, paragraphs: [edge, 'y'] }).lead).toBe(edge)
  })

  it('never lifts the only paragraph', () => {
    expect(biographyLead({ ...member, paragraphs: ['Alone.'] })).toEqual({
      lead: undefined,
      paragraphs: ['Alone.'],
    })
  })

  it('does not mutate the member', () => {
    const paragraphs = [...member.paragraphs]
    biographyLead(member)
    expect(member.paragraphs).toEqual(paragraphs)
  })

  it('lifts none of the eleven biographies as the document stands', () => {
    // Every opening paragraph is a full introduction (169–336 characters); the
    // rule is here for the day the client supplies opening lines (CONTENT-GAPS C8).
    for (const m of TEAM) expect(biographyLead(m).lead).toBeUndefined()
  })
})
