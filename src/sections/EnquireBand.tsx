/**
 * The closing band every template ends on (docs/05 §Reusable blocks
 * "Enquire", docs/02 §Ground rhythm): canopy, one line, one line action. The
 * line is the client's own — "Every enquiry is handled with complete
 * confidentiality." — read from the home page's closing section exactly as
 * the footer reads it, so the document stays the single source; if the
 * ingestion moves that sentence, the band renders the action alone rather
 * than an invented line. Server component.
 */
import Link from 'next/link'
import './EnquireBand.css'
import { NAV } from '@/content/nav'
import { HOME } from '@/content/pages/home'
import { Reveal } from '@/motion/Reveal'

const CONFIDENTIALITY_SECTION = 'begin-the-conversation'
const CONFIDENTIALITY_PARAGRAPH = 1

function confidentialityLine(): string | undefined {
  const section = HOME.sections.find((s) => s.id === CONFIDENTIALITY_SECTION)
  return section?.paragraphs[CONFIDENTIALITY_PARAGRAPH]
}

type Props = { numeral: string; id?: string }

export function EnquireBand({ numeral, id = 'enquire-band' }: Props) {
  const line = confidentialityLine()
  const [action] = NAV.utility
  if (!action) throw new Error('nav.ts has no utility item for the enquire band')
  const headingId = `${id}-title`

  return (
    <section
      id={id}
      className="enquire-band"
      data-ground="dark"
      data-n={numeral}
      aria-labelledby={line ? headingId : undefined}
      aria-label={line ? undefined : action.label}
    >
      <div className="shell grid12">
        <div className="p-lead enquire-band__copy">
          <p className="eyebrow t-eyebrow" aria-hidden="true">
            <span>{numeral}</span>
            <span className="eyebrow__rule" />
          </p>
          {line && (
            <Reveal variant="lines" as="h2" id={headingId} className="t-d2 enquire-band__line">
              {line}
            </Reveal>
          )}
          <Reveal className="enquire-band__action">
            <Link className="line-action t-eyebrow" href={action.href}>
              {action.label}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
