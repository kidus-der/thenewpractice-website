/**
 * T7 — Enquiry (`/contact`). docs/05 §T7; plan §3.3.
 *
 * A private letter, not a lead form. Two sections on canopy: a short title
 * page (the eyebrow, the client's *Begin the Conversation* as the h1, the
 * lead), then the split: the form on a bone sheet in the right half, begun
 * inside the first viewport, and beside it the letter in the left column:
 * the opening's paragraphs, the picture, the remaining sections and
 * *Confidential Consultation* with the founder's details. The sheet comes
 * first in the DOM, so below 1024px the form follows the title page and the
 * letter follows the form (round 1, R4d: less friction).
 *
 * Server component. Every word is the client's (the page as curated,
 * brand.ts) except the form's interface copy (content/enquiry.ts); the
 * picture is the route's.
 */
import './EnquiryTemplate.css'
import { SectionHeader } from '@/components/SectionHeader'
import { ENQUIRY } from '@/content/enquiry'
import type { MediaKey } from '@/content/media'
import type { ContactBlock, ContactPage, Section } from '@/content/schemas'
import { mailHref, telHref } from '@/lib/contact'
import { Reveal, type RevealVariant } from '@/motion/Reveal'
import { PlateFigure } from '@/sections/PlateFigure'
import { EnquiryForm } from './EnquiryForm'

const OPENING_ID = 'begin-the-conversation'
const CONSULTATION_ID = 'confidential-consultation'
const TITLE_ID = 'contact-title'
const FORM_HEADING_ID = 'contact-form-heading'

/**
 * The lead, and the opening's paragraphs at the head of the letter, sit in
 * the first viewport and can be the LCP on this route (docs/09 §Measured
 * budgets): a clip reveal is credited at first paint, as the h1's line masks
 * are; the default rise is credited only after its tween, past the veil. The
 * rest of the letter keeps the rise (Task 20, Task 21).
 */
const OPENING_REVEAL: RevealVariant = 'mask'

/** The letter column is five of twelve from 1024px; the 3:4 plate is capped to part of it (CSS). */
const PLATE_SIZES = '(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 70vw'

const numeral = (index: number): string => String(index + 1).padStart(2, '0')

function Paragraphs({ text, variant }: { text: readonly string[]; variant?: RevealVariant }) {
  if (text.length === 0) return null
  return (
    <Reveal staggerChildren variant={variant} className="contact__prose">
      {text.map((paragraph) => (
        <p className="t-body" key={paragraph}>
          {paragraph}
        </p>
      ))}
    </Reveal>
  )
}

function LetterSection({ section, n }: { section: Section; n: string }) {
  const headingId = `contact-${section.id}`
  return (
    <div className="contact__block" role="group" aria-labelledby={headingId}>
      <SectionHeader n={n} label={section.title ?? ''} id={headingId} />
      <Paragraphs text={section.paragraphs} />
      {section.listHeading && (
        <Reveal as="p" className="t-body contact__list-heading">
          {section.listHeading}
        </Reveal>
      )}
      {section.list && (
        <Reveal as="ul" staggerChildren className="contact__list t-body">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Reveal>
      )}
      {section.outro && <Paragraphs text={section.outro} />}
    </div>
  )
}

function Founder({ contact }: { contact: ContactBlock }) {
  return (
    <Reveal as="address" className="contact__founder t-body">
      <p>
        {contact.name}
        {contact.credentials ? `, ${contact.credentials}` : ''}
      </p>
      <p className="muted">{contact.role}</p>
      <p className="contact__founder-links">
        <a className="link" href={telHref(contact.phone)}>
          {contact.phone}
        </a>
        <a className="link" href={mailHref(contact.email)}>
          {contact.email}
        </a>
      </p>
      <p className="muted contact__founder-location">
        {contact.locale.split(', ').map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </Reveal>
  )
}

type Props = {
  page: ContactPage
  /** The picture beside the form, under the opening's paragraphs. */
  plate?: MediaKey
}

export function EnquiryTemplate({ page, plate }: Props) {
  const opening = page.sections.find((s) => s.id === OPENING_ID)
  const consultation = page.sections.find((s) => s.id === CONSULTATION_ID)
  const letter = page.sections.filter((s) => s.id !== OPENING_ID && s.id !== CONSULTATION_ID)

  return (
    <main id="main">
      <section className="contact-open" data-ground="dark" data-n="01" aria-labelledby={TITLE_ID}>
        <div className="shell grid12">
          <div className="p-lead contact-open__inner">
            <p className="eyebrow t-eyebrow">
              <span className="eyebrow__rule" aria-hidden="true" />
              <span>{page.title}</span>
            </p>
            <Reveal as="h1" variant="lines" id={TITLE_ID} className="t-d1 contact-open__title">
              {opening?.title ?? page.title}
            </Reveal>
            <Reveal as="p" variant={OPENING_REVEAL} className="t-lead contact-open__lead">
              {page.lead}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="contact" data-ground="dark" data-n="02" aria-label={ENQUIRY.sectionLabel}>
        <div className="shell contact__grid">
          <Reveal variant="fade" className="contact__sheet">
            <div className="contact__sheet-inner" data-surface="light">
              <h2 id={FORM_HEADING_ID} className="t-eyebrow contact__sheet-heading">
                {ENQUIRY.formHeading}
              </h2>
              <EnquiryForm headingId={FORM_HEADING_ID} />
            </div>
          </Reveal>

          <div className="contact__letter">
            {opening && <Paragraphs text={opening.paragraphs} variant={OPENING_REVEAL} />}
            {plate && <PlateFigure media={plate} sizes={PLATE_SIZES} className="contact__plate" />}
            {letter.map((section, index) => (
              <LetterSection section={section} n={numeral(index)} key={section.id} />
            ))}
            <div className="contact__consult">
              {consultation && <LetterSection section={consultation} n={numeral(letter.length)} />}
              <Founder contact={page.contact} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
