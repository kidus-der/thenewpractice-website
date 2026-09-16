/**
 * The previous/next page rail at the foot of an interior page (docs/05 §T2).
 * Reading order is the home page, then the primary navigation as nav.ts
 * orders it, with the footer's secondary pages slotted in after the primary
 * page that precedes them in their footer group — so the Practice group reads
 * About → Our Process → A Personal Message → Fees (ledger, Task 18 triage).
 * The order is built from the deployment's navigation, so on production a
 * PLACEHOLDER route is not a neighbour of anything (src/lib/placeholderRoutes.ts).
 * The rail never spells a route or a label of its own.
 */
import { routes } from '@/content/nav'
import type { Nav, NavItem } from '@/content/schemas'
import { ROUTE_SEO } from '@/content/seo'
import { liveNav } from '@/lib/placeholderRoutes'

export type PrevNext = Readonly<{ prev?: NavItem; next?: NavItem }>

const hasHref = (order: readonly NavItem[], href: string): boolean =>
  order.some((item) => item.href === href)

/** Inserts `item` immediately after the entry with `afterHref`. */
const insertAfter = (
  order: readonly NavItem[],
  afterHref: string,
  item: NavItem
): readonly NavItem[] => {
  const at = order.findIndex((entry) => entry.href === afterHref)
  return [...order.slice(0, at + 1), item, ...order.slice(at + 1)]
}

/**
 * A footer group's items that are not yet in the order join it after their
 * predecessor in the group, when that predecessor is already there. A group
 * whose first item is unknown (Contact, Legal) contributes nothing.
 */
const weaveGroup = (order: readonly NavItem[], items: readonly NavItem[]): readonly NavItem[] =>
  items.reduce<readonly NavItem[]>((acc, item, i) => {
    if (hasHref(acc, item.href)) return acc
    const previous = items[i - 1]
    if (!previous || !hasHref(acc, previous.href)) return acc
    return insertAfter(acc, previous.href, item)
  }, order)

/** Home, the primary routes in navigation order, the footer's secondary pages woven in. */
export const readingOrder = (nav: Nav = liveNav()): readonly NavItem[] =>
  nav.footer.reduce<readonly NavItem[]>(
    (order, group) => weaveGroup(order, group.items),
    [{ label: ROUTE_SEO.home.name, href: routes.home }, ...nav.primary]
  )

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
