/**
 * /self-assessment — the tab page (docs/05 §T6 *Self-assessment*; round 1,
 * R5: no friction between arriving and answering). A spread, not a long
 * read:
 *
 *   the title page: the eyebrow lockup, `Self-Assessment`, the client's two
 *   sentences on what the questionnaires are for, one picture
 *   → the ten questionnaires under the client's own heading, the first
 *   sentence of their disclaimer beneath as the one line
 *   → the rail → the closing band.
 *
 * From 1024px the title page and the list share the first viewport side by
 * side (the two sections share one grid cell of `main`, AssessmentIndex.css);
 * below it they stack and the list is one short scroll down. The list is the
 * house IndexList with its travelling glow, set compact. Everything a visitor
 * reads first on a questionnaire, and the full disclaimer and the invitation
 * to a consultation, live on the questionnaires themselves.
 *
 * Server component; the list is the only client code. No copy of its own.
 */
import './AssessmentIndexTemplate.css'
import { Plate } from '@/components/Plate'
import { SectionHeader } from '@/components/SectionHeader'
import { MEDIA, type MediaKey } from '@/content/media'
import type { IndexRow } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import type { PrevNext } from '@/lib/prevNext'
import { Reveal } from '@/motion/Reveal'
import { EnquireBand } from '@/sections/EnquireBand'
import { IndexList } from '@/sections/IndexList'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type AssessmentIndexProps = {
  slug: string
  title: string
  /** Two or three of the client's sentences on what the questionnaires are for. */
  description: string
  plate: MediaKey
  list: Readonly<{ id: string; label: string; rows: readonly IndexRow[] }>
  /** One line beside the list: the first sentence of the client's disclaimer. */
  disclaimer: string
  prevNext: PrevNext
}

const INTRO = 0
const LIST = 1
const BAND = 2
/** The plate spans the title page's column: roughly 40% of the row from 1024px. */
const PLATE_SIZES = '(min-width: 1024px) 40vw, 100vw'
/**
 * The description sits where a title page's lead sits and may be the LCP; a
 * clip reveal is credited at first paint, an opacity one only when it ends
 * (docs/09 §1, as PageIntro's lead).
 */
const DESCRIPTION_REVEAL = 'mask'

export function AssessmentIndexTemplate({
  slug,
  title,
  description,
  plate,
  list,
  disclaimer,
  prevNext,
}: AssessmentIndexProps) {
  const titleId = `${slug}-title`
  const listTitleId = `${list.id}-title`
  const frame = MEDIA[plate]

  return (
    <main id="main" className="assessment-index">
      <section
        className="assessment-index__intro"
        data-ground="light"
        data-n={numeral(INTRO)}
        aria-labelledby={titleId}
      >
        <div className="shell grid12">
          <div className="assessment-index__copy">
            <p className="eyebrow t-eyebrow assessment-index__eyebrow" aria-hidden="true">
              <span>{numeral(INTRO)}</span>
              <span className="eyebrow__rule" />
            </p>
            <Reveal variant="lines" as="h1" id={titleId} className="t-d1 assessment-index__title">
              {title}
            </Reveal>
            <Reveal
              as="p"
              variant={DESCRIPTION_REVEAL}
              className="t-body assessment-index__description"
            >
              {description}
            </Reveal>
            <figure className="assessment-index__plate">
              <Reveal variant="mask" className="assessment-index__frame">
                <Plate media={plate} alt={frame.alt} sizes={PLATE_SIZES} />
              </Reveal>
            </figure>
          </div>
        </div>
      </section>

      <section
        id={list.id}
        className="assessment-index__tests"
        data-ground="light"
        data-n={numeral(LIST)}
        aria-labelledby={listTitleId}
      >
        <div className="shell grid12">
          <div className="assessment-index__list">
            <SectionHeader n={numeral(LIST)} label={list.label} id={listTitleId} />
            <IndexList rows={list.rows} />
            <p className="t-small assessment-index__disclaimer">{disclaimer}</p>
          </div>
        </div>
      </section>

      <PrevNextRail {...prevNext} />
      <EnquireBand numeral={numeral(BAND)} />
    </main>
  )
}
