import { describe, expect, it } from 'vitest'

import { DEFAULT_PLATE_QUALITY, REDUCED_PLATE_QUALITY, isPortrait, plateQuality } from './plates'

describe('plateQuality', () => {
  it('lowers the canopy silhouette, the one frame over the served-size budget', () => {
    expect(plateQuality('index-01')).toBe(REDUCED_PLATE_QUALITY)
  })

  it('lowers the round-1 About, Our Process and Fees frames over the 120 kB budget', () => {
    const heavy = [
      'about-ceiba',
      'process-lead-clinician',
      'about-practice',
      'fees',
      'about-founder',
    ] as const
    for (const key of heavy) expect(plateQuality(key)).toBe(REDUCED_PLATE_QUALITY)
    expect(plateQuality('about-sea')).toBe(DEFAULT_PLATE_QUALITY)
  })

  it('leaves every other frame at the default', () => {
    expect(plateQuality('hero-surf-poster')).toBe(DEFAULT_PLATE_QUALITY)
    expect(plateQuality('residence-04')).toBe(DEFAULT_PLATE_QUALITY)
  })
})

describe('isPortrait', () => {
  it('is true for a 3:4 plate and false for a 16:9 poster', () => {
    expect(isPortrait('index-01')).toBe(true)
    expect(isPortrait('hero-surf-poster')).toBe(false)
  })
})
