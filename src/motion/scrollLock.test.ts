import { describe, expect, it, vi } from 'vitest'

import { createScrollLock } from './scrollLock'

const make = () => {
  const onLock = vi.fn()
  const onRelease = vi.fn()
  const lock = createScrollLock({ onLock, onRelease })
  return { lock, onLock, onRelease }
}

describe('createScrollLock', () => {
  it('locks on the first holder and releases on the last', () => {
    const { lock, onLock, onRelease } = make()
    lock.stop()
    lock.stop()
    expect(onLock).toHaveBeenCalledTimes(1)
    expect(lock.depth()).toBe(2)

    lock.start()
    expect(onRelease).not.toHaveBeenCalled()
    lock.start()
    expect(onRelease).toHaveBeenCalledTimes(1)
    expect(lock.depth()).toBe(0)
  })

  it('does not let one holder release another', () => {
    // The overlay closes while the curtain is still covering (ledger, Task 7).
    const { lock, onRelease } = make()
    lock.stop() // curtain
    lock.stop() // overlay
    lock.start() // overlay cleanup
    expect(onRelease).not.toHaveBeenCalled()
    expect(lock.depth()).toBe(1)
  })

  it('ignores a release with no holder', () => {
    const { lock, onLock, onRelease } = make()
    lock.start()
    expect(onRelease).not.toHaveBeenCalled()
    expect(lock.depth()).toBe(0)
    lock.stop()
    expect(onLock).toHaveBeenCalledTimes(1)
  })

  it('locks again after a full release', () => {
    const { lock, onLock, onRelease } = make()
    lock.stop()
    lock.start()
    lock.stop()
    expect(onLock).toHaveBeenCalledTimes(2)
    expect(onRelease).toHaveBeenCalledTimes(1)
  })
})
