/**
 * CLINICAL SERVICES, CURATED — round 1, R4b (docs/06 §Curation, docs/05 §T3
 * and §T6).
 *
 * The client's feedback: read less, see more. Each service keeps its lists
 * whole (they are the part a reader scans) and its introducing sentences
 * verbatim; the prose around them is cut to the client's own sentences that
 * carry the point. The first introduction item is the title page's lead, so
 * it is kept to a sentence or two. Definitions are the term and their first
 * sentence. Nothing here is ours: every sentence is the client's.
 *
 * The index page loses its intro section: the title page's lead is two of
 * its sentences and the list opens on its last one, so the eleven services
 * sit directly under the title page.
 */
import type { Page, Service } from '../schemas'
import { SERVICES, SERVICES_PAGE } from '../services'
import {
  ALL,
  curate,
  only,
  sentencesOf,
  type Curator,
  type DefinitionPick,
  type ItemPicks,
  type SectionSpec,
} from './core'

/**
 * What renders of one service. `intro[0]` becomes the title page's lead, the
 * rest the opening block. `fromOutro` picks from the prose the document sets
 * after the lists and closes the opening block with it: a sentence or two on
 * its own made a whole band, so no service keeps an outro block (round 1).
 * `treats`, `mayInclude` and their headings always render whole.
 * `subsections` are dropped when omitted.
 */
export type ServiceSpec = Readonly<{
  intro: ItemPicks
  fromOutro?: ItemPicks
  subsections?: readonly SectionSpec[]
}>

/** Every definition of a section, trimmed to its term and first sentence. */
const firstSentences = (count: number): readonly DefinitionPick[] =>
  Array.from({ length: count }, (_, at) => ({ at, description: only([0]) }))

/** Keyed by slug; `services.test.ts` fails when a service has no entry. */
export const SERVICE_SPECS: Readonly<Record<string, ServiceSpec>> = {
  'addiction-treatment': { intro: [0, 1], fromOutro: ALL },
  'trauma-and-complex-trauma': {
    intro: [0],
    subsections: [{ id: 'trauma-focused-treatment-may-include', definitions: firstSentences(8) }],
  },
  'mental-health': { intro: [0, 1] },
  'eating-disorders': { intro: [0, 1] },
  'executive-health-and-burnout': { intro: [0, 1], fromOutro: ALL },
  'biochemical-restoration': {
    intro: [sentencesOf(0, [0]), sentencesOf(0, [1, 2]), sentencesOf(1, [1])],
  },
  'somatic-therapies-and-nervous-system-regulation': { intro: ALL },
  'inner-child-work': {
    intro: [sentencesOf(0, [0]), 1, 2],
    subsections: [
      { id: 'how-it-works', paragraphs: [sentencesOf(0, [0]), 2, 3] },
      { id: 'the-benefits', list: ALL },
    ],
  },
  'recovery-management-and-after-care': {
    intro: [0, 1, 2],
    subsections: [{ id: 'after-care-needs', list: ALL }],
  },
  'interventions-and-crisis-response': {
    intro: [
      sentencesOf(0, [0]),
      sentencesOf(0, [1]),
      sentencesOf(2, [0]),
      sentencesOf(4, [0, 1]),
      sentencesOf(5, [0]),
    ],
  },
  'family-program': { intro: [0, sentencesOf(1, [0])], fromOutro: [1, 2] },
}

/** Only the fields that have a value, so an omitted field is absent rather than `undefined`. */
const defined = <T extends object>(fields: T): T =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as T

const nonEmpty = <T>(items: readonly T[]): T[] | undefined =>
  items.length > 0 ? [...items] : undefined

function curateService(c: Curator, service: Service, spec: ServiceSpec): Service {
  const where = service.slug
  return defined({
    ...service,
    intro: [
      ...c.texts(service.intro, spec.intro, `${where}.intro`),
      ...(spec.fromOutro ? c.texts(service.outro, spec.fromOutro, `${where}.outro`) : []),
    ],
    outro: undefined,
    // No service carries top-level definitions; Trauma's sit in a subsection.
    definitions: undefined,
    subsections: spec.subsections
      ? nonEmpty(c.sections(service.subsections ?? [], spec.subsections, `${where}.subsections`))
      : undefined,
  })
}

export const SERVICES_CURATION = curate('services', (c) =>
  SERVICES.map((service) => {
    const spec = SERVICE_SPECS[service.slug]
    return spec ? curateService(c, service, spec) : service
  })
)

/** The eleven services as they render, in document order. */
export const SERVICES_CURATED: readonly Service[] = SERVICES_CURATION.value

/** The source section the index page draws its lead and list line from. */
const INTRO_SECTION = 'individualized-treatment-for-complex-human-problems'

export type ServicesIndexCurated = Readonly<{
  /** The title page: the collection's title and a two-sentence lead; no sections. */
  page: Page
  /** The list's introducing line. */
  listLead?: string
}>

export const SERVICES_PAGE_CURATION = curate('servicesPage', (c): ServicesIndexCurated => {
  const intro = SERVICES_PAGE.sections.find((section) => section.id === INTRO_SECTION)
  const where = `sections.${INTRO_SECTION}.paragraphs`
  const lead = c.texts(intro?.paragraphs, [0, sentencesOf(2, [0])], where).join(' ')
  const [listLead] = c.texts(intro?.paragraphs, [3], where)
  return defined({
    page: defined({ ...SERVICES_PAGE, lead: lead || undefined, sections: [] }),
    listLead,
  })
})

export const SERVICES_PAGE_CURATED: ServicesIndexCurated = SERVICES_PAGE_CURATION.value
