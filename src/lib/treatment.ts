/**
 * Pure helpers for the treatment template (docs/05 §T3). The service's
 * numeral, its neighbours and related services in document order, and the
 * ordered list of blocks a service page is composed from — so the document
 * order (docs/06 §Schema rules: intro → lists → outro → definitions →
 * subsections; may-include before treats where a service has both) lives in
 * data the template maps over and a test can assert, not in JSX branches.
 * Every function returns a new object; nothing here mutates content.
 */
import { NAV, routes, serviceHref } from '@/content/nav'
import type { NavItem, Section, Service } from '@/content/schemas'
import { SERVICES } from '@/content/services'
import type { IndexRow } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'

/** docs/05 §T3: the next three services in order. */
export const RELATED_COUNT = 3

/** The two grounds a treatment block may sit on (ContentSection's `Ground`). */
export type TreatmentGround = 'light' | 'mid'

/** What each kind of block carries; the template switches on `kind`. */
type BlockBody =
  | Readonly<{ kind: 'intro'; section: Section }>
  | Readonly<{ kind: 'treats'; heading?: string; items: readonly string[] }>
  | Readonly<{ kind: 'mayInclude'; heading?: string; items: readonly string[] }>
  | Readonly<{ kind: 'outro'; section: Section }>
  | Readonly<{ kind: 'definitions'; section: Section }>
  | Readonly<{ kind: 'subsection'; section: Section }>
  | Readonly<{ kind: 'related'; rows: readonly IndexRow[] }>

/** A block before its position and ground are known. */
type DraftBlock = Readonly<{ id: string }> & BlockBody

export type TreatmentBlock = DraftBlock & Readonly<{ numeral: string; ground: TreatmentGround }>

export type TreatmentBlockKind = TreatmentBlock['kind']

/** docs/02 §Ground rhythm: the lists and the related rows on sand, prose on bone. */
const SAND_KINDS: ReadonlySet<TreatmentBlockKind> = new Set(['treats', 'mayInclude', 'related'])

const byOrder = (services: readonly Service[]): readonly Service[] =>
  [...services].sort((a, b) => a.order - b.order)

/** `01`–`11`: the service's document order. */
export const serviceNumeral = (service: Service): string => numeral(service.order)

export const serviceBySlug = (
  slug: string,
  services: readonly Service[] = SERVICES
): Service | undefined => services.find((service) => service.slug === slug)

/**
 * The `count` services after `slug` in document order, wrapping past the last
 * back to the first; never the service itself, never more than exist.
 */
export function relatedServices(
  slug: string,
  count: number = RELATED_COUNT,
  services: readonly Service[] = SERVICES
): readonly Service[] {
  const ordered = byOrder(services)
  const index = ordered.findIndex((service) => service.slug === slug)
  if (index === -1) return []
  const take = Math.min(count, ordered.length - 1)
  return Array.from({ length: take }, (_, i) => ordered[(index + 1 + i) % ordered.length]).filter(
    (service): service is Service => service !== undefined
  )
}

const serviceItem = (service: Service): NavItem => ({
  label: service.title,
  href: serviceHref(service.slug),
})

/** The listing page as a rail item, from the primary navigation. */
function listingItem(): NavItem {
  const item = NAV.primary.find((entry) => entry.href === routes.clinicalServices)
  if (!item) throw new Error('nav.ts: the primary navigation has no clinical services item')
  return item
}

/**
 * The previous and next service in document order; the first service looks
 * back to the listing and the last one looks forward to it (docs/05 §T3).
 */
export function servicePrevNext(slug: string, services: readonly Service[] = SERVICES): PrevNext {
  const ordered = byOrder(services)
  const index = ordered.findIndex((service) => service.slug === slug)
  if (index === -1) return {}
  const before = ordered[index - 1]
  const after = ordered[index + 1]
  return {
    prev: before ? serviceItem(before) : listingItem(),
    next: after ? serviceItem(after) : listingItem(),
  }
}

const relatedRows = (services: readonly Service[]): readonly IndexRow[] =>
  services.map((service) => ({ href: serviceHref(service.slug), title: service.title }))

/** An untitled section carrying prose only: no eyebrow, opens on its first line. */
const proseSection = (id: string, paragraphs: readonly string[]): Section => ({
  id,
  paragraphs: [...paragraphs],
})

/** A subsection that is only its definitions renders as the open definition list. */
const isDefinitionsOnly = (section: Section): boolean =>
  Boolean(section.definitions?.length) &&
  section.paragraphs.length === 0 &&
  !section.list?.length &&
  !section.outro?.length &&
  !section.subsections?.length

/**
 * The lists in the document's order. Addiction Treatment, the one service
 * with both, places *may include* before *treats* (docs/06 §Schema rules;
 * ledger, Task 5 findings); the schema carries no order field, so the rule is
 * spelled here.
 */
function listBlocks(service: Service): readonly DraftBlock[] {
  const mayInclude: readonly DraftBlock[] = service.mayInclude?.length
    ? [
        {
          kind: 'mayInclude',
          id: `${service.slug}-may-include`,
          heading: service.mayIncludeHeading,
          items: service.mayInclude,
        },
      ]
    : []
  const treats: readonly DraftBlock[] = service.treats?.length
    ? [
        {
          kind: 'treats',
          id: `${service.slug}-treats`,
          heading: service.treatsHeading,
          items: service.treats,
        },
      ]
    : []
  return [...mayInclude, ...treats]
}

function draftBlocks(service: Service, services: readonly Service[]): readonly DraftBlock[] {
  const [, ...introRemainder] = service.intro
  const intro: readonly DraftBlock[] = introRemainder.length
    ? [
        {
          kind: 'intro',
          id: `${service.slug}-intro`,
          section: proseSection(`${service.slug}-intro`, introRemainder),
        },
      ]
    : []
  const outro: readonly DraftBlock[] = service.outro?.length
    ? [
        {
          kind: 'outro',
          id: `${service.slug}-outro`,
          section: proseSection(`${service.slug}-outro`, service.outro),
        },
      ]
    : []
  const definitions: readonly DraftBlock[] = service.definitions?.length
    ? [
        {
          kind: 'definitions',
          id: `${service.slug}-definitions`,
          section: {
            id: `${service.slug}-definitions`,
            paragraphs: [],
            definitions: service.definitions,
          },
        },
      ]
    : []
  const subsections: readonly DraftBlock[] = (service.subsections ?? []).map((section) => ({
    kind: isDefinitionsOnly(section) ? 'definitions' : 'subsection',
    id: section.id,
    section,
  }))
  const related = relatedServices(service.slug, RELATED_COUNT, services)
  const relatedBlock: readonly DraftBlock[] = related.length
    ? [{ kind: 'related', id: `${service.slug}-related`, rows: relatedRows(related) }]
    : []
  return [
    ...intro,
    ...listBlocks(service),
    ...outro,
    ...definitions,
    ...subsections,
    ...relatedBlock,
  ]
}

/**
 * The service page's body, in document order, each block numbered from `01`
 * and placed on its ground. Lists and the related rows sit on sand, prose on
 * bone; when a sand block would follow another sand block the later one
 * yields to bone, so two sand bands never merge into one (ledger, Task 17).
 */
export function serviceBlocks(
  service: Service,
  services: readonly Service[] = SERVICES
): readonly TreatmentBlock[] {
  return draftBlocks(service, services).reduce<readonly TreatmentBlock[]>((acc, draft, i) => {
    const wantsSand = SAND_KINDS.has(draft.kind)
    const previousIsSand = acc.at(-1)?.ground === 'mid'
    const ground: TreatmentGround = wantsSand && !previousIsSand ? 'mid' : 'light'
    return [...acc, { ...draft, numeral: numeral(i + 1), ground }]
  }, [])
}
