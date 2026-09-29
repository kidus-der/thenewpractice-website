/**
 * The process's mail adapter and the website's host, from the validated
 * environment, shared by both server actions (enquiry, assessment). Created
 * on first use and kept for the life of the process.
 */
import { env } from '@/lib/env'
import { createMailAdapter, type MailAdapter } from './mail.adapter'

let adapter: MailAdapter | undefined

export function mailAdapter(): MailAdapter {
  adapter ??= createMailAdapter(env())
  return adapter
}

/** "thenewpractice.health", named in each email's footer. */
export function siteHost(): string {
  return new URL(env().NEXT_PUBLIC_SITE_URL).host
}
