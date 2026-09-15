/**
 * The previous/next page rail at the foot of an interior page (docs/05
 * §T2): a hairline, then two line actions — the page before and the page
 * after in reading order (src/lib/prevNext.ts). Server component on bone.
 * It sits outside the section rhythm, so it carries its own ground for the
 * GroundManager and its own vertical padding.
 */
import Link from 'next/link'
import './PrevNextRail.css'
import type { NavItem } from '@/content/schemas'
import { UI_INTERIOR } from '@/content/ui'

type Props = { prev?: NavItem; next?: NavItem }

function Cell({ direction, item }: { direction: 'prev' | 'next'; item?: NavItem }) {
  if (!item) return <div className="prev-next__cell" aria-hidden="true" />
  const heading = direction === 'prev' ? UI_INTERIOR.previous : UI_INTERIOR.next
  return (
    <div className={`prev-next__cell prev-next__cell--${direction}`}>
      <span className="prev-next__direction t-eyebrow">{heading}</span>
      <Link className="line-action t-eyebrow prev-next__link" href={item.href}>
        {item.label}
      </Link>
    </div>
  )
}

export function PrevNextRail({ prev, next }: Props) {
  if (!prev && !next) return null
  return (
    <nav className="prev-next" data-ground="light" aria-label={UI_INTERIOR.railLabel}>
      <div className="shell">
        <div className="prev-next__row">
          <Cell direction="prev" item={prev} />
          <Cell direction="next" item={next} />
        </div>
      </div>
    </nav>
  )
}
