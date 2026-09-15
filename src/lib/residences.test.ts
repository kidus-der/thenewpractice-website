import { describe, expect, it } from 'vitest'

import { MEDIA } from '@/content/media'
import { ABOUT } from '@/content/pages/about'
import { RESIDENCES } from '@/content/pages/residences'
import type { Page } from '@/content/schemas'
import {
  DISCRETION_SECTION,
  DISCRETION_WORD,
  discretionStatement,
  plateCounter,
  residencePlates,
} from './residences'

const page = (paragraphs: readonly string[], id = DISCRETION_SECTION): Page => ({
  slug: 'about',
  title: 'About',
  sections: [{ id, paragraphs: [...paragraphs] }],
})

describe('discretionStatement', () => {
  it('returns the client’s own sentence about discretion from the About page', () => {
    const line = discretionStatement()
    expect(line).toBeDefined()
    expect(line).toMatch(DISCRETION_WORD)
    // The section is a subsection of Puerto Aventuras; the helper must reach it there.
    const section = ABOUT.sections
      .flatMap((s) => [s, ...(s.subsections ?? [])])
      .find((s) => s.id === DISCRETION_SECTION)
    expect(section?.paragraphs).toContain(line)
  })

  it('picks the first paragraph that names discretion, whatever its position', () => {
    const line = discretionStatement(
      page(['Nothing here.', 'We value discretion.', 'discretion twice'])
    )
    expect(line).toBe('We value discretion.')
  })

  it('returns undefined rather than inventing a line when the section or the sentence is gone', () => {
    expect(discretionStatement(page(['Nothing here.']))).toBeUndefined()
    expect(discretionStatement(page(['We value discretion.'], 'renamed'))).toBeUndefined()
  })
})

describe('plateCounter', () => {
  it('reads `01 / 06` for the first of six plates', () => {
    expect(plateCounter('01', 6)).toBe('01 / 06')
    expect(plateCounter('12', 12)).toBe('12 / 12')
  })
})

describe('residencePlates', () => {
  const keys = [
    'residence-01',
    'residence-02',
    'residence-03',
    'residence-04',
    'residence-05',
    'residence-06',
  ] as const

  it('pairs the page’s plates with the media keys in order', () => {
    const plates = residencePlates(RESIDENCES.plates, keys)
    expect(plates).toHaveLength(6)
    expect(plates[0]).toEqual({
      index: '01',
      caption: RESIDENCES.plates[0]?.caption,
      media: 'residence-01',
      alt: MEDIA['residence-01'].alt,
      credit: MEDIA['residence-01'].credit,
    })
    expect(plates.map((p) => p.media)).toEqual(keys)
  })

  it('fails the build when the plate count and the media keys disagree', () => {
    expect(() => residencePlates(RESIDENCES.plates, keys.slice(0, 5))).toThrow(/six|6/)
  })

  it('does not mutate its inputs', () => {
    const input = RESIDENCES.plates.map((p) => ({ ...p }))
    const snapshot = JSON.stringify(input)
    residencePlates(input, keys)
    expect(JSON.stringify(input)).toBe(snapshot)
  })
})
