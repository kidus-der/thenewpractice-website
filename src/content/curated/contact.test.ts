import { describe, expect, it } from 'vitest'

import { CONTACT } from '../pages/contact'
import { CONTACT_CURATED, CONTACT_CURATION } from './contact'

const section = (id: string) => CONTACT_CURATED.sections.find((s) => s.id === id)

describe('the contact curation', () => {
  it('resolves every reference and adds no string of ours', () => {
    expect(CONTACT_CURATION.problems).toEqual([])
    expect(CONTACT_CURATION.ours).toEqual([])
  })

  it('keeps the title, the lead and the founder block as the client wrote them', () => {
    expect(CONTACT_CURATED.title).toBe(CONTACT.title)
    expect(CONTACT_CURATED.lead).toBe(CONTACT.lead)
    expect(CONTACT_CURATED.contact).toBe(CONTACT.contact)
  })

  it('renders three sections and cuts Who Contacts Us', () => {
    expect(CONTACT_CURATED.sections.map((s) => s.id)).toEqual([
      'begin-the-conversation',
      'international-services',
      'confidential-consultation',
    ])
  })

  it('keeps two sentences of the opening, the one the picture illustrates first', () => {
    expect(section('begin-the-conversation')?.title).toBe('Begin the Conversation')
    expect(section('begin-the-conversation')?.paragraphs).toEqual([
      'At The New Practice, every enquiry is handled personally, professionally, and with complete confidentiality. If we believe another approach or another organisation would better serve you, we will tell you.',
    ])
  })

  it('keeps one paragraph of International Services and the consultation line', () => {
    expect(section('international-services')?.paragraphs).toEqual([
      'The New Practice is based in Puerto Aventuras, Riviera Maya, Mexico, and works with clients from around the world.',
    ])
    expect(section('confidential-consultation')?.paragraphs).toEqual([
      'To arrange a confidential consultation, please contact:',
    ])
  })
})
