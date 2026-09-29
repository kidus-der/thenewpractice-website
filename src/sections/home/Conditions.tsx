/**
 * 03 — Who We Help (docs/05 §T1, §Reusable blocks "Hairline list"). The
 * client's sentence, then the twelve conditions as a hairline list in one
 * column on the left, and one picture on the right that stays in view while
 * the list passes (sticky from 1024px; between the sentence and the list
 * below it). The client asked for the list to be easier to take in: twelve
 * rows read down one column, and the picture names none of them. Every row
 * is a link to the clinical services index; one travelling glow moves
 * between the rows on pointer and focus (ConditionsList owns that). Sand.
 * Server component apart from the list.
 */
import './Conditions.css'
import type { MediaKey } from '@/content/media'
import type { Section } from '@/content/schemas'
import { SectionHeader } from '@/components/SectionHeader'
import { Reveal } from '@/motion/Reveal'
import { ConditionsList } from './ConditionsList'
import { HomePlate } from './HomePlate'

type Props = Readonly<{
  section: Section
  numeral: string
  href: string
  plate: MediaKey
}>

export function Conditions({ section, numeral, href, plate }: Props) {
  const headingId = `${section.id}-title`
  return (
    <section
      className="conditions"
      id={section.id}
      data-ground="mid"
      data-n={numeral}
      aria-labelledby={headingId}
    >
      <div className="shell grid12 conditions__grid">
        <div className="p-lead conditions__head">
          <SectionHeader n={numeral} label={section.title ?? ''} id={headingId} />
          {section.listHeading && (
            <Reveal as="p" className="t-lead conditions__lead">
              {section.listHeading}
            </Reveal>
          )}
        </div>

        <div className="p-aside conditions__aside">
          <HomePlate media={plate} className="conditions__plate" />
        </div>

        <div className="p-lead conditions__body">
          <ConditionsList items={section.list ?? []} href={href} />
        </div>
      </div>
    </section>
  )
}
