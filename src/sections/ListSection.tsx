/**
 * A section whose body is a list (docs/05 §T3): the eyebrow lockup and a
 * heading in the reading column, the list beneath at the standing `.p-list`
 * placement so its numerals align with the eyebrow numerals above. Two
 * heading registers: `display` sets the document's own introducing sentence
 * ("We provide treatment for:") in the Didone at --t-d3 with a `lines`
 * reveal; `eyebrow` sets a short interface label ("Related services") the
 * way the index template's list section does. Server component.
 */
import type { ReactNode } from 'react'
import './ListSection.css'
import { SectionHeader } from '@/components/SectionHeader'
import { Reveal } from '@/motion/Reveal'
import type { Ground } from './ContentSection'

type Props = {
  id: string
  numeral: string
  ground?: Ground
  heading: string
  register?: 'display' | 'eyebrow'
  children: ReactNode
}

export function ListSection({
  id,
  numeral,
  ground = 'light',
  heading,
  register = 'display',
  children,
}: Props) {
  const titleId = `${id}-title`
  return (
    <section
      id={id}
      className="list-section"
      data-ground={ground}
      data-n={numeral}
      aria-labelledby={titleId}
    >
      <div className="shell grid12">
        <div className="p-lead list-section__head">
          {register === 'eyebrow' ? (
            <SectionHeader n={numeral} label={heading} id={titleId} />
          ) : (
            <>
              <p className="eyebrow t-eyebrow list-section__eyebrow" aria-hidden="true">
                <span>{numeral}</span>
                <span className="eyebrow__rule" />
              </p>
              <Reveal variant="lines" as="h2" id={titleId} className="t-d3 list-section__heading">
                {heading}
              </Reveal>
            </>
          )}
        </div>
        <div className="p-list list-section__list">{children}</div>
      </div>
    </section>
  )
}
