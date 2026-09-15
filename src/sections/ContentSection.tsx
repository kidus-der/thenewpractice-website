/**
 * One `sectionSchema` entry as a long-read section (docs/05 §T2, docs/06
 * §Schema rules). The render order is the document's and is fixed:
 * title → subtitle → header → [figure] → paragraphs → listHeading → list →
 * outro → definitions → subsections (one level) → signature.
 *
 * Title in the Didone at --t-d2 arriving line by line; subtitle at --t-d3;
 * the document's one `Header:` line as a serif-italic line; body at 62ch;
 * the list as a hairline two-column list from 1024px; definitions as a
 * hairline list of term and description; the signature right-aligned.
 * Server component; the reveals are the only client code.
 *
 * Two extensions for the letter and statement pages (Task 18): `register`
 * sets the prose at `--t-lead` instead of `--t-body`, and `body` replaces the
 * section's prose with a block of the route's choosing (the process page's
 * timeline). An untitled section carries no eyebrow: the numeral is a label
 * for a heading, and alone it is decoration.
 */
import type { ReactNode } from 'react'
import './ContentSection.css'
import type { MediaKey } from '@/content/media'
import type { Section, Signature } from '@/content/schemas'
import { Reveal } from '@/motion/Reveal'
import { PlateFigure } from './PlateFigure'

export type Ground = 'light' | 'mid'
export type PlateMap = Readonly<Record<string, MediaKey>>
/** The prose size: the long-read body, or the lead register for a letter or a statement. */
export type Register = 'body' | 'lead'

const PROSE_CLASS: Readonly<Record<Register, string>> = {
  body: 't-body',
  lead: 't-lead content-section__prose-lead',
}

/** The body column is seven of twelve from 1024px (InteriorTemplate.css). */
const PLATE_SIZES = '(min-width: 1024px) 58vw, 100vw'

type Props = {
  section: Section
  numeral: string
  ground?: Ground
  plates?: PlateMap
  /** A figure placed between the headings and the prose (the About ceiba). */
  figure?: ReactNode
  /** A block that stands in for the section's prose (the process timeline). */
  body?: ReactNode
  register?: Register
}

type ProseProps = { items: readonly string[]; register: Register; className?: string }

function Paragraphs({ items, register, className }: ProseProps) {
  if (!items.length) return null
  return (
    <Reveal staggerChildren className={className ?? 'content-section__prose'}>
      {items.map((text) => (
        <p key={text} className={PROSE_CLASS[register]}>
          {text}
        </p>
      ))}
    </Reveal>
  )
}

function HairlineList({ heading, items }: { heading?: string; items: readonly string[] }) {
  return (
    <div className="content-section__list-block">
      {heading && (
        <Reveal as="p" className="t-body content-section__list-heading">
          {heading}
        </Reveal>
      )}
      <Reveal as="ul" staggerChildren className="content-section__list">
        {items.map((item) => (
          <li key={item} className="t-body">
            {item}
          </li>
        ))}
      </Reveal>
    </div>
  )
}

function Definitions({ items }: { items: Section['definitions'] }) {
  if (!items?.length) return null
  return (
    <dl className="content-section__definitions">
      {items.map((d) => (
        <Reveal key={d.term} className="content-section__definition">
          <dt className="t-d3">{d.term}</dt>
          <dd className="t-body">{d.description}</dd>
        </Reveal>
      ))}
    </dl>
  )
}

function SignatureBlock({ signature }: { signature: Signature }) {
  return (
    <Reveal as="p" className="content-section__signature">
      {signature.valediction && (
        <span className="content-section__signature-valediction t-body">
          {signature.valediction}
        </span>
      )}
      <span className="content-section__signature-name">
        {signature.name}
        {signature.credentials && `, ${signature.credentials}`}
      </span>
      <span className="content-section__signature-role t-eyebrow">{signature.role}</span>
      {signature.organisation && (
        <span className="content-section__signature-role t-eyebrow">{signature.organisation}</span>
      )}
    </Reveal>
  )
}

type BodyProps = { section: Section; plates?: PlateMap; register: Register }

/** Everything after the headings, in document order. */
function SectionBody({ section, plates, register }: BodyProps) {
  const plate = plates?.[section.id]
  return (
    <>
      {plate && (
        <PlateFigure media={plate} sizes={PLATE_SIZES} className="content-section__plate" />
      )}
      <Paragraphs items={section.paragraphs} register={register} />
      {section.list?.length ? (
        <HairlineList heading={section.listHeading} items={section.list} />
      ) : null}
      {section.outro?.length ? <Paragraphs items={section.outro} register={register} /> : null}
      <Definitions items={section.definitions} />
    </>
  )
}

function Subsection({ section, plates, register }: BodyProps) {
  const titleId = `${section.id}-title`
  return (
    <section id={section.id} className="content-section__sub" aria-labelledby={titleId}>
      {section.title && (
        <Reveal variant="lines" as="h3" id={titleId} className="t-d3 content-section__sub-title">
          {section.title}
        </Reveal>
      )}
      {section.subtitle && (
        <Reveal as="h4" className="t-lead content-section__subtitle">
          {section.subtitle}
        </Reveal>
      )}
      <SectionBody section={section} plates={plates} register={register} />
    </section>
  )
}

export function ContentSection({
  section,
  numeral,
  ground = 'light',
  plates,
  figure,
  body,
  register = 'body',
}: Props) {
  const titleId = `${section.id}-title`
  return (
    <section
      id={section.id}
      className="content-section"
      data-ground={ground}
      data-n={numeral}
      aria-labelledby={section.title ? titleId : undefined}
    >
      <div className="shell grid12">
        <div className="content-section__body">
          {section.title && (
            <p className="eyebrow t-eyebrow content-section__eyebrow" aria-hidden="true">
              <span>{numeral}</span>
              <span className="eyebrow__rule" />
            </p>
          )}
          {section.title && (
            <Reveal variant="lines" as="h2" id={titleId} className="t-d2 content-section__title">
              {section.title}
            </Reveal>
          )}
          {section.subtitle && (
            <Reveal as="h3" className="t-d3 content-section__subtitle">
              {section.subtitle}
            </Reveal>
          )}
          {section.header && (
            <Reveal as="p" className="t-lead content-section__header">
              {section.header}
            </Reveal>
          )}
          {figure && <div className="content-section__figure">{figure}</div>}
          {body ?? <SectionBody section={section} plates={plates} register={register} />}
          {section.subsections?.map((sub) => (
            <Subsection key={sub.id} section={sub} plates={plates} register={register} />
          ))}
          {section.signature && <SignatureBlock signature={section.signature} />}
        </div>
      </div>
    </section>
  )
}
