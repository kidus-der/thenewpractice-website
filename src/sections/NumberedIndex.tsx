/**
 * The numbered index (docs/05 §T3 "Treatment may include"): `01 ──` in the
 * muted eyebrow register, the item in the Didone at --t-d3, a hairline
 * between rows. Each row arrives with its own `mask` wipe, staggered, so the
 * list reads as one gesture (docs/04 §3). Not links: the items are the
 * client's names for parts of a programme, not pages. Server component; the
 * reveal is the only client code.
 */
import './NumberedIndex.css'
import { numeral } from '@/lib/interior'
import { Reveal } from '@/motion/Reveal'

type Props = { items: readonly string[] }

export function NumberedIndex({ items }: Props) {
  return (
    <Reveal as="ol" variant="mask" staggerChildren className="numbered-index">
      {items.map((item, i) => (
        <li key={item} className="numbered-index__row">
          <span className="numbered-index__numeral t-eyebrow" aria-hidden="true">
            <span>{numeral(i + 1)}</span>
            <span className="numbered-index__rule" />
          </span>
          <span className="numbered-index__item t-d3">{item}</span>
        </li>
      ))}
    </Reveal>
  )
}
