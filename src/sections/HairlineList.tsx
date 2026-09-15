/**
 * The hairline list (docs/05 §Reusable blocks "Hairline list"): plain rows
 * separated by `--rule`, one column, two from 1024px, with the document's
 * introducing line above when there is one. Lifted out of ContentSection in
 * Task 13 so the treatment template's *we provide treatment for* list and
 * the long-read sections' lists are one block. Server component; the reveal
 * is the only client code.
 */
import './HairlineList.css'
import { cn } from '@/lib/cn'
import { Reveal } from '@/motion/Reveal'

type Props = {
  items: readonly string[]
  /** The colon-terminated line that introduces the list in the document. */
  heading?: string
  className?: string
}

export function HairlineList({ items, heading, className }: Props) {
  return (
    <div className={cn('hairline-list', className)}>
      {heading && (
        <Reveal as="p" className="t-body hairline-list__heading">
          {heading}
        </Reveal>
      )}
      <Reveal as="ul" staggerChildren className="hairline-list__rows">
        {items.map((item) => (
          <li key={item} className="t-body">
            {item}
          </li>
        ))}
      </Reveal>
    </div>
  )
}
