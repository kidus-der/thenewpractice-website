import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { isCuration } from './core'
import { CURATIONS } from './index'

/** Vitest runs from the repository root (as content.checks.ts assumes). */
const DIRECTORY = join(process.cwd(), 'src', 'content', 'curated')
const INFRASTRUCTURE = new Set(['core.ts', 'voice.ts', 'index.ts'])

const curatedModules = (): readonly string[] =>
  readdirSync(DIRECTORY).filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && !INFRASTRUCTURE.has(file)
  )

describe('the curation registry', () => {
  it('lists every curation exported under src/content/curated/', async () => {
    const exported = await Promise.all(
      curatedModules().map(async (file) => {
        const exports = (await import(`./${file}`)) as Record<string, unknown>
        return Object.entries(exports)
          .filter(([, value]) => isCuration(value))
          .map(([name, value]) => ({ file, name, value }))
      })
    )
    const missing = exported
      .flat()
      .filter(({ value }) => !CURATIONS.includes(value as (typeof CURATIONS)[number]))
      .map(({ file, name }) => `${file}: ${name} is not listed in curated/index.ts`)
    expect(missing).toEqual([])
  })
})
