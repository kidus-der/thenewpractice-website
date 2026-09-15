import { z } from 'zod'

/**
 * Runtime configuration, read once and validated with Zod.
 *
 * Every deployment target declares what it is through SITE_ENV. Only
 * `production` may be indexed; staging and development are noindex and serve
 * a disallow-all robots.txt (docs/BUILD-LEDGER.md task 6). The variables are
 * documented in `.env.example`; the Vercel project carries the staging values.
 *
 * Read on the server only. `NEXT_PUBLIC_SITE_URL` is the one value Next also
 * inlines into client bundles, which is why it is referenced by its full
 * literal name below rather than through a loop.
 */

const SITE_ENVS = ['development', 'staging', 'production'] as const
const DEFAULT_SITE_ENV = 'development'
const DEFAULT_SITE_URL = 'http://localhost:3000'

const TRAILING_SLASHES = /\/+$/

const envSchema = z.object({
  SITE_ENV: z.enum(SITE_ENVS).default(DEFAULT_SITE_ENV),
  NEXT_PUBLIC_SITE_URL: z
    .url({ protocol: /^https?$/ })
    .default(DEFAULT_SITE_URL)
    .transform((url) => url.replace(TRAILING_SLASHES, '')),
  // Task 15 (enquiry form): mail adapter credentials and recipient. Absent on
  // staging until the client's Resend account exists; the adapter logs instead.
  RESEND_API_KEY: z.string().min(1).optional(),
  ENQUIRY_TO_EMAIL: z.email().optional(),
  // Verified sending address; defaults to enquiries@<site host> (mail.adapter.ts).
  ENQUIRY_FROM_EMAIL: z.email().optional(),
})

export type Env = z.infer<typeof envSchema>
export type SiteEnv = Env['SITE_ENV']

type RawEnv = Readonly<Record<string, string | undefined>>

/** Hosting dashboards store a cleared variable as "", which must mean "unset". */
const withoutEmptyStrings = (raw: RawEnv): RawEnv =>
  Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined && value !== ''))

/**
 * Pure: validates a plain record and returns the typed configuration, or
 * throws with every offending variable named. Exported for tests and for any
 * script that needs to validate a file rather than the live process.
 */
export function parseEnv(raw: RawEnv): Env {
  const result = envSchema.safeParse(withoutEmptyStrings(raw))
  if (result.success) return result.data
  throw new Error(`Invalid environment configuration.\n${z.prettifyError(result.error)}`)
}

const readProcessEnv = (): RawEnv => ({
  SITE_ENV: process.env.SITE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ENQUIRY_TO_EMAIL: process.env.ENQUIRY_TO_EMAIL,
  ENQUIRY_FROM_EMAIL: process.env.ENQUIRY_FROM_EMAIL,
})

let cached: Env | undefined

/** The validated configuration for this process; parsed on first call, then memoised. */
export function env(): Env {
  cached ??= parseEnv(readProcessEnv())
  return cached
}

/** Search engines may index this deployment only when it is the production site. */
export const isIndexable = (): boolean => env().SITE_ENV === 'production'

/** Test hook: forget the memoised value so the next `env()` re-reads `process.env`. */
export function resetEnvCache(): void {
  cached = undefined
}
