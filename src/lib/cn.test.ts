import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('joins class names with a single space', () => {
    // Arrange
    const parts = ['hero', 'hero--dark']

    // Act
    const result = cn(...parts)

    // Assert
    expect(result).toBe('hero hero--dark')
  })

  it('drops false, null and undefined so conditional classes read naturally', () => {
    const isActive = false

    const result = cn('nav__item', isActive && 'nav__item--active', null, undefined)

    expect(result).toBe('nav__item')
  })

  it('drops empty strings', () => {
    expect(cn('a', '', 'b')).toBe('a b')
  })

  it('returns an empty string when nothing survives', () => {
    expect(cn()).toBe('')
    expect(cn(false, null, undefined, '')).toBe('')
  })

  it('preserves the order the parts were given in', () => {
    expect(cn('c', 'a', 'b')).toBe('c a b')
  })

  it('does not mutate the parts it is given', () => {
    const parts = ['a', false, 'b'] as const

    cn(...parts)

    expect(parts).toEqual(['a', false, 'b'])
  })
})
