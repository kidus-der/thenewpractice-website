import { describe, expect, it } from 'vitest'

import { NAV, routes } from '@/content/nav'
import { prevNextFor, readingOrder } from './prevNext'

describe('readingOrder', () => {
  it('is home followed by the primary navigation', () => {
    const order = readingOrder()
    expect(order[0]?.href).toBe(routes.home)
    expect(order.slice(1)).toEqual(NAV.primary)
  })
})

describe('prevNextFor', () => {
  it('places About between home and Our Process', () => {
    const { prev, next } = prevNextFor(routes.about)
    expect(prev?.href).toBe(routes.home)
    expect(next?.href).toBe(routes.process)
    expect(next?.label).toBe('Our Process')
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
