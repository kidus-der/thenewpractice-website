import { describe, expect, it, vi } from 'vitest'

import { REDACTED_KEYS, createLogger, redact } from './logger'

const FIXED_TIME = new Date('2026-09-15T10:00:00.000Z')

function capture() {
  const lines: string[] = []
  const logger = createLogger({ write: (line) => void lines.push(line), now: () => FIXED_TIME })
  const last = () => JSON.parse(lines.at(-1) ?? '{}') as Record<string, unknown>
  return { logger, lines, last }
}

describe('createLogger', () => {
  it('writes one JSON line per call with level, time and event', () => {
    const { logger, lines, last } = capture()

    logger.info('enquiry.received')

    expect(lines).toHaveLength(1)
    expect(lines[0]?.endsWith('\n')).toBe(true)
    expect(last()).toEqual({
      level: 'info',
      time: FIXED_TIME.toISOString(),
      event: 'enquiry.received',
    })
  })

  it.each(['info', 'warn', 'error'] as const)('labels the %s level', (level) => {
    const { logger, last } = capture()

    logger[level]('event')

    expect(last().level).toBe(level)
  })

  it('carries plain fields through unchanged', () => {
    const { logger, last } = capture()

    logger.info('enquiry.sent', { id: 'abc', enquiringFor: 'family', attempt: 2 })

    expect(last()).toMatchObject({ id: 'abc', enquiringFor: 'family', attempt: 2 })
  })

  it.each([...REDACTED_KEYS])('replaces %s with its length only', (key) => {
    const { logger, last } = capture()

    logger.info('event', { [key]: 'something a person typed' })

    expect(last()[key]).toEqual({ redacted: true, length: 'something a person typed'.length })
    expect(JSON.stringify(last())).not.toContain('person typed')
  })

  it('redacts inside nested objects and arrays', () => {
    const { logger, last } = capture()

    logger.warn('event', { enquiry: { email: 'a@b.c', note: 'ok' }, list: [{ message: 'hi' }] })

    expect(last()).toMatchObject({
      enquiry: { email: { redacted: true, length: 5 }, note: 'ok' },
      list: [{ message: { redacted: true, length: 2 } }],
    })
  })

  it('reports a non-string redacted value as redacted without a length', () => {
    const { logger, last } = capture()

    logger.info('event', { message: 42 })

    expect(last().message).toEqual({ redacted: true })
  })

  it('serialises an Error as its name and message', () => {
    const { logger, last } = capture()

    logger.error('enquiry.failed', { error: new TypeError('boom') })

    expect(last().error).toEqual({ name: 'TypeError', message: 'boom' })
  })

  it('does not let a field override level, time or event', () => {
    const { logger, last } = capture()

    logger.info('real', { level: 'fake', event: 'fake', time: 'fake' })

    expect(last()).toMatchObject({ level: 'info', event: 'real', time: FIXED_TIME.toISOString() })
  })

  it('never throws when the sink fails', () => {
    const logger = createLogger({
      write: () => {
        throw new Error('EPIPE')
      },
    })

    expect(() => logger.info('event')).not.toThrow()
  })

  it('writes to stdout by default and never to console', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const log = vi.spyOn(console, 'log')

    createLogger().info('event')

    expect(stdout).toHaveBeenCalledTimes(1)
    expect(log).not.toHaveBeenCalled()
    stdout.mockRestore()
    log.mockRestore()
  })
})

describe('redact', () => {
  it('returns a new object and leaves the input untouched', () => {
    const input = { email: 'a@b.c', nested: { telephone: '123' } }

    const output = redact(input)

    expect(output).not.toBe(input)
    expect(input.email).toBe('a@b.c')
    expect(input.nested.telephone).toBe('123')
  })
})
