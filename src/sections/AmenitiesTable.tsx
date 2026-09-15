/**
 * The amenities as a hairline table (docs/05 §T5): one row per amenity, the
 * row's numeral in the eyebrow register and the amenity in body, 1px rules
 * between rows and nothing else — no zebra, no borders, no icons. Two
 * columns from 768px. The markup is an ordered list, because the content is
 * a list of labels with no values; the day the client supplies pairs, the
 * rows become a <table> without a visual change. Server component; the rows
 * arrive in one staggered rise.
 */
import './AmenitiesTable.css'
import { Reveal } from '@/motion/Reveal'
import { numeral } from '@/lib/interior'

type Props = {
  items: readonly string[]
  numeral: string
  /** Accessible name of the section; the block has no heading in the content. */
  label: string
}

export function AmenitiesTable({ items, numeral: n, label }: Props) {
  if (!items.length) return null
  return (
    <section className="amenities" data-ground="light" data-n={n} aria-label={label}>
      <div className="shell grid12">
        <div className="amenities__body">
          <p className="eyebrow t-eyebrow" aria-hidden="true">
            <span>{n}</span>
            <span className="eyebrow__rule" />
          </p>
          <Reveal as="ol" staggerChildren className="amenities__rows">
            {items.map((item, i) => (
              <li key={item} className="amenities__row">
                <span className="amenities__n t-eyebrow" aria-hidden="true">
                  {numeral(i + 1)}
                </span>
                <span className="t-body">{item}</span>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
