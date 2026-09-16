import { describe, expect, it } from 'vitest'

import { NAV, NOINDEX_ROUTES, routes } from '@/content/nav'
import { isPlaceholderRoute, liveNav } from './placeholderRoutes'

const hrefs = (items: readonly { href: string }[]): readonly string[] => items.map((i) => i.href)

describe('isPlaceholderRoute', () => {
  it('names residences, privacy and terms as placeholders on production', () => {
    expect(isPlaceholderRoute(routes.residences, 'production')).toBe(true)
    expect(isPlaceholderRoute(routes.privacy, 'production')).toBe(true)
    expect(isPlaceholderRoute(routes.terms, 'production')).toBe(true)
  })

  it('leaves every finished route alone on production', () => {
    for (const path of Object.values(routes).filter((p) => !NOINDEX_ROUTES.has(p))) {
      expect(isPlaceholderRoute(path, 'production')).toBe(false)
    }
  })

  it('gates nothing on staging or in development, so the client can review the templates', () => {
    expect(isPlaceholderRoute(routes.residences, 'staging')).toBe(false)
    expect(isPlaceholderRoute(routes.privacy, 'development')).toBe(false)
  })

  it('reads the live environment by default (development under test)', () => {
    expect(isPlaceholderRoute(routes.residences)).toBe(false)
  })
})

describe('liveNav', () => {
  it('returns the navigation unchanged off production', () => {
    expect(liveNav('staging')).toEqual(NAV)
    expect(liveNav('development')).toEqual(NAV)
    expect(liveNav()).toEqual(NAV)
  })

  it('drops residences from the primary navigation on production and keeps the order', () => {
    const production = liveNav('production')
    expect(hrefs(production.primary)).toEqual(
      hrefs(NAV.primary).filter((href) => href !== routes.residences)
    )
    expect(production.utility).toEqual(NAV.utility)
  })

  it('drops residences from the footer Care group and the whole Legal group on production', () => {
    const production = liveNav('production')
    const care = production.footer.find((g) => g.heading === 'Care')
    expect(care).toBeDefined()
    expect(hrefs(care?.items ?? [])).not.toContain(routes.residences)
    expect(production.footer.map((g) => g.heading)).toEqual(['Practice', 'Care', 'Contact'])
    const all = production.footer.flatMap((g) => hrefs(g.items))
    expect(all).not.toContain(routes.privacy)
    expect(all).not.toContain(routes.terms)
  })

  it('never mutates NAV', () => {
    const before = JSON.stringify(NAV)
    liveNav('production')
    expect(JSON.stringify(NAV)).toBe(before)
  })
})
