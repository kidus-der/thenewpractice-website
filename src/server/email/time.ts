/**
 * When a submission reached the website, on the practice's clock
 * (America/Cancun, no daylight saving), e.g.
 * "Tuesday, 29 September 2026 at 09:05, Riviera Maya time".
 */
import { EMAIL, PRACTICE_TIME_ZONE } from '@/content/email'

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: PRACTICE_TIME_ZONE,
  dateStyle: 'full',
  timeStyle: 'short',
})

export function formatPracticeTime(date: Date): string {
  return `${FORMAT.format(date)}, ${EMAIL.timeZoneNote}`
}
