import { describe, expect, it } from 'vitest'

import { contentChecks, curationChecks } from './content.checks'
import { curatePage, ours, sentencesOf } from './curated/core'
import { ABOUT } from './pages/about'

describe('content layer', () => {
  for (const result of contentChecks()) {
    it(result.name, () => {
      expect(result.detail, result.detail).toBe('')
      expect(result.ok).toBe(true)
    })
  }
})

describe('curation checks', () => {
  const [first] = ABOUT.sections
  if (!first) throw new Error('pages/about.ts has no sections')

  const failing = (curations: Parameters<typeof curationChecks>[0]) =>
    curationChecks(curations).filter((c) => !c.ok)

  it('pass a curation of real client text with our own summary', () => {
    const good = curatePage('about', ABOUT, {
      sections: [{ id: first.id, paragraphs: [0, ours('One client at a time.')] }],
    })
    expect(failing([good])).toEqual([])
  })

  it('fail a reference to client text that no longer exists', () => {
    const broken = curatePage('about', ABOUT, {
      sections: [{ id: 'a-section-the-client-removed' }, { id: first.id, paragraphs: [999] }],
    })
    const [result] = failing([broken])
    expect(result?.name).toBe('every curation references client text that exists')
    expect(result?.detail).toContain('no client section “a-section-the-client-removed”')
    expect(result?.detail).toContain('no client text at index 999')
  })

  it('fail our own string when it breaks the house voice', () => {
    const loud = curatePage('about', ABOUT, {
      sections: [{ id: first.id, paragraphs: [ours('Begin your journey — today!')] }],
    })
    const [result] = failing([loud])
    expect(result?.name).toBe('copy we write keeps the house voice')
    expect(result?.detail).toContain('en or em dash')
    expect(result?.detail).toContain('exclamation mark')
    expect(result?.detail).toContain('forbidden word “journey”')
  })

  it('leave the client’s own sentences alone, dashes included', () => {
    const withDash = ABOUT.sections
      .flatMap((s) => s.paragraphs.map((p, i) => ({ id: s.id, i, p })))
      .find(({ p }) => /[–—]/.test(p))
    if (!withDash) return
    const curation = curatePage('about', ABOUT, {
      sections: [{ id: withDash.id, paragraphs: [withDash.i, sentencesOf(withDash.i, [0])] }],
    })
    expect(failing([curation])).toEqual([])
  })

  it('fail two curations with the same name', () => {
    const a = curatePage('about', ABOUT, { sections: [] })
    const [result] = failing([a, a])
    expect(result?.detail).toBe('duplicate curation about')
  })
})
