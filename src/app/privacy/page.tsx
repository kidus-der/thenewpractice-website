/** /privacy — PLACEHOLDER stub until the client's counsel supplies the policy (CONTENT-GAPS G3). */
import type { Metadata } from 'next'
import { PRIVACY } from '@/content/pages/legal'
import { LegalStub, legalMetadata } from '@/templates/LegalStub'

export const metadata: Metadata = legalMetadata('privacy')

export default function Page() {
  return <LegalStub route="privacy" page={PRIVACY} />
}
