/**
 * The previous/next page rail at the foot of an interior page (docs/05 §T2).
 * Reading order is the home page followed by the primary navigation, as
 * nav.ts orders it; the rail never spells a route or a label of its own.
 */
import { NAV, routes } from '@/content/nav'
import type { NavItem } from '@/content/schemas'
import { ROUTE_SEO } from '@/content/seo'

export type PrevNext = Readonly<{ prev?: NavItem; next?: NavItem }>

/** Home, then the primary routes in navigation order. */
export const readingOrder = (): readonly NavItem[] => [
  { label: ROUTE_SEO.home.name, href: routes.home },
  ...NAV.primary,
]

/** The neighbours of a route in reading order; an unknown route has none. */
export function prevNextFor(
  pathname: string,
  order: readonly NavItem[] = readingOrder()
): PrevNext {
  const index = order.findIndex((item) => item.href === pathname)
  if (index === -1) return {}
  const prev = order[index - 1]
  const next = order[index + 1]
  return { ...(prev ? { prev } : {}), ...(next ? { next } : {}) }
}
