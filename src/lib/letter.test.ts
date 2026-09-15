import { describe, expect, it } from 'vitest'

import { PERSONAL_MESSAGE } from '@/content/pages/personal-message'
import { letterPageSchema } from '@/content/schemas'
import { letterSection } from './letter'

const letter = (paragraphs: readonly string[], sections = 1) =>
  letterPageSchema.parse({
    slug: 'l',
    title: 'L',
    sections: Array.from({ length: sections }, (_, i) => ({ id: `s${i}`, paragraphs })),
    signature: { name: 'A Name', role: 'A Role' },
  })

describe('letterSection', () => {
  it('moves the closing line into the signature and keeps the body in order', () => {
    const section = letterSection(letter(['One.', 'Two.', 'Warm regards,']))
    expect(section.paragraphs).toEqual(['One.', 'Two.'])
    expect(section.signature).toEqual({
      name: 'A Name',
      role: 'A Role',
      valediction: 'Warm regards,',
    })
  })

  it("reads the client's letter as one body and a valediction", () => {
    const section = letterSection(PERSONAL_MESSAGE)
    const source = PERSONAL_MESSAGE.sections[0]
    expect(section.paragraphs).toEqual(source?.paragraphs.slice(0, -1))
    expect(section.signature?.valediction).toBe(source?.paragraphs.at(-1))
    expect(section.signature?.name).toBe(PERSONAL_MESSAGE.signature.name)
  })

  it('does not mutate the content module', () => {
    const before = PERSONAL_MESSAGE.sections[0]?.paragraphs.length
    letterSection(PERSONAL_MESSAGE)
    expect(PERSONAL_MESSAGE.sections[0]?.paragraphs.length).toBe(before)
    expect('valediction' in PERSONAL_MESSAGE.signature).toBe(false)
  })

  it('fails when the last paragraph is a sentence, not a closing line', () => {
    expect(() => letterSection(letter(['One.', 'I look forward to it.']))).toThrow(
      'pages/l: the last paragraph is not a valediction'
    )
  })

  it('fails when the page has more or fewer than one section', () => {
    expect(() => letterSection(letter(['Warm regards,'], 2))).toThrow(
      'pages/l: a letter has exactly one section'
    )
  })
})
