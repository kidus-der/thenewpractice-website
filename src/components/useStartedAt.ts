'use client'

import { useState, useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * Epoch milliseconds of the first client render, "" on the server and until
 * hydration. Read through useSyncExternalStore so the server markup and the
 * hydration pass agree and the stamp is taken once per mount. The forms send
 * it as their timing token (src/server/enquiry.schema.ts `checkTiming`).
 */
export function useStartedAt(): string {
  const [clock] = useState(() => {
    let stamp = ''
    return {
      get: () => {
        if (stamp === '') stamp = String(Date.now())
        return stamp
      },
      server: () => '',
    }
  })
  return useSyncExternalStore(noop, clock.get, clock.server)
}
