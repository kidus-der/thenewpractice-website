import { describe, expect, it } from 'vitest'

import { ABOUT } from '@/content/pages/about'
import { pageSchema, type Section } from '@/content/schemas'
import {
  STICKY_INDEX_MIN_SECTIONS,
  assertSectionIds,
  hasStickyIndex,
  numeral,
  plateRatio,
  sectionsToIndex,
} from './interior'

const section = (id: string, title?: string): Section => ({ id, title, paragraphs: [] })

describe('numeral', () => {
  it('pads to two digits', () => {
    expect(numeral(0)).toBe('00')
    expect(numeral(7)).toBe('07')
    expect(numeral(12)).toBe('12')
  })
})

describe('sectionsToIndex', () => {
  it('lists titled sections with their position numeral', () => {
    const items = sectionsToIndex([section('a', 'A'), section('b', 'B')])
    expect(items).toEqual([
      { id: 'a', title: 'A', numeral: '01' },
      { id: 'b', title: 'B', numeral: '02' },
    ])
  })

  it('skips untitled sections without renumbering the rest', () => {
    const items = sectionsToIndex([section('a', 'A'), section('b'), section('c', 'C')])
    expect(items.map((i) => i.numeral)).toEqual(['01', '03'])
  })

  it('indexes every About section in document order', () => {
    expect(sectionsToIndex(ABOUT.sections).map((i) => i.id)).toEqual(
      ABOUT.sections.map((s) => s.id)
    )
  })
})

describe('hasStickyIndex', () => {
  it('needs at least five sections', () => {
    const four = Array.from({ length: STICKY_INDEX_MIN_SECTIONS - 1 }, (_, i) => section(`s${i}`))
    expect(hasStickyIndex(four)).toBe(false)
    expect(hasStickyIndex([...four, section('last')])).toBe(true)
    expect(hasStickyIndex(ABOUT.sections)).toBe(true)
  })
})

describe('plateRatio', () => {
  it('maps the manifest frames onto the standing ratios', () => {
    expect(plateRatio(2400, 1350)).toBe('16:9')
    expect(plateRatio(1040, 1387)).toBe('3:4')
    expect(plateRatio(2100, 900)).toBe('21:9')
  })

  it('rejects an empty frame', () => {
    expect(() => plateRatio(0, 100)).toThrow(/invalid frame/)
  })
})

describe('assertSectionIds', () => {
  const page = pageSchema.parse({
    slug: 'p',
    title: 'P',
    sections: [{ id: 'top', paragraphs: [], subsections: [{ id: 'nested', paragraphs: [] }] }],
  })

  it('accepts top-level and nested ids', () => {
    expect(() => assertSectionIds(page, ['top', 'nested'])).not.toThrow()
  })

  it('names every missing id', () => {
    expect(() => assertSectionIds(page, ['top', 'gone', 'also-gone'])).toThrow(
      'pages/p: no section with id gone, also-gone'
    )
  })
})
