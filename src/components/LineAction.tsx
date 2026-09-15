import { cn } from '@/lib/cn'
import type { ComponentPropsWithoutRef } from 'react'

/**
 * The one CTA treatment. Letterspaced caps over a hairline that wipes in
 * --accent from the left. The label itself never moves.
 */
export function LineAction({ className, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  return (
    <a className={cn('line-action t-eyebrow', className)} {...rest}>
      {children}
    </a>
  )
}

export function LineActionButton({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={cn('line-action t-eyebrow', className)} {...rest}>
      {children}
    </button>
  )
}
