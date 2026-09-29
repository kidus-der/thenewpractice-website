import { describe, expect, it } from 'vitest'

import type { Page, Section } from '../schemas'
import { ALL, curate, curatePage, isCuration, only, ours, sentencesOf } from './core'

const SECTION: Section = {
  id: 'who-we-are',
  title: 'WHO WE ARE',
  subtitle: 'A practice',
  paragraphs: [
    'First paragraph. It has two sentences.',
    'Second paragraph, one sentence.',
    'Third. Dr. Adams wrote it. Fourth sentence here.',
  ],
  listHeading: 'We treat:',
  list: ['Anxiety', 'Burnout', 'Grief'],
  outro: ['After the list.'],
  definitions: [
    { term: 'Presence', description: 'Being there. Every day.' },
    { term: 'Rigour', description: 'Method.' },
  ],
  subsections: [{ id: 'detail', title: 'Detail', paragraphs: ['Deep detail.', 'More.'] }],
}

const PAGE: Page & { signature: string } = {
  slug: 'about',
  title: 'About',
  eyebrow: 'The practice',
  lead: 'A lead. With a second sentence.',
  sections: [SECTION, { id: 'second', title: 'Second', paragraphs: ['Only one.'] }],
  signature: 'kept as is',
}

describe('curatePage', () => {
  it('keeps the page fields, renders the named sections in spec order and drops the rest', () => {
    const { value, problems } = curatePage('about', PAGE, {
      sections: [{ id: 'second', paragraphs: ALL }, { id: 'who-we-are' }],
    })
    expect(problems).toEqual([])
    expect(value.title).toBe('About')
    expect(value.eyebrow).toBe('The practice')
    expect(value.lead).toBe(PAGE.lead)
    expect(value.signature).toBe('kept as is')
    expect(value.sections.map((s) => s.id)).toEqual(['second', 'who-we-are'])
    expect(value.sections[1]).toEqual({
      id: 'who-we-are',
      title: 'WHO WE ARE',
      subtitle: 'A practice',
      paragraphs: [],
    })
  })

  it('picks paragraphs by index, sentences by index, and our own strings, in the order given', () => {
    const {
      value,
      problems,
      ours: written,
    } = curatePage('about', PAGE, {
      lead: only([0]),
      sections: [
        {
          id: 'who-we-are',
          paragraphs: [2, sentencesOf(0, [1, 0]), ours('One client at a time.')],
        },
      ],
    })
    expect(problems).toEqual([])
    expect(value.lead).toBe('A lead.')
    expect(value.sections[0]?.paragraphs).toEqual([
      'Third. Dr. Adams wrote it. Fourth sentence here.',
      'It has two sentences. First paragraph.',
      'One client at a time.',
    ])
    expect(written).toEqual([
      { where: 'about.sections.who-we-are.paragraphs[2]', text: 'One client at a time.' },
    ])
  })

  it('does not split a sentence after an abbreviation', () => {
    const { value } = curatePage('about', PAGE, {
      sections: [{ id: 'who-we-are', paragraphs: [sentencesOf(2, [1])] }],
    })
    expect(value.sections[0]?.paragraphs).toEqual(['Dr. Adams wrote it.'])
  })

  it('carries the list heading with the list, and lets it be replaced or dropped', () => {
    const withList = curatePage('p', PAGE, { sections: [{ id: 'who-we-are', list: [2, 0] }] })
    expect(withList.value.sections[0]).toMatchObject({
      listHeading: 'We treat:',
      list: ['Grief', 'Anxiety'],
    })
    const replaced = curatePage('p', PAGE, {
      sections: [{ id: 'who-we-are', list: ALL, listHeading: ours('Conditions') }],
    })
    expect(replaced.value.sections[0]?.listHeading).toBe('Conditions')
    const dropped = curatePage('p', PAGE, {
      sections: [{ id: 'who-we-are', list: ALL, listHeading: null }],
    })
    expect(dropped.value.sections[0]).not.toHaveProperty('listHeading')
    const noList = curatePage('p', PAGE, { sections: [{ id: 'who-we-are' }] })
    expect(noList.value.sections[0]).not.toHaveProperty('listHeading')
    expect(noList.value.sections[0]).not.toHaveProperty('list')
  })

  it('replaces or drops single fields', () => {
    const { value } = curatePage('p', PAGE, {
      eyebrow: null,
      title: ours('About us'),
      sections: [{ id: 'who-we-are', title: ours('Who we are'), subtitle: null }],
    })
    expect(value.title).toBe('About us')
    expect(value).not.toHaveProperty('eyebrow')
    expect(value.sections[0]?.title).toBe('Who we are')
    expect(value.sections[0]).not.toHaveProperty('subtitle')
  })

  it('keeps the page title when a spec tries to drop it', () => {
    expect(curatePage('p', PAGE, { title: null, sections: [] }).value.title).toBe('About')
  })

  it('picks outro, definitions and subsections', () => {
    const { value, problems } = curatePage('p', PAGE, {
      sections: [
        {
          id: 'who-we-are',
          outro: ALL,
          definitions: [1, { at: 0, description: only([0]) }],
          subsections: [{ id: 'detail', paragraphs: [1] }],
        },
      ],
    })
    expect(problems).toEqual([])
    expect(value.sections[0]).toMatchObject({
      outro: ['After the list.'],
      definitions: [
        { term: 'Rigour', description: 'Method.' },
        { term: 'Presence', description: 'Being there.' },
      ],
      subsections: [{ id: 'detail', title: 'Detail', paragraphs: ['More.'] }],
    })
  })

  it('keeps every definition with ALL and replaces a term with ours', () => {
    const {
      value,
      ours: written,
      problems,
    } = curatePage('p', PAGE, {
      sections: [
        { id: 'who-we-are', definitions: [{ at: 1, term: ours('Method') }] },
        { id: 'second', definitions: ALL },
      ],
    })
    expect(problems).toEqual(['p.sections.second.definitions: nothing to keep'])
    expect(value.sections[0]?.definitions).toEqual([{ term: 'Method', description: 'Method.' }])
    expect(value.sections[1]).not.toHaveProperty('definitions')
    expect(written.map((o) => o.where)).toEqual(['p.sections.who-we-are.definitions[1].term'])
  })

  it('does not mutate its source', () => {
    const before = JSON.stringify(PAGE)
    curatePage('p', PAGE, {
      title: ours('X'),
      sections: [{ id: 'who-we-are', paragraphs: [0], list: ALL }],
    })
    expect(JSON.stringify(PAGE)).toBe(before)
  })
})

describe('broken references', () => {
  it('reports a missing section, paragraph, sentence, list item and definition', () => {
    const { value, problems } = curatePage('about', PAGE, {
      sections: [
        { id: 'gone' },
        {
          id: 'who-we-are',
          paragraphs: [7, sentencesOf(1, [3])],
          list: [9],
          definitions: [4],
          subsections: [{ id: 'nowhere' }],
        },
      ],
    })
    expect(problems).toEqual([
      'about.sections: no client section “gone”',
      'about.sections.who-we-are.paragraphs[0]: no client text at index 7 (the source has 3)',
      'about.sections.who-we-are.paragraphs[1][1]: no sentence 3 (the client text has 1)',
      'about.sections.who-we-are.list[0]: no client text at index 9 (the source has 3)',
      'about.sections.who-we-are.definitions[0]: no client definition at index 4',
      'about.sections.who-we-are.subsections: no client section “nowhere”',
    ])
    expect(value.sections).toHaveLength(1)
    expect(value.sections[0]?.paragraphs).toEqual([])
  })

  it('reports an empty sentence pick and a duplicated index', () => {
    const { problems } = curatePage('p', PAGE, {
      sections: [{ id: 'who-we-are', paragraphs: [0, 0, sentencesOf(1, [])] }],
    })
    expect(problems).toEqual([
      'p.sections.who-we-are.paragraphs: index 0 picked twice',
      'p.sections.who-we-are.paragraphs[2][1]: a sentence pick names no sentences',
    ])
  })

  it('reports keeping or splitting a field the client never wrote', () => {
    const { problems } = curatePage('p', PAGE, {
      sections: [
        { id: 'second', subtitle: 'keep', header: only([0]), outro: ALL },
        { id: 'who-we-are', title: sentencesOf(1, [0]) },
      ],
    })
    expect(problems).toEqual([
      'p.sections.second.subtitle: nothing to keep',
      'p.sections.second.header: no client text to take sentences from',
      'p.sections.second.outro: nothing to keep',
      'p.sections.who-we-are.title: a single field takes only(), not index 1',
    ])
  })
})

describe('curate', () => {
  it('curates any shape through texts() and text()', () => {
    const service = { slug: 's', intro: ['One. Two.', 'Three.'], title: 'Service' }
    const result = curate('services', (c) => ({
      ...service,
      intro: c.texts(service.intro, [sentencesOf(0, [1]), ours('Ours.')], 's.intro'),
      title: c.text(service.title, 'keep', 's.title'),
    }))
    expect(result.value).toEqual({ slug: 's', intro: ['Two.', 'Ours.'], title: 'Service' })
    expect(result.ours).toEqual([{ where: 'services.s.intro[1]', text: 'Ours.' }])
    expect(result.problems).toEqual([])
  })

  it('curates a bare section and returns undefined for a dropped field', () => {
    const result = curate('x', (c) => ({
      section: c.section(SECTION, { id: 'who-we-are', paragraphs: [1] }, 'who'),
      dropped: c.text('text', null, 'dropped'),
      ours: c.text(undefined, ours('Mine.'), 'mine'),
    }))
    expect(result.value.section.paragraphs).toEqual(['Second paragraph, one sentence.'])
    expect(result.value.dropped).toBeUndefined()
    expect(result.value.ours).toBe('Mine.')
  })

  it('recognises its own results', () => {
    expect(isCuration(curate('x', () => 1))).toBe(true)
    expect(isCuration(null)).toBe(false)
    expect(isCuration('x')).toBe(false)
    expect(isCuration({ name: 'x', value: 1 })).toBe(false)
  })
})
