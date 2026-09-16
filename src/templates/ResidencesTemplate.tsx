/**
 * T5 — Residences (docs/05 §T5, plan §3.3). The job is to make the place
 * feel real and unavailable to anyone else: a title page, one full-bleed
 * 16:9 plate, three short sections, the drifting carousel of six 3:4 plates,
 * the amenities as a hairline table, a privacy statement on canopy over a
 * 21:9 plate, the rail and the closing band. No map, no address, no counts.
 *
 * Takes a `ResidencesPage` from `residencesPageSchema` and composes the
 * blocks; contains no copy, no route strings and no media keys of its own.
 * Every word in the page module is structural PLACEHOLDER until the client
 * supplies the residences text (docs/CONTENT-GAPS.md G1); the one exception
 * is the privacy statement, which is the client's own sentence about
 * discretion read from the About page through src/lib/residences.ts.
 *
 * Grounds: intro bone → plate bone → sections bone / sand / bone → carousel
 * sand → amenities bone → statement canopy → rail bone → band canopy.
 */
import './ResidencesTemplate.css'
import type { MediaKey } from '@/content/media'
import type { ResidencesPage } from '@/content/schemas'
import { UI_RESIDENCES } from '@/content/ui'
import { numeral, resolveGrounds } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { discretionStatement, residencePlates } from '@/lib/residences'
import { Reveal } from '@/motion/Reveal'
import { AmenitiesTable } from '@/sections/AmenitiesTable'
import { ContentSection, type Ground } from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { PageIntro } from '@/sections/PageIntro'
import { PlateCarousel, type ObjectPositions } from '@/sections/PlateCarousel'
import { PlateFigure } from '@/sections/PlateFigure'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type ResidencesTemplateProps = {
  page: ResidencesPage
  /** The full-bleed 16:9 plate under the title page. */
  hero: MediaKey
  /** The six 3:4 frames for the carousel, in the page's plate order. */
  carousel: readonly MediaKey[]
  /** Crop anchors for carousel frames whose subject sits at one edge. */
  objectPositions?: ObjectPositions
  /** The 21:9 plate under the privacy statement. */
  band: MediaKey
  /** Section id → ground; anything unlisted is bone. */
  grounds?: Readonly<Record<string, Ground>>
  prevNext?: PrevNext
}

const FULL_BLEED = '100vw'
const STATEMENT_ID = 'residences-privacy-title'

/** Docs/04 §6 "Discretion band": one statement, one plate, one mask reveal. */
function PrivacyStatement({
  statement,
  band,
  numeral: n,
}: {
  statement?: string
  band: MediaKey
  numeral: string
}) {
  return (
    <section
      className="residences__privacy"
      data-ground="dark"
      data-n={n}
      aria-labelledby={statement ? STATEMENT_ID : undefined}
    >
      <div className="shell grid12">
        <div className="p-lead residences__privacy-copy">
          <p className="eyebrow t-eyebrow" aria-hidden="true">
            <span>{n}</span>
            <span className="eyebrow__rule" />
          </p>
          {statement && (
            <Reveal
              variant="lines"
              as="h2"
              id={STATEMENT_ID}
              className="t-d2 residences__statement"
            >
              {statement}
            </Reveal>
          )}
        </div>
      </div>
      <PlateFigure media={band} sizes={FULL_BLEED} className="residences__band" />
    </section>
  )
}

export function ResidencesTemplate({
  page,
  hero,
  carousel,
  objectPositions,
  band,
  grounds,
  prevNext,
}: ResidencesTemplateProps) {
  const plates = residencePlates(page.plates, carousel)
  // docs/02 §Ground rhythm: a sand section never directly follows another.
  const sectionGrounds = resolveGrounds(page.sections, grounds)
  const sectionCount = page.sections.length
  const carouselNumeral = numeral(sectionCount + 1)
  const amenitiesNumeral = numeral(sectionCount + 2)
  const privacyNumeral = numeral(sectionCount + 3)
  const bandNumeral = numeral(sectionCount + 4)

  return (
    <main id="main" className="residences">
      <PageIntro
        id={`${page.slug}-title`}
        numeral={numeral(0)}
        eyebrow={page.eyebrow}
        headline={page.title}
        lead={page.lead}
      />

      <div className="residences__hero" data-ground="light">
        <PlateFigure media={hero} sizes={FULL_BLEED} className="residences__hero-figure" />
      </div>

      {page.sections.map((section, i) => (
        <ContentSection
          key={section.id}
          section={section}
          numeral={numeral(i + 1)}
          ground={sectionGrounds[i]}
        />
      ))}

      <PlateCarousel
        plates={plates}
        numeral={carouselNumeral}
        label={UI_RESIDENCES.carouselLabel}
        objectPositions={objectPositions}
      />

      <AmenitiesTable
        items={page.amenities}
        numeral={amenitiesNumeral}
        label={UI_RESIDENCES.amenitiesLabel}
      />

      <PrivacyStatement statement={discretionStatement()} band={band} numeral={privacyNumeral} />

      {prevNext && <PrevNextRail {...prevNext} />}
      <EnquireBand numeral={bandNumeral} />
    </main>
  )
}
