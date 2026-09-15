/**
 * T2 — Interior (docs/05 §T2, plan §3.3). The editorial long-read: intro,
 * the page's sections in document order, the previous/next rail, the
 * closing band. Takes a `Page` from `pageSchema` and composes the section
 * blocks; contains no copy, no route strings and no media keys of its own.
 *
 * Grounds: the intro on bone; the body on bone with the sections the page
 * names in `grounds` on sand; the band on canopy. The sticky index appears
 * from 1024px on pages with five or more sections and floats in the left
 * column beside the whole body.
 */
import type { ReactNode } from 'react'
import './InteriorTemplate.css'
import type { Page } from '@/content/schemas'
import { UI_INTERIOR } from '@/content/ui'
import { hasStickyIndex, numeral, sectionsToIndex } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { ContentSection, type Ground, type PlateMap } from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { PageIntro } from '@/sections/PageIntro'
import { PrevNextRail } from '@/sections/PrevNextRail'
import { StickyIndex } from '@/sections/StickyIndex'

export type InteriorTemplateProps = {
  page: Page
  /** Section or subsection id → media key for an inline plate. */
  plates?: PlateMap
  /** Section id → ground; anything unlisted is bone. */
  grounds?: Readonly<Record<string, Ground>>
  /** Section id → a figure rendered between that section's headings and prose. */
  figures?: Readonly<Record<string, ReactNode>>
  prevNext?: PrevNext
}

export function InteriorTemplate({
  page,
  plates,
  grounds,
  figures,
  prevNext,
}: InteriorTemplateProps) {
  const indexed = hasStickyIndex(page.sections)
  const items = sectionsToIndex(page.sections)

  return (
    <main id="main" className="interior" data-indexed={indexed ? 'true' : undefined}>
      <PageIntro
        id={`${page.slug}-title`}
        numeral={numeral(0)}
        eyebrow={page.eyebrow}
        headline={page.title}
        lead={page.lead}
      />

      <div className="interior__body">
        {indexed && (
          <div className="interior__index">
            <div className="shell grid12 interior__index-grid">
              <StickyIndex items={items} label={UI_INTERIOR.indexLabel} />
            </div>
          </div>
        )}
        {page.sections.map((section, i) => (
          <ContentSection
            key={section.id}
            section={section}
            numeral={numeral(i + 1)}
            ground={grounds?.[section.id] ?? 'light'}
            plates={plates}
            figure={figures?.[section.id]}
          />
        ))}
      </div>

      {prevNext && <PrevNextRail {...prevNext} />}
      <EnquireBand numeral={numeral(page.sections.length + 1)} />
    </main>
  )
}
