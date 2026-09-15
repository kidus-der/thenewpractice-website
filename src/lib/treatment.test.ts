import { describe, expect, it } from 'vitest'

import { NAV, routes, serviceHref } from '@/content/nav'
import { serviceSchema, type Service } from '@/content/schemas'
import { SERVICES } from '@/content/services'
import {
  RELATED_COUNT,
  relatedServices,
  serviceBlocks,
  serviceBySlug,
  serviceNumeral,
  servicePrevNext,
} from './treatment'

const bySlug = (slug: string): Service => {
  const service = SERVICES.find((s) => s.slug === slug)
  if (!service) throw new Error(`services.ts has no ${slug}`)
  return service
}

const ordered = [...SERVICES].sort((a, b) => a.order - b.order)
const first = ordered[0]
const last = ordered.at(-1)
if (!first || !last) throw new Error('services.ts is empty')

const listing = NAV.primary.find((item) => item.href === routes.clinicalServices)

describe('serviceNumeral', () => {
  it('is the document order as a two-digit numeral', () => {
    expect(serviceNumeral(bySlug('addiction-treatment'))).toBe('01')
    expect(serviceNumeral(bySlug('family-program'))).toBe('11')
  })
})

describe('serviceBySlug', () => {
  it('finds a service by its slug and nothing for an unknown one', () => {
    expect(serviceBySlug('inner-child-work')?.title).toBe('Inner Child Work')
    expect(serviceBySlug('nowhere')).toBeUndefined()
  })
})

describe('relatedServices', () => {
  it('is the next three services in order', () => {
    expect(relatedServices('addiction-treatment').map((s) => s.order)).toEqual([2, 3, 4])
  })

  it('wraps past the last service back to the first', () => {
    expect(relatedServices('interventions-and-crisis-response').map((s) => s.order)).toEqual([
      11, 1, 2,
    ])
    expect(relatedServices(last.slug).map((s) => s.order)).toEqual([1, 2, 3])
  })

  it('never includes the service itself and never exceeds the collection', () => {
    for (const service of SERVICES) {
      const related = relatedServices(service.slug)
      expect(related).toHaveLength(RELATED_COUNT)
      expect(related.map((s) => s.slug)).not.toContain(service.slug)
    }
    const two = [first, last]
    expect(relatedServices(first.slug, 3, two).map((s) => s.slug)).toEqual([last.slug])
  })

  it('is empty for an unknown slug', () => {
    expect(relatedServices('nowhere')).toEqual([])
  })
})

describe('servicePrevNext', () => {
  it('names the neighbours in order', () => {
    const { prev, next } = servicePrevNext('mental-health')
    expect(prev).toEqual({
      label: 'Trauma & Complex Trauma',
      href: serviceHref('trauma-and-complex-trauma'),
    })
    expect(next).toEqual({ label: 'Eating Disorders', href: serviceHref('eating-disorders') })
  })

  it('wraps the first service back to the listing and the last one forward to it', () => {
    if (!listing) throw new Error('nav.ts has no primary item for the listing')
    expect(servicePrevNext(first.slug).prev).toEqual(listing)
    expect(servicePrevNext(first.slug).next?.href).toBe(serviceHref(ordered[1]?.slug ?? ''))
    expect(servicePrevNext(last.slug).next).toEqual(listing)
    expect(servicePrevNext(last.slug).prev?.href).toBe(serviceHref(ordered.at(-2)?.slug ?? ''))
  })

  it('has no neighbours for an unknown slug', () => {
    expect(servicePrevNext('nowhere')).toEqual({})
  })
})

describe('serviceBlocks', () => {
  it('puts the may-include index before the treats list when a service has both', () => {
    const kinds = serviceBlocks(bySlug('addiction-treatment')).map((b) => b.kind)
    expect(kinds).toEqual(['intro', 'mayInclude', 'treats', 'outro', 'related'])
  })

  it('follows the document: intro remainder, lists, outro, definitions, subsections, related', () => {
    const trauma = serviceBlocks(bySlug('trauma-and-complex-trauma'))
    // one intro paragraph: it is the lead, so no intro block remains
    expect(trauma.map((b) => b.kind)).toEqual(['treats', 'outro', 'definitions', 'related'])
    const definitions = trauma.find((b) => b.kind === 'definitions')
    expect(definitions?.kind === 'definitions' && definitions.section.definitions).toHaveLength(8)

    const innerChild = serviceBlocks(bySlug('inner-child-work'))
    expect(innerChild.map((b) => b.kind)).toEqual(['intro', 'subsection', 'subsection', 'related'])
    expect(innerChild.map((b) => b.id)).toEqual([
      'inner-child-work-intro',
      'how-it-works',
      'the-benefits',
      'inner-child-work-related',
    ])
  })

  it('carries the list items and headings verbatim', () => {
    const service = bySlug('family-program')
    const treats = serviceBlocks(service).find((b) => b.kind === 'treats')
    if (treats?.kind !== 'treats') throw new Error('no treats block')
    expect(treats.items).toEqual(service.treats)
    expect(treats.heading).toBe(service.treatsHeading)
    expect(treats.id).toBe('family-program-treats')
  })

  it('numbers the blocks from 01 and never lets two sand blocks adjoin', () => {
    for (const service of SERVICES) {
      const blocks = serviceBlocks(service)
      expect(blocks.map((b) => b.numeral)).toEqual(
        blocks.map((_, i) => String(i + 1).padStart(2, '0'))
      )
      blocks.forEach((block, i) => {
        if (block.ground === 'mid') expect(blocks[i - 1]?.ground).not.toBe('mid')
      })
    }
  })

  it('sets lists and the related rows on sand, prose on bone', () => {
    const blocks = serviceBlocks(bySlug('family-program'))
    expect(blocks.map((b) => [b.kind, b.ground])).toEqual([
      ['intro', 'light'],
      ['treats', 'mid'],
      ['outro', 'light'],
      ['related', 'mid'],
    ])
    // treats then related with nothing between: the later one yields
    const mental = serviceBlocks(bySlug('mental-health'))
    expect(mental.map((b) => [b.kind, b.ground])).toEqual([
      ['intro', 'light'],
      ['treats', 'mid'],
      ['related', 'light'],
    ])
  })

  it('ends every service on its related rows, three links in wrap-around order', () => {
    for (const service of SERVICES) {
      const related = serviceBlocks(service).at(-1)
      if (related?.kind !== 'related') throw new Error(`${service.slug} does not end on related`)
      expect(related.rows.map((r) => r.href)).toEqual(
        relatedServices(service.slug).map((s) => serviceHref(s.slug))
      )
    }
  })

  it('keeps a top-level definitions list and applies the list-heading fallbacks upstream', () => {
    const service = serviceSchema.parse({
      slug: 'x',
      order: 1,
      title: 'X',
      intro: ['Lead.', 'Second.'],
      treats: ['A'],
      definitions: [{ term: 'T', description: 'D' }],
    })
    const blocks = serviceBlocks(service, [service])
    expect(blocks.map((b) => b.kind)).toEqual(['intro', 'treats', 'definitions'])
    const treats = blocks[1]
    expect(treats?.kind === 'treats' && treats.heading).toBeUndefined()
    const definitions = blocks[2]
    expect(definitions?.kind === 'definitions' && definitions.section.id).toBe('x-definitions')
  })
})
