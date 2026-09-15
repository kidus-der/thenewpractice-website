/**
 * T3 — Treatment (docs/05 §T3, plan §3.3). One clinical service as a
 * chapter: the title page carries the service's own numeral (`01`–`11`) and
 * its first paragraph as the lead; the body is the ordered blocks
 * `serviceBlocks()` derives from the document — the remaining introduction,
 * the lists, the prose after them, the definitions rendered open, the
 * subsections, the three related services — numbered `01` onward within the
 * chapter; then the rail to the neighbouring services and the closing band.
 * Takes a `Service` from `serviceSchema`; contains no copy, no route strings
 * and no media keys of its own. The page is type: services have no plates.
 *
 * Grounds: title page bone; prose blocks bone; the lists and the related
 * rows sand, except that a sand block never follows another (the later one
 * yields to bone); rail bone; band canopy.
 */
import './TreatmentTemplate.css'
import type { Service } from '@/content/schemas'
import { UI_TREATMENT } from '@/content/ui'
import { numeral } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { serviceBlocks, serviceNumeral, type TreatmentBlock } from '@/lib/treatment'
import { ContentSection } from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { HairlineList } from '@/sections/HairlineList'
import { IndexList } from '@/sections/IndexList'
import { ListSection } from '@/sections/ListSection'
import { NumberedIndex } from '@/sections/NumberedIndex'
import { PageIntro } from '@/sections/PageIntro'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type TreatmentTemplateProps = {
  service: Service
  /** The collection's name for the title page eyebrow ("Clinical Services"). */
  eyebrow: string
  prevNext?: PrevNext
}

function Block({ block }: { block: TreatmentBlock }) {
  switch (block.kind) {
    case 'treats':
      return (
        <ListSection
          id={block.id}
          numeral={block.numeral}
          ground={block.ground}
          heading={block.heading ?? UI_TREATMENT.treatsHeading}
        >
          <HairlineList items={block.items} />
        </ListSection>
      )
    case 'mayInclude':
      return (
        <ListSection
          id={block.id}
          numeral={block.numeral}
          ground={block.ground}
          heading={block.heading ?? UI_TREATMENT.mayIncludeHeading}
        >
          <NumberedIndex items={block.items} />
        </ListSection>
      )
    case 'related':
      return (
        <ListSection
          id={block.id}
          numeral={block.numeral}
          ground={block.ground}
          heading={UI_TREATMENT.relatedHeading}
          register="eyebrow"
        >
          <IndexList rows={block.rows} />
        </ListSection>
      )
    default:
      return (
        <ContentSection section={block.section} numeral={block.numeral} ground={block.ground} />
      )
  }
}

export function TreatmentTemplate({ service, eyebrow, prevNext }: TreatmentTemplateProps) {
  const [lead] = service.intro
  const blocks = serviceBlocks(service)

  return (
    <main id="main" className="treatment">
      <PageIntro
        id={`${service.slug}-title`}
        numeral={serviceNumeral(service)}
        eyebrow={eyebrow}
        headline={service.title}
        lead={lead}
      />

      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}

      {prevNext && <PrevNextRail {...prevNext} />}
      <EnquireBand numeral={numeral(blocks.length + 1)} />
    </main>
  )
}
