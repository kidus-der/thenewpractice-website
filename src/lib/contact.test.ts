import { describe, expect, it } from 'vitest'

import { BRAND } from '@/content/brand'
import { mailHref, telHref } from './contact'

describe('telHref', () => {
  it('keeps the leading plus and the digits, dropping spaces and hyphens', () => {
    expect(telHref('+1 778-679-3369')).toBe('tel:+17786793369')
  })

  it('drops parentheses and dots as well', () => {
    expect(telHref('(778) 679.3369')).toBe('tel:7786793369')
  })

  it("builds the founder's number from brand.ts", () => {
    expect(telHref(BRAND.phone)).toMatch(/^tel:\+?\d+$/)
  })
})

describe('mailHref', () => {
  it('prefixes the address with mailto:', () => {
    expect(mailHref(BRAND.email)).toBe(`mailto:${BRAND.email}`)
  })
})
