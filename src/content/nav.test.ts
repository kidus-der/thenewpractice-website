import { describe, expect, it } from 'vitest'

import { isActiveRoute, routes } from './nav'

describe('isActiveRoute', () => {
  it('marks a section route current on its own children', () => {
    expect(isActiveRoute(routes.team, `${routes.team}/lowell-monkhouse`)).toBe(true)
    expect(isActiveRoute(routes.team, routes.team)).toBe(true)
  })

  it('marks home current only on home itself', () => {
    expect(isActiveRoute(routes.home, routes.about)).toBe(false)
    expect(isActiveRoute(routes.home, routes.home)).toBe(true)
  })

  it('does not match a route that merely shares a prefix', () => {
    expect(isActiveRoute(routes.team, '/teamwork')).toBe(false)
  })
})
