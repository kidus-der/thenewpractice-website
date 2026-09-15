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
 *
 * `variant="letter"` (Task 18) is the same composition in the lead register:
 * the prose at `--t-lead` with looser leading, untitled sections opening on
 * their first line. `/a-personal-message` and `/fees` — a letter and a single
 * statement, docs/05's Statement block — both read this way; nothing else
 * about the template changes. `bodies` lets a route stand a block in for one
 * section's prose (the process page's timeline).
 */
import type { ReactNode } from 'react'
import './InteriorTemplate.css'
import type { Page } from '@/content/schemas'
import { UI_INTERIOR } from '@/content/ui'
import { hasStickyIndex, numeral, sectionsToIndex } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import {
  ContentSection,
  type Ground,
  type PlateMap,
  type Register,
} from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { PageIntro } from '@/sections/PageIntro'
import { PrevNextRail } from '@/sections/PrevNextRail'
import { StickyIndex } from '@/sections/StickyIndex'

export type InteriorVariant = 'long-read' | 'letter'

const REGISTER: Readonly<Record<InteriorVariant, Register>> = {
  'long-read': 'body',
  letter: 'lead',
}

export type InteriorTemplateProps = {
  page: Page
  variant?: InteriorVariant
  /** Section or subsection id → media key for an inline plate. */
  plates?: PlateMap
  /** Section id → ground; anything unlisted is bone. */
  grounds?: Readonly<Record<string, Ground>>
  /** Section id → a figure rendered between that section's headings and prose. */
  figures?: Readonly<Record<string, ReactNode>>
  /** Section id → a block that replaces that section's prose. */
  bodies?: Readonly<Record<string, ReactNode>>
  prevNext?: PrevNext
}

export function InteriorTemplate({
  page,
  variant = 'long-read',
  plates,
  grounds,
  figures,
  bodies,
  prevNext,
}: InteriorTemplateProps) {
  const indexed = hasStickyIndex(page.sections)
  const items = sectionsToIndex(page.sections)

  return (
    <main
      id="main"
      className="interior"
      data-variant={variant}
      data-indexed={indexed ? 'true' : undefined}
    >
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
            body={bodies?.[section.id]}
            register={REGISTER[variant]}
          />
        ))}
      </div>

      {prevNext && <PrevNextRail {...prevNext} />}
      <EnquireBand numeral={numeral(page.sections.length + 1)} />
    </main>
  )
}
