/**
 * The self-assessment result (docs/05 §Self-assessment; round 1, R5). A
 * rule, the average severity, the band in the client's own label, the
 * questionnaire's interpretation, the series' full *Important Disclaimer*,
 * then *A Confidential Consultation* and the Enquire action. Focused on
 * mount (it is `role="status"` with `tabIndex={-1}`), and brought into view
 * without the browser's own jump so the page scroll stays the site's.
 *
 * Rendered only by AssessmentForm, once every question is answered and the
 * visitor asks for the result.
 */
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { NavItem, Section } from '@/content/schemas'
import { scoreLabel, type ScoringBand } from '@/lib/assessment'
import { Reveal } from '@/motion/Reveal'
import { scrollTo } from '@/motion/SmoothScroll'
import { D } from '@/motion/tokens'

/** The result's rule sits this far below the top of the viewport once in view. */
const VIEW_OFFSET_VH = 0.18

export type ResultProps = {
  average: number
  band: ScoringBand
  interpretation: string
  disclaimer: Section
  consultation: Section
  enquire: NavItem
}

function Prose({ section, className }: { section: Section; className: string }) {
  return (
    <Reveal staggerChildren className={className}>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </Reveal>
  )
}

export function AssessmentResult({
  average,
  band,
  interpretation,
  disclaimer,
  consultation,
  enquire,
}: ResultProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus({ preventScroll: true })
    const top = el.getBoundingClientRect().top + window.scrollY
    scrollTo(Math.max(0, top - window.innerHeight * VIEW_OFFSET_VH), 0, D.slow)
  }, [])

  return (
    <div className="assessment__result" role="status" tabIndex={-1} ref={ref}>
      <p className="assessment__score t-eyebrow">{scoreLabel(average)}</p>
      <Reveal variant="lines" as="h2" className="t-d2 assessment__band">
        {band.label}
      </Reveal>
      {band.description && (
        <Reveal as="p" className="t-lead assessment__band-description">
          {band.description}
        </Reveal>
      )}
      <Reveal as="p" className="t-body assessment__interpretation">
        {interpretation}
      </Reveal>

      <div className="assessment__note">
        {disclaimer.title && (
          <h3 className="t-eyebrow assessment__note-title">{disclaimer.title}</h3>
        )}
        <Prose section={disclaimer} className="t-small assessment__note-prose" />
      </div>

      <div className="assessment__consultation">
        {consultation.title && (
          <Reveal variant="lines" as="h3" className="t-d3 assessment__consultation-title">
            {consultation.title}
          </Reveal>
        )}
        <Prose section={consultation} className="t-body assessment__prose" />
        <Reveal className="assessment__enquire">
          <Link className="line-action t-eyebrow" href={enquire.href}>
            {enquire.label}
          </Link>
        </Reveal>
      </div>
    </div>
  )
}
