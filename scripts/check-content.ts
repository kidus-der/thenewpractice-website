/**
 * Runs the content checks without Vitest:
 *
 *   node --experimental-strip-types scripts/check-content.ts
 *
 * Node strips the types but does not add `.ts` to extensionless relative
 * imports, so a small resolve hook does that for files under src/. Task 4's
 * Vitest run (`src/content/content.test.ts`) exercises the same checks.
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import * as nodeModule from 'node:module'
import { fileURLToPath } from 'node:url'

const { registerHooks } = nodeModule

const HAS_EXTENSION = /\.[cm]?[jt]sx?$/

registerHooks({
  resolve(specifier, context, next) {
    const relative = specifier.startsWith('.') && !HAS_EXTENSION.test(specifier)
    if (!relative || !context.parentURL?.startsWith('file:')) return next(specifier, context)
    const candidate = fileURLToPath(new URL(specifier, context.parentURL)) + '.ts'
    return existsSync(candidate) ? next(`${specifier}.ts`, context) : next(specifier, context)
  },
})

type Check = { name: string; ok: boolean; detail: string }
type ChecksModule = { contentChecks: () => readonly Check[] }

// Built from parts so tsc does not try to type-check a `.ts`-suffixed specifier.
const checksModulePath = ['..', 'src', 'content', 'content.checks'].join('/') + '.ts'
const { contentChecks } = (await import(checksModulePath)) as ChecksModule

const results = contentChecks()
for (const result of results) {
  const mark = result.ok ? 'ok  ' : 'FAIL'
  process.stdout.write(`${mark} ${result.name}\n`)
  if (!result.ok) process.stdout.write(`     ${result.detail.replace(/\n/g, '\n     ')}\n`)
}

const failed = results.filter((r) => !r.ok)
assert.equal(failed.length, 0, `${failed.length} content check(s) failed`)
process.stdout.write(`${results.length} content checks passed\n`)
