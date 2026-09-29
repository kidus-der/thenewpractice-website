/**
 * What the two server actions return to their forms, with no dependencies,
 * so the client components can import the initial states without pulling
 * the handlers, the email templates or the mail SDK into their bundles.
 */
export type FormResult<Field extends string> =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'invalid'; fieldErrors: Partial<Record<Field, string>> }
  | { status: 'failed' }

export const IDLE = { status: 'idle' } as const
export const SENT = { status: 'sent' } as const
export const FAILED = { status: 'failed' } as const
