import { describe, expect, it } from 'vitest'

import { ASSESSMENTS } from '@/content/assessments'
import { answerTypesFor } from '@/content/assessment-answers'
import { ASSESSMENT_SEND } from '@/content/assessment-send'
import { EMAIL } from '@/content/email'
import { ENQUIRY } from '@/content/enquiry'
import type { FactAnswer } from '@/lib/assessment'
import { answerLabel, assessmentSubject, renderAssessmentEmail } from './assessment.email'
import { enquirySubject, renderEnquiryEmail, type EnquiryEmailInput } from './enquiry.email'
import { MARK_SRC, escapeHtml, escapeMultiline, fill } from './layout'
import { formatPracticeTime } from './time'

/** 15:05 UTC is 10:05 in Cancun (UTC−5 all year). */
const RECEIVED = new Date('2026-09-29T15:05:00Z')
const OPTIONS = { receivedAt: RECEIVED, site: 'thenewpractice.health' }

const ENQUIRY_FIXTURE: EnquiryEmailInput = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  telephone: '+44 20 7946 0958',
  enquiringFor: 'family',
  message: 'A few words about the situation.\nSecond line.',
  preferredContact: 'telephone',
}

const ATTACK = `<script>alert(1)</script><img src=x onerror="alert(2)">'"&`

/** Every <tag attr="…"> the HTML contains that a person's text could have produced. */
const DANGEROUS = [/<script/i, /<img[^>]+onerror/i, /\sonerror="/i, /javascript:/i, /<iframe/i]

const alcohol = ASSESSMENTS.find((a) => a.slug === 'alcohol')
if (!alcohol) throw new Error('fixture: no alcohol questionnaire')
const types = answerTypesFor('alcohol')
const ANSWERS: readonly (FactAnswer | number)[] = types.map((type, i) =>
  type === 'scale' ? (i % 10) + 1 : i % 2 ? 'yes' : 'no'
)
const band = alcohol.scoring.bands[1]
if (!band) throw new Error('fixture: no second band')

const ASSESSMENT_FIXTURE = {
  title: alcohol.title,
  questions: alcohol.questions,
  answers: ANSWERS,
  average: 5.4,
  bandLabel: band.label,
  contact: {
    name: 'Grace Hopper',
    email: 'grace@example.com',
    telephone: '+1 555 010 0199',
    preferredContact: 'email' as const,
  },
}

describe('escapeHtml', () => {
  it('escapes the five characters that open markup or leave an attribute', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    )
  })

  it('keeps line breaks as <br> after escaping, never before', () => {
    expect(escapeMultiline('one\r\ntwo\n<b>three</b>')).toBe(
      'one<br>two<br>&lt;b&gt;three&lt;/b&gt;'
    )
  })

  it('fills tokens and leaves unknown ones', () => {
    expect(fill('{a} and {b}', { a: 1 })).toBe('1 and {b}')
  })
})

describe('formatPracticeTime', () => {
  it('reads the practice clock, America/Cancun, and says so', () => {
    expect(formatPracticeTime(RECEIVED)).toBe(
      `Tuesday, 29 September 2026 at 10:05, ${EMAIL.timeZoneNote}`
    )
  })
})

describe('renderEnquiryEmail', () => {
  it('lists every field under its label in HTML and text, the message last', () => {
    const { subject, html, text } = renderEnquiryEmail(ENQUIRY_FIXTURE, OPTIONS)

    expect(subject).toBe(`${ENQUIRY.mail.subject}: ${ENQUIRY.mail.subjectLabels.family}`)
    for (const part of [html, text]) {
      const labels = { ...ENQUIRY.fields, telephone: ASSESSMENT_SEND.fields.telephone }
      for (const label of Object.values(labels)) expect(part).toContain(escapeHtml(label))
      expect(part).not.toContain(ENQUIRY.fields.telephone)
      expect(part).toContain(ENQUIRY.options.enquiringFor.family)
      expect(part).toContain(ENQUIRY.options.preferredContact.telephone)
      expect(part).toContain('10:05')
    }
    expect(text.indexOf(ENQUIRY.fields.message)).toBeGreaterThan(text.indexOf(EMAIL.received))
    expect(text).toContain(ENQUIRY_FIXTURE.message)
    expect(html).toContain('A few words about the situation.<br>Second line.')
    expect(html).toContain('href="mailto:ada@example.com"')
    expect(html).toContain('href="tel:+442079460958"')
  })

  it('omits the telephone when none was given', () => {
    const { html, text } = renderEnquiryEmail({ ...ENQUIRY_FIXTURE, telephone: undefined }, OPTIONS)

    expect(html).not.toContain(`>${ASSESSMENT_SEND.fields.telephone}<`)
    expect(text).not.toContain(`${ASSESSMENT_SEND.fields.telephone}:`)
  })

  it('cannot be made to carry markup through any field', () => {
    const hostile: EnquiryEmailInput = {
      ...ENQUIRY_FIXTURE,
      name: ATTACK,
      email: `x"onmouseover="alert(3)@example.com`,
      telephone: ATTACK,
      message: `${ATTACK}\n${ATTACK}`,
    }
    const { html, subject } = renderEnquiryEmail(hostile, OPTIONS)

    for (const pattern of DANGEROUS) expect(html).not.toMatch(pattern)
    expect(html).not.toContain('"onmouseover=')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(subject).not.toContain('<')
  })

  it('loads nothing from the network: no remote src, no link but mailto: and tel:', () => {
    const { html } = renderEnquiryEmail(ENQUIRY_FIXTURE, OPTIONS)

    const sources = [...html.matchAll(/\ssrc="([^"]*)"/g)].map((m) => m[1])
    expect(sources).toEqual([MARK_SRC])
    const hrefs = [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1] ?? '')
    expect(hrefs.every((href) => /^(mailto|tel):/.test(href))).toBe(true)
    expect(html).not.toMatch(/url\(|@import|<link/i)
  })

  it('uses the preview mark when one is passed', () => {
    const { html } = renderEnquiryEmail(ENQUIRY_FIXTURE, { ...OPTIONS, markSrc: 'data:x' })

    expect(html).toContain('src="data:x"')
  })

  it('subject reads the enquiring-for label with no dash', () => {
    expect(enquirySubject({ enquiringFor: 'self' })).toBe('Enquiry: Self')
  })
})

describe('renderAssessmentEmail', () => {
  it('carries the title, score, band, contact details, time and every answer in order', () => {
    const { subject, html, text } = renderAssessmentEmail(ASSESSMENT_FIXTURE, OPTIONS)

    expect(subject).toBe(assessmentSubject(alcohol.title))
    expect(subject).toBe(`${EMAIL.assessment.subject}: ${alcohol.title}`)
    for (const part of [html, text]) {
      expect(part).toContain(escapeHtml(alcohol.title))
      expect(part).toContain('Average severity 5.4 of 10')
      expect(part).toContain(band.label)
      expect(part).toContain('Grace Hopper')
      expect(part).toContain('grace@example.com')
      expect(part).toContain('+1 555 010 0199')
      expect(part).toContain(ENQUIRY.options.preferredContact.email)
      expect(part).toContain('10:05')
      expect(part).toContain(escapeHtml(fill(EMAIL.replyNote, { name: 'Grace Hopper' })))
    }
    const positions = alcohol.questions.map((q) => text.indexOf(q))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    ANSWERS.forEach((answer, i) => {
      const line = text.slice(positions[i], positions[i + 1] ?? undefined)
      expect(line).toContain(answerLabel(answer))
    })
    expect(html.match(/<tr><td width="32"/g)).toHaveLength(alcohol.questions.length)
  })

  it('labels a scale answer against the scale and a fact answer by its word', () => {
    expect(answerLabel(7)).toBe('7 of 10')
    expect(answerLabel('maybe')).toBe('Maybe')
  })

  it('says to reply by telephone when no email was given', () => {
    const { html, text } = renderAssessmentEmail(
      {
        ...ASSESSMENT_FIXTURE,
        contact: { name: 'G', telephone: '+1 555 010 0199', preferredContact: 'telephone' },
      },
      OPTIONS
    )

    expect(text).toContain(EMAIL.assessment.noEmailNote)
    expect(html).not.toContain(`>${ASSESSMENT_SEND.fields.email}<`)
  })

  it('cannot be made to carry markup through the contact details', () => {
    const { html } = renderAssessmentEmail(
      {
        ...ASSESSMENT_FIXTURE,
        contact: { ...ASSESSMENT_FIXTURE.contact, name: ATTACK, telephone: ATTACK },
      },
      OPTIONS
    )

    for (const pattern of DANGEROUS) expect(html).not.toMatch(pattern)
  })

  it('refuses a sheet whose answers do not match its questions', () => {
    expect(() =>
      renderAssessmentEmail({ ...ASSESSMENT_FIXTURE, answers: ANSWERS.slice(1) }, OPTIONS)
    ).toThrow(/15 questions, 14 answers/)
  })
})
