import { describe, expect, it } from 'vitest'

import { NAV, routes } from '@/content/nav'
import { prevNextFor, readingOrder } from './prevNext'

describe('readingOrder', () => {
  it('opens with home and keeps the primary navigation in order', () => {
    const order = readingOrder()
    expect(order[0]?.href).toBe(routes.home)
    const primaryHrefs = NAV.primary.map((item) => item.href)
    const kept = order.filter((item) => primaryHrefs.includes(item.href)).map((i) => i.href)
    expect(kept).toEqual(primaryHrefs)
  })

  it('weaves the Practice group in: About → Our Process → A Personal Message → Fees', () => {
    const hrefs = readingOrder().map((item) => item.href)
    const from = hrefs.indexOf(routes.about)
    expect(hrefs.slice(from, from + 5)).toEqual([
      routes.about,
      routes.process,
      routes.personalMessage,
      routes.fees,
      routes.clinicalServices,
    ])
  })

  it('leaves the contact and legal groups out', () => {
    const hrefs = readingOrder().map((item) => item.href)
    expect(hrefs).not.toContain(routes.contact)
    expect(hrefs).not.toContain(routes.privacy)
    expect(hrefs).not.toContain(routes.terms)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})

describe('prevNextFor', () => {
  it('places About between home and Our Process', () => {
    const { prev, next } = prevNextFor(routes.about)
    expect(prev?.href).toBe(routes.home)
    expect(next?.href).toBe(routes.process)
    expect(next?.label).toBe('Our Process')
  })

  it('gives the letter and the fees page a rail', () => {
    const letter = prevNextFor(routes.personalMessage)
    expect(letter.prev?.href).toBe(routes.process)
    expect(letter.next?.href).toBe(routes.fees)
    const fees = prevNextFor(routes.fees)
    expect(fees.prev?.href).toBe(routes.personalMessage)
    expect(fees.next?.href).toBe(routes.clinicalServices)
  })

  it('has no previous page for home', () => {
    const result = prevNextFor(routes.home)
    expect(result.prev).toBeUndefined()
    expect(result.next?.href).toBe(routes.about)
    expect('prev' in result).toBe(false)
  })

  it('has no next page for the last primary route', () => {
    const last = NAV.primary.at(-1)
    if (!last) throw new Error('nav.ts has no primary items')
    const result = prevNextFor(last.href)
    expect(result.next).toBeUndefined()
    expect(result.prev?.href).toBe(NAV.primary.at(-2)?.href)
  })

  it('returns nothing for a route outside the reading order', () => {
    expect(prevNextFor(routes.privacy)).toEqual({})
    expect(prevNextFor(routes.contact)).toEqual({})
    expect(prevNextFor('/nowhere')).toEqual({})
  })

  it('accepts an explicit order', () => {
    const order = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
    ]
    expect(prevNextFor('/b', order)).toEqual({ prev: order[0] })
  })
})
