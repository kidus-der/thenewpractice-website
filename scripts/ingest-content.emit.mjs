/**
 * Serialises plain data to TypeScript source in the repository's Prettier
 * style (single quotes, no semicolons, trailing commas, width 100), so a
 * `npm run format` pass leaves generated files unchanged and regeneration is
 * idempotent.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { GENERATED_HEADER, PRINT_WIDTH, SOURCE_FILE } from './ingest-content.config.mjs'

const INDENT = '  '
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/
/** Prettier never breaks after the colon of a key narrower than tabWidth + 3. */
const PRETTIER_SHORT_KEY_WIDTH = INDENT.length + 3

/** A code reference emitted verbatim, e.g. `BRAND.phone`. */
export function raw(code) {
  return { __raw: code }
}

function quote(value) {
  const singles = (value.match(/'/g) ?? []).length
  const doubles = (value.match(/"/g) ?? []).length
  const q = singles > doubles ? '"' : "'"
  const escaped = value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').split(q).join(`\\${q}`)
  return `${q}${escaped}${q}`
}

function emitArray(items, depth) {
  if (items.length === 0) return '[]'
  const inner = INDENT.repeat(depth + 1)
  const rendered = items.map((item) => emit(item, depth + 1))
  const flat = `[${rendered.join(', ')}]`
  const fits =
    !rendered.some((r) => r.includes('\n')) && depth * INDENT.length + flat.length <= PRINT_WIDTH
  if (fits) return flat
  return `[\n${rendered.map((r) => `${inner}${r},`).join('\n')}\n${INDENT.repeat(depth)}]`
}

function emitObject(value, depth) {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return '{}'
  const inner = INDENT.repeat(depth + 1)
  const lines = entries.map(([key, v]) => {
    const k = IDENTIFIER.test(key) ? key : quote(key)
    const rendered = emit(v, depth + 1)
    const line = `${inner}${k}: ${rendered},`
    const shortKey = k.length < PRETTIER_SHORT_KEY_WIDTH
    const breakAfterColon = typeof v === 'string' && !shortKey && line.length > PRINT_WIDTH
    return breakAfterColon ? `${inner}${k}:\n${inner}${INDENT}${rendered},` : line
  })
  return `{\n${lines.join('\n')}\n${INDENT.repeat(depth)}}`
}

export function emit(value, depth = 0) {
  if (value === null) return 'null'
  if (typeof value === 'string') return quote(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return emitArray(value, depth)
  if (typeof value === 'object' && '__raw' in value) return value.__raw
  if (typeof value === 'object') return emitObject(value, depth)
  throw new Error(`emit: unsupported value ${String(value)}`)
}

/** Required arrays that must be emitted even when empty. */
const KEEP_EMPTY = new Set(['paragraphs'])

/** Drop undefined keys and empty optional arrays so modules stay minimal. */
export function compact(value) {
  if (Array.isArray(value)) return value.map(compact)
  if (value && typeof value === 'object' && !('__raw' in value)) {
    const entries = Object.entries(value)
      .filter(
        ([k, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0 && !KEEP_EMPTY.has(k))
      )
      .map(([k, v]) => [k, compact(v)])
    return Object.fromEntries(entries)
  }
  return value
}

/** `homePageSchema` → `HomePage`: the inferred type exported beside each schema. */
export function typeNameOf(schema) {
  const base = schema.replace(/Schema$/, '')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/**
 * A module: header, source line range, imports, then one `export const` per
 * entry as a plain object annotated with its schema's inferred type (an
 * annotation, not `satisfies`, so the exported type is exactly what
 * `schema.parse()` used to return and no literal narrows downstream). The
 * schema import is type-only, so Zod never reaches a client bundle through a
 * content module (Task 20); the runtime parse lives in content.checks.ts,
 * which `npm test` and `npm run content:check` both run.
 */
export function renderModule({ range, imports, exports, note }) {
  const importLines = imports.map(
    ({ names, from, typeOnly }) =>
      `import ${typeOnly ? 'type ' : ''}{ ${names.join(', ')} } from '${from}'`
  )
  const body = exports.map(
    ({ name, type, value }) => `export const ${name}: ${type} = ${emit(value)}`
  )
  const source = `// Source: «${SOURCE_FILE}», lines ${range.from}–${range.to}.`
  const head = [GENERATED_HEADER, source, ...(note ? [note] : []), '', ...importLines, ''].join(
    '\n'
  )
  return `${head}\n${body.join('\n\n')}\n`
}

/** Write only when the content changed; report which. */
export function writeModule(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  const existing = (() => {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return null
    }
  })()
  if (existing === content) return 'unchanged'
  writeFileSync(path, content)
  return existing === null ? 'created' : 'updated'
}
