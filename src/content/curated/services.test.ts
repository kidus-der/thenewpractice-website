import { describe, expect, it } from 'vitest'

import { SERVICES, SERVICES_PAGE } from '../services'
import { sentences } from '../sentences'
import {
  SERVICE_SPECS,
  SERVICES_CURATED,
  SERVICES_CURATION,
  SERVICES_PAGE_CURATED,
  SERVICES_PAGE_CURATION,
} from './services'

/** Every client sentence the source service carries, anywhere in its prose. */
const clientSentences = (slug: string): ReadonlySet<string> => {
  const source = SERVICES.find((s) => s.slug === slug)
  const prose = [
    ...(source?.intro ?? []),
    ...(source?.outro ?? []),
    ...(source?.subsections ?? []).flatMap((s) => [
      ...s.paragraphs,
      ...(s.definitions ?? []).map((d) => d.description),
    ]),
  ]
  return new Set(prose.flatMap((p) => sentences(p)))
}

describe('the curated services', () => {
  it('curates every service, with no broken reference and nothing of ours', () => {
    expect(Object.keys(SERVICE_SPECS).sort()).toEqual(SERVICES.map((s) => s.slug).sort())
    expect(SERVICES_CURATION.problems).toEqual([])
    expect(SERVICES_CURATION.ours).toEqual([])
  })

  it('keeps the eleven in order, with their titles and every list item', () => {
    expect(SERVICES_CURATED.map((s) => [s.slug, s.order, s.title])).toEqual(
      SERVICES.map((s) => [s.slug, s.order, s.title])
    )
    SERVICES_CURATED.forEach((curated, i) => {
      const source = SERVICES[i]
      expect(curated.treats).toEqual(source?.treats)
      expect(curated.treatsHeading).toEqual(source?.treatsHeading)
      expect(curated.mayInclude).toEqual(source?.mayInclude)
      expect(curated.mayIncludeHeading).toEqual(source?.mayIncludeHeading)
      const sourceLists = (source?.subsections ?? []).flatMap((s) => s.list ?? [])
      const curatedLists = (curated.subsections ?? []).flatMap((s) => s.list ?? [])
      expect(curatedLists).toEqual(sourceLists)
    })
  })

  it('sets a lead of at most two sentences on every title page', () => {
    for (const service of SERVICES_CURATED) {
      const [lead] = service.intro
      expect(lead, service.slug).toBeDefined()
      expect(sentences(lead ?? '').length, service.slug).toBeLessThanOrEqual(2)
    }
  })

  it('renders only the client’s own sentences', () => {
    for (const service of SERVICES_CURATED) {
      const known = clientSentences(service.slug)
      const rendered = [
        ...service.intro,
        ...(service.outro ?? []),
        ...(service.subsections ?? []).flatMap((s) => [
          ...s.paragraphs,
          ...(s.definitions ?? []).map((d) => d.description),
        ]),
      ].flatMap((p) => sentences(p))
      expect(
        rendered.filter((s) => !known.has(s)),
        service.slug
      ).toEqual([])
    }
  })

  it('trims every definition to its term and first sentence', () => {
    const trauma = SERVICES_CURATED.find((s) => s.slug === 'trauma-and-complex-trauma')
    const definitions = trauma?.subsections?.flatMap((s) => s.definitions ?? []) ?? []
    expect(definitions).toHaveLength(8)
    for (const d of definitions) expect(sentences(d.description)).toHaveLength(1)
  })

  it('reads less than the client’s full text on every page', () => {
    const words = (texts: readonly string[]) => texts.join(' ').split(/\s+/).length
    SERVICES_CURATED.forEach((curated, i) => {
      const source = SERVICES[i]
      if (!source) throw new Error('eleven services')
      const prose = (s: typeof source) => [
        ...s.intro,
        ...(s.outro ?? []),
        ...(s.subsections ?? []).flatMap((x) => [
          ...x.paragraphs,
          ...(x.definitions ?? []).map((d) => d.description),
        ]),
      ]
      expect(words(prose(curated)), curated.slug).toBeLessThanOrEqual(words(prose(source)))
    })
  })
})

describe('the curated services index', () => {
  it('has no broken reference and nothing of ours', () => {
    expect(SERVICES_PAGE_CURATION.problems).toEqual([])
    expect(SERVICES_PAGE_CURATION.ours).toEqual([])
  })

  it('lifts two of the intro’s sentences onto the title page and drops the section', () => {
    const { page, listLead } = SERVICES_PAGE_CURATED
    const [intro] = SERVICES_PAGE.sections
    expect(page.title).toBe(SERVICES_PAGE.title)
    expect(page.sections).toEqual([])
    expect(page.lead).toBe(`${intro?.paragraphs[0]} ${sentences(intro?.paragraphs[2] ?? '')[0]}`)
    expect(listLead).toBe(intro?.paragraphs[3])
  })
})
