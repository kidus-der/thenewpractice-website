/**
 * 02 — Recovery Without Interruption (docs/05 §T1). The headline in the
 * Didone, the one paragraph the curation keeps, and its closing sentence
 * lifted out as the serif-italic pull line, the site's one emphasis
 * mechanism (docs/03 §2), beside the picture of it. From 1024px the plate
 * holds the left four columns (`.p-aside-start`) and the words sit on the
 * counterweight (`.p-offset`); below, the plate comes between the headline
 * and the paragraph. Bone. Server component.
 */
import './LongRead.css'
import type { MediaKey } from '@/content/media'
import type { Section } from '@/content/schemas'
import { Reveal } from '@/motion/Reveal'
import { splitPullLine } from '@/lib/home'
import { HomePlate } from './HomePlate'

type Props = Readonly<{ section: Section; numeral: string; plate: MediaKey }>

export function LongRead({ section, numeral, plate }: Props) {
  const headingId = `${section.id}-title`
  const body = section.paragraphs.slice(0, -1)
  const closing = splitPullLine(section.paragraphs.at(-1) ?? '')

  return (
    <section
      className="long-read"
      id={section.id}
      data-ground="light"
      data-n={numeral}
      aria-labelledby={headingId}
    >
      <div className="shell grid12 long-read__grid">
        <div className="p-offset long-read__head">
          <p className="eyebrow t-eyebrow" aria-hidden="true">
            <span>{numeral}</span>
            <span className="eyebrow__rule" />
          </p>
          <Reveal variant="lines" as="h2" id={headingId} className="t-d2 long-read__title">
            {section.title}
          </Reveal>
        </div>

        <HomePlate media={plate} className="p-aside-start long-read__plate" />

        <div className="p-offset long-read__body">
          <Reveal staggerChildren className="long-read__prose">
            {body.map((text) => (
              <p key={text} className="t-body">
                {text}
              </p>
            ))}
            <p className="t-body">{closing.body}</p>
          </Reveal>
          {closing.pull && (
            // a single masked wipe: `lines` would label the <p>, which axe forbids
            <Reveal variant="mask" as="p" className="long-read__pull">
              {closing.pull}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
