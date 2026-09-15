/**
 * Structured logger — one JSON line per event on stdout.
 *
 * The enquiry action is the only server work on the site (docs/09 §1) and
 * the contract says nothing a person submits is stored (CLAUDE.md §3), so
 * the log is the one place personal text could leak. It cannot: the keys in
 * REDACTED_KEYS are replaced with their lengths before serialisation, at
 * every depth. No console.* anywhere — Vercel captures stdout, and a JSON
 * line is what log drains and `vercel logs` expect.
 */
export type LogLevel = 'info' | 'warn' | 'error'
export type LogFields = Readonly<Record<string, unknown>>

export type Logger = Readonly<Record<LogLevel, (event: string, fields?: LogFields) => void>>

type LoggerOptions = Readonly<{
  /** Sink for a finished line (newline included). Defaults to process.stdout. */
  write?: (line: string) => void
  now?: () => Date
}>

/** Field names whose values are what a person typed; only their length is logged. */
export const REDACTED_KEYS: ReadonlySet<string> = new Set(['name', 'email', 'telephone', 'message'])

const RESERVED_KEYS: ReadonlySet<string> = new Set(['level', 'time', 'event'])

const redactedValue = (value: unknown) =>
  typeof value === 'string' ? { redacted: true, length: value.length } : { redacted: true }

const isPlainObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error)

/** A copy of `fields` with every redacted key replaced, recursively. Never mutates the input. */
export function redact(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, redactValue(key, value)])
  )
}

function redactValue(key: string, value: unknown): unknown {
  if (REDACTED_KEYS.has(key)) return redactedValue(value)
  if (value instanceof Error) return { name: value.name, message: value.message }
  if (Array.isArray(value)) return value.map((item) => redactValue('', item))
  if (isPlainObject(value)) return redact(value)
  return value
}

const withoutReserved = (fields: LogFields): LogFields =>
  Object.fromEntries(Object.entries(fields).filter(([key]) => !RESERVED_KEYS.has(key)))

const defaultWrite = (line: string): void => {
  process.stdout.write(line)
}

export function createLogger({
  write = defaultWrite,
  now = () => new Date(),
}: LoggerOptions = {}): Logger {
  const emit =
    (level: LogLevel) =>
    (event: string, fields: LogFields = {}) => {
      const record = { level, time: now().toISOString(), event, ...redact(withoutReserved(fields)) }
      try {
        write(`${JSON.stringify(record)}\n`)
      } catch {
        // A failing sink (closed pipe) must never take the request down with it.
      }
    }
  return { info: emit('info'), warn: emit('warn'), error: emit('error') }
}

/** The process logger. Created lazily so tests can build their own with a captured sink. */
let shared: Logger | undefined
export function logger(): Logger {
  shared ??= createLogger()
  return shared
}
