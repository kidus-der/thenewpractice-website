/**
 * 04 — Our Philosophy (docs/05 §T1, §Reusable blocks "Sticky-index
 * pillars"). The five pillars as the concept site's method block: the index
 * sticky in the left column from 1024px (StickyIndex, shared with the
 * interior template), the panels on the right — numeral, term in the
 * Didone, the client's sentence beneath. No icons, no cards. Then the
 * manifesto, "Why The New Practice?", nested as the section's one
 * subsection. Canopy throughout. Server component; the index and the
 * manifesto own the client code.
 */
import './Philosophy.css'
import type { Section } from '@/content/schemas'
import { SectionHeader } from '@/components/SectionHeader'
import { StickyIndex } from '@/sections/StickyIndex'
import { Reveal } from '@/motion/Reveal'
import { numeral as pad } from '@/lib/interior'
import { Manifesto } from './Manifesto'

type Props = Readonly<{
  section: Section
  manifesto: Section
  numeral: string
  indexLabel: string
}>

const pillarId = (sectionId: string, index: number): string => `${sectionId}-pillar-${index + 1}`

export function Philosophy({ section, manifesto, numeral, indexLabel }: Props) {
  const headingId = `${section.id}-title`
  const pillars = section.definitions ?? []
  const items = pillars.map((pillar, i) => ({
    id: pillarId(section.id, i),
    title: pillar.term,
    numeral: pad(i + 1),
  }))

  return (
    <section
      className="philosophy"
      id={section.id}
      data-ground="dark"
      data-n={numeral}
      aria-labelledby={headingId}
    >
      <div className="shell grid12">
        <div className="p-lead">
          <SectionHeader n={numeral} label={section.title ?? ''} id={headingId} />
        </div>
      </div>

      <div className="shell grid12 philosophy__body">
        <div className="philosophy__index">
          <StickyIndex items={items} label={indexLabel} />
        </div>

        <ol className="philosophy__panels">
          {pillars.map((pillar, i) => (
            <li className="philosophy__panel" id={pillarId(section.id, i)} key={pillar.term}>
              <Reveal>
                <span className="philosophy__numeral t-eyebrow" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <h3 className="t-d3 philosophy__term">{pillar.term}</h3>
                <p className="t-body philosophy__description">{pillar.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      <Manifesto section={manifesto} numeral={numeral} />
    </section>
  )
}
