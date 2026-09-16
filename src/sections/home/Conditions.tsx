/**
 * 03 — Who We Help (docs/05 §T1, §Reusable blocks "Hairline list"). The
 * client's sentence, then the twelve conditions as a hairline two-column
 * list on sand; every row is a link to the clinical services index. One
 * travelling glow moves between the rows on pointer and focus
 * (ConditionsList owns that). Server component apart from the list.
 */
import './Conditions.css'
import type { Section } from '@/content/schemas'
import { SectionHeader } from '@/components/SectionHeader'
import { Reveal } from '@/motion/Reveal'
import { ConditionsList } from './ConditionsList'

type Props = Readonly<{
  section: Section
  numeral: string
  href: string
}>

export function Conditions({ section, numeral, href }: Props) {
  const headingId = `${section.id}-title`
  return (
    <section
      className="conditions"
      id={section.id}
      data-ground="mid"
      data-n={numeral}
      aria-labelledby={headingId}
    >
      <div className="shell grid12">
        <div className="p-lead conditions__head">
          <SectionHeader n={numeral} label={section.title ?? ''} id={headingId} />
          {section.listHeading && (
            <Reveal as="p" className="t-lead conditions__lead">
              {section.listHeading}
            </Reveal>
          )}
        </div>
      </div>

      <div className="shell">
        <ConditionsList items={section.list ?? []} href={href} />
      </div>
    </section>
  )
}
