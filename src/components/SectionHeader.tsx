import { cn } from '@/lib/cn'

/**
 * numeral ─── L A B E L
 * The page's structural grammar. Every section opens with this lockup.
 * docs/03-design-system.md §2.
 */
export function SectionHeader({
  n,
  label,
  id,
  className,
}: {
  n: string
  label: string
  id?: string
  className?: string
}) {
  return (
    <div className={cn('eyebrow t-eyebrow', className)}>
      <span aria-hidden="true">{n}</span>
      <span className="eyebrow__rule" aria-hidden="true" />
      <h2 id={id} className="t-eyebrow">
        {label}
      </h2>
    </div>
  )
}
