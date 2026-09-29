'use client'

/**
 * Why The New Practice? — the scrubbed manifesto (docs/04 §6 "Scrubbed
 * manifesto", docs/05 §T1). The first paragraph of the client's statement,
 * the one the curation keeps, at display size on canopy, revealed line by
 * line on `scrub: 0.8` so the reader sets the pace of the sentence; beside
 * it, the buttress roots of a kapok, the ceiba's genus, for "the underlying
 * cause". From 1024px the plate and the statement are pinned together for
 * one viewport; below, the plate stands above and only the statement is
 * pinned, for 0.8 (round 1, R3). Unpinned under reduced motion, where the
 * lines are simply there.
 *
 * Nested inside the philosophy section as its one subsection, so the label
 * is an h3 and the outline holds.
 */
import { useLayoutEffect, useRef } from 'react'
import './Manifesto.css'
import type { MediaKey } from '@/content/media'
import type { Section } from '@/content/schemas'
import { SectionHeader } from '@/components/SectionHeader'
import { gsap, ScrollTrigger, SplitText } from '@/motion/gsap'
import { E } from '@/motion/tokens'
import { HomePlate } from './HomePlate'

/** docs/04 §6: pinned one viewport from 1024px and 0.8 below, scrub 0.8. */
const PIN_DESKTOP = '+=100%'
const PIN_MOBILE = '+=80%'
const SCRUB = 0.8
/** Lines a scrub-half-second apart, then a hold before the pin releases. */
const LINE_STAGGER = 0.5
const HOLD = 0.4

type Props = Readonly<{ section: Section; numeral: string; plate: MediaKey }>

function buildTimeline(pin: string, end: string, lines: Element[]) {
  return gsap
    .timeline({
      scrollTrigger: { trigger: pin, start: 'top top', end, pin: true, scrub: SCRUB },
    })
    .from(lines, { yPercent: 110, stagger: LINE_STAGGER, ease: E.outExpo })
    .to({}, { duration: HOLD })
}

export function Manifesto({ section, numeral, plate }: Props) {
  const root = useRef<HTMLElement>(null)
  const headingId = `${section.id}-title`
  const [statement] = section.paragraphs

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    let split: SplitText | null = null

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)
      const motionOk = '(prefers-reduced-motion: no-preference)'

      mm.add(
        {
          desktop: `${motionOk} and (min-width: 1024px)`,
          mobile: `${motionOk} and (max-width: 1023px)`,
        },
        (context) => {
          const desktop = Boolean(context.conditions?.desktop)
          const run = () => {
            split = SplitText.create('.manifesto__statement', {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              // no aria-label on a <p> (axe aria-prohibited-attr); the lines read in order
              aria: 'none',
            })
            buildTimeline(
              desktop ? '.manifesto__stage' : '.manifesto__text',
              desktop ? PIN_DESKTOP : PIN_MOBILE,
              split.lines
            )
          }
          if (document.fonts?.status === 'loaded') run()
          else void document.fonts?.ready.then(run)
        }
      )

      return () => mm.revert()
    }, el)

    return () => {
      split?.revert()
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section className="manifesto" id={section.id} ref={root} aria-labelledby={headingId}>
      <div className="shell manifesto__stage">
        <HomePlate media={plate} className="p-aside-start manifesto__plate" />
        <div className="p-offset manifesto__text">
          <div className="manifesto__words">
            <SectionHeader as="h3" n={numeral} label={section.title ?? ''} id={headingId} />
            <p className="manifesto__statement">{statement}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
