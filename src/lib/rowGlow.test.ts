import { describe, expect, it } from 'vitest'
import { glowBox, releaseRow } from './rowGlow'

describe('glowBox', () => {
  it('returns the row box as the glow position and size', () => {
    // Arrange
    const row = { offsetLeft: 412, offsetTop: 97, offsetWidth: 380, offsetHeight: 61 }

    // Act
    const box = glowBox(row)

    // Assert
    expect(box).toEqual({ x: 412, y: 97, width: 380, height: 61 })
  })

  it('places a full-width row at the origin of its list', () => {
    expect(glowBox({ offsetLeft: 0, offsetTop: 1, offsetWidth: 1024, offsetHeight: 88 })).toEqual({
      x: 0,
      y: 1,
      width: 1024,
      height: 88,
    })
  })
})

describe('releaseRow', () => {
  it('clears the glow when the row holding it lets go', () => {
    expect(releaseRow(4, 4)).toBeNull()
  })

  it('keeps the glow where it is when a different row lets go', () => {
    expect(releaseRow(5, 4)).toBe(5)
  })

  it('stays clear when nothing holds the glow', () => {
    expect(releaseRow(null, 4)).toBeNull()
  })
})
