import { cn } from '@/lib/cn'

/**
 * numeral ─── L A B E L
 * The page's structural grammar. Every section opens with this lockup.
 * docs/03-design-system.md §2. The label is an h2 by default; a block nested
 * inside a section (the home manifesto) passes `as="h3"` so the outline
 * never skips a level.
 */
export function SectionHeader({
  n,
  label,
  id,
  className,
  as: Heading = 'h2',
}: {
  n: string
  label: string
  id?: string
  className?: string
  as?: 'h2' | 'h3'
}) {
  return (
    <div className={cn('eyebrow t-eyebrow', className)}>
      <span aria-hidden="true">{n}</span>
      <span className="eyebrow__rule" aria-hidden="true" />
      <Heading id={id} className="t-eyebrow">
        {label}
      </Heading>
    </div>
  )
}
