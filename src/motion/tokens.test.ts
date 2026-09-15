import { afterEach, describe, expect, it, vi } from 'vitest'

import { D, prefersReducedMotion } from './tokens'

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

/** jsdom has no matchMedia; install one that answers `matches` for every query. */
function installMatchMedia(matches: boolean): ReturnType<typeof vi.fn> {
  const matchMedia = vi.fn((query: string) => ({ matches, media: query }))
  Object.defineProperty(window, 'matchMedia', {
    value: matchMedia,
    configurable: true,
    writable: true,
  })
  return matchMedia
}

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('returns true when the OS asks for reduced motion', () => {
    // Arrange
    installMatchMedia(true)

    // Act
    const result = prefersReducedMotion()

    // Assert
    expect(result).toBe(true)
  })

  it('returns false when the OS has no preference', () => {
    installMatchMedia(false)

    expect(prefersReducedMotion()).toBe(false)
  })

  it('asks the browser the reduce query, not the no-preference one', () => {
    const matchMedia = installMatchMedia(false)

    prefersReducedMotion()

    expect(matchMedia).toHaveBeenCalledWith(REDUCE_QUERY)
  })

  it('returns false on the server, where there is no window', () => {
    vi.stubGlobal('window', undefined)

    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('duration tokens', () => {
  it('ascend from instant to glacial so a slower name is never a faster tween', () => {
    const ordered = [D.instant, D.fast, D.base, D.slow, D.glacial]

    expect([...ordered].sort((a, b) => a - b)).toEqual(ordered)
  })
})
