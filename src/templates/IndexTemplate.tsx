/**
 * T6 — Index (docs/05 §T6, plan §3.3). A list that reads as a composition:
 * the title page, the collection's own intro copy as long-read sections, the
 * numbered list, any sections the document places after the list, the
 * previous/next rail, the closing band. Takes a `Page` for the title page,
 * the sections around the list, and the rows; contains no copy, no route
 * strings and no media keys of its own.
 *
 * Grounds: intro bone; the sections the route names in `grounds` on sand,
 * the rest bone; the list bone — the list is the composition (docs/02
 * §Ground rhythm); rail bone; band canopy.
 */
import './IndexTemplate.css'
import { SectionHeader } from '@/components/SectionHeader'
import type { Page, Section } from '@/content/schemas'
import type { IndexRow } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { Reveal } from '@/motion/Reveal'
import { ContentSection, type Ground } from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { IndexList } from '@/sections/IndexList'
import { PageIntro } from '@/sections/PageIntro'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type IndexListSpec = Readonly<{
  /** Element id of the list section; defaults to `<slug>-index`. */
  id?: string
  /** The section's heading, in the eyebrow lockup. */
  label: string
  /** One line above the rows, when the document introduces the list. */
  lead?: string
  rows: readonly IndexRow[]
}>

export type IndexTemplateProps = {
  page: Page
  /** Sections rendered between the title page and the list, in order. */
  before?: readonly Section[]
  /** Sections the document places after the list. */
  after?: readonly Section[]
  /** Section id → ground; anything unlisted is bone. */
  grounds?: Readonly<Record<string, Ground>>
  list: IndexListSpec
  prevNext?: PrevNext
}

function IndexSection({ spec, id, n }: { spec: IndexListSpec; id: string; n: string }) {
  const titleId = `${id}-title`
  return (
    <section
      id={id}
      className="index-section"
      data-ground="light"
      data-n={n}
      aria-labelledby={titleId}
    >
      <div className="shell grid12">
        <div className="p-lead index-section__head">
          <SectionHeader n={n} label={spec.label} id={titleId} />
          {spec.lead && (
            <Reveal as="p" className="t-body index-section__lead">
              {spec.lead}
            </Reveal>
          )}
        </div>
        <div className="index-section__list">
          <IndexList rows={spec.rows} />
        </div>
      </div>
    </section>
  )
}

export function IndexTemplate({
  page,
  before = [],
  after = [],
  grounds,
  list,
  prevNext,
}: IndexTemplateProps) {
  const listPosition = before.length + 1
  const bandPosition = listPosition + after.length + 1

  return (
    <main id="main" className="index">
      <PageIntro
        id={`${page.slug}-title`}
        numeral={numeral(0)}
        eyebrow={page.eyebrow}
        headline={page.title}
        lead={page.lead}
      />

      {before.map((section, i) => (
        <ContentSection
          key={section.id}
          section={section}
          numeral={numeral(i + 1)}
          ground={grounds?.[section.id] ?? 'light'}
        />
      ))}

      <IndexSection spec={list} id={list.id ?? `${page.slug}-index`} n={numeral(listPosition)} />

      {after.map((section, i) => (
        <ContentSection
          key={section.id}
          section={section}
          numeral={numeral(listPosition + i + 1)}
          ground={grounds?.[section.id] ?? 'light'}
        />
      ))}

      {prevNext && <PrevNextRail {...prevNext} />}
      <EnquireBand numeral={numeral(bandPosition)} />
    </main>
  )
}
