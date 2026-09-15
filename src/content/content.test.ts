import { describe, expect, it } from 'vitest'

import { contentChecks } from './content.checks'

describe('content layer', () => {
  for (const result of contentChecks()) {
    it(result.name, () => {
      expect(result.detail, result.detail).toBe('')
      expect(result.ok).toBe(true)
    })
  }
})
