/** /terms — PLACEHOLDER stub until the client's counsel supplies the terms (CONTENT-GAPS G3). */
import type { Metadata } from 'next'
import { TERMS } from '@/content/pages/legal'
import { LegalStub, legalMetadata } from '@/templates/LegalStub'

export const metadata: Metadata = legalMetadata('terms')

export default function Page() {
  return <LegalStub route="terms" page={TERMS} />
}
