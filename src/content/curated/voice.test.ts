import { describe, expect, it } from 'vitest'

import { FORBIDDEN_WORDS, PLACEHOLDER_PREFIX, voiceProblems } from './voice'

describe('voiceProblems', () => {
  it('passes plain, trimmed copy with hyphens and full stops', () => {
    expect(voiceProblems('One client at a time. A well-kept house.')).toEqual([])
  })

  it('flags an em dash, an en dash and a minus sign', () => {
    expect(voiceProblems('Rest — then work')).toEqual(['en or em dash'])
    expect(voiceProblems('Weeks 1–4')).toEqual(['en or em dash'])
    expect(voiceProblems('A − B')).toEqual(['en or em dash'])
  })

  it('flags an exclamation mark', () => {
    expect(voiceProblems('Welcome!')).toEqual(['exclamation mark'])
  })

  it('flags untrimmed or empty strings', () => {
    expect(voiceProblems(' Welcome.')).toEqual(['empty or untrimmed'])
    expect(voiceProblems('')).toEqual(['empty or untrimmed'])
  })

  it('flags every forbidden word, in any case and inflection', () => {
    for (const word of FORBIDDEN_WORDS) {
      expect(voiceProblems(`A ${word.toUpperCase()} here.`)).toEqual([`forbidden word “${word}”`])
    }
    expect(voiceProblems('It elevates the stay.')).toEqual(['forbidden word “elevate”'])
    expect(voiceProblems('Small luxuries.')).toEqual(['forbidden word “luxury”'])
    expect(voiceProblems('Two oases.')).toEqual(['forbidden word “oasis”'])
    expect(voiceProblems('Escaping the city.')).toEqual(['forbidden word “escape”'])
  })

  it('matches whole words only', () => {
    expect(voiceProblems('A sanctuaryless coast.')).toEqual([])
    expect(voiceProblems('Class of its own, world renowned.')).toEqual([])
    expect(voiceProblems('Journeyman carpenters.')).toEqual([])
  })

  it('reports several problems together', () => {
    expect(voiceProblems('A bespoke journey — begin!')).toEqual([
      'en or em dash',
      'exclamation mark',
      'forbidden word “journey”',
      'forbidden word “bespoke”',
    ])
  })

  it('excepts the PLACEHOLDER prefix and checks what follows it', () => {
    expect(voiceProblems(`${PLACEHOLDER_PREFIX}The residences.`)).toEqual([])
    expect(voiceProblems(`${PLACEHOLDER_PREFIX}A sanctuary.`)).toEqual([
      'forbidden word “sanctuary”',
    ])
    expect(voiceProblems('PLACEHOLDER — ')).toEqual(['empty or untrimmed'])
    expect(voiceProblems(`${PLACEHOLDER_PREFIX} `)).toEqual(['empty or untrimmed'])
  })
})
