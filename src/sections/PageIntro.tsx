/**
 * The interior page's opening (docs/05 §T2): the eyebrow lockup, the title in
 * the Didone at --t-d1 arriving line by line, an optional lead at --t-lead,
 * and an optional plate as the counterweight at .p-offset. Bone ground,
 * declared on the element so the server-rendered header reads ink before
 * GroundManager paints (docs/05 §Header). Server component.
 */
import './PageIntro.css'
import type { MediaKey } from '@/content/media'
import { Reveal } from '@/motion/Reveal'
import { PlateFigure } from './PlateFigure'

type Props = {
  /** id of the <h1>, referenced by the section's aria-labelledby. */
  id: string
  numeral: string
  eyebrow?: string
  headline: string
  lead?: string
  plate?: MediaKey
}

/** The intro sits at .p-offset from 1024px: roughly half the row. */
const PLATE_SIZES = '(min-width: 1024px) 50vw, 100vw'
/**
 * The lead is the LCP element wherever it is set larger than the title's
 * lines (the treatment pages, docs/09 §Measured budgets). A clip reveal is
 * credited at first paint, as the h1's line masks are; an opacity reveal is
 * credited only when its tween ends, after the veil (Task 20, Task 21).
 */
const LEAD_REVEAL = 'mask'

export function PageIntro({ id, numeral, eyebrow, headline, lead, plate }: Props) {
  return (
    <section className="page-intro" data-ground="light" data-n={numeral} aria-labelledby={id}>
      <div className="shell grid12 page-intro__grid">
        <div className="p-lead page-intro__copy">
          <p
            className="eyebrow t-eyebrow page-intro__eyebrow"
            aria-hidden={eyebrow ? undefined : true}
          >
            <span aria-hidden="true">{numeral}</span>
            <span className="eyebrow__rule" aria-hidden="true" />
            {eyebrow && <span className="page-intro__label">{eyebrow}</span>}
          </p>
          <Reveal variant="lines" as="h1" id={id} className="t-d1 page-intro__title">
            {headline}
          </Reveal>
          {lead && (
            <Reveal as="p" variant={LEAD_REVEAL} className="t-lead page-intro__lead">
              {lead}
            </Reveal>
          )}
        </div>
        {plate && (
          <div className="p-offset page-intro__plate">
            <PlateFigure media={plate} sizes={PLATE_SIZES} />
          </div>
        )}
      </div>
    </section>
  )
}
