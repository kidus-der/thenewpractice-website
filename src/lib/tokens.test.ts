import { describe, expect, it } from 'vitest'
import { PALETTE, readToken } from './tokens'

describe('readToken', () => {
  it('returns the trimmed property value when the reader has one', () => {
    // Arrange
    const reader = (name: string) => (name === '--c-canopy' ? '  #14231c ' : undefined)

    // Act
    const value = readToken('--c-canopy', PALETTE.bone, reader)

    // Assert
    expect(value).toBe('#14231c')
  })

  it('returns the fallback when the reader yields nothing (server render)', () => {
    const reader = () => undefined

    const value = readToken('--c-canopy', PALETTE.canopy, reader)

    expect(value).toBe(PALETTE.canopy)
  })

  it('returns the fallback when the property is set but empty', () => {
    const reader = () => '   '

    const value = readToken('--c-stone', PALETTE.stone, reader)

    expect(value).toBe(PALETTE.stone)
  })

  it('returns the fallback for a name that is not a custom property', () => {
    const reader = () => '#a9895c'

    const value = readToken('c-brass', PALETTE.canopy, reader)

    expect(value).toBe(PALETTE.canopy)
  })

  it('returns the fallback on the server without a reader injected', () => {
    // Vitest runs this file in jsdom, whose getComputedStyle yields no custom
    // property values, so readToken() must fall back exactly as on the server.
    const value = readToken('--c-canopy', PALETTE.canopy)

    expect(value).toBe(PALETTE.canopy)
  })
})
