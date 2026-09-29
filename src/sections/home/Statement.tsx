'use client'

/**
 * 01 — Private Treatment Without Compromise: the "One" moment (docs/04 §6
 * "Ghosted mark + statement", docs/01 §The mark). The ceiba at ~58vh, ghosted
 * on canopy, behind the client's triad revealed one line at a time under
 * scrub; the gold point lands between the second and third lines; then the
 * one sentence the curation keeps of the section's prose settles in at the
 * foot of the frame. Pinned one viewport from 768px and 0.8 below (round 1,
 * R3: the home page is shorter); unpinned under reduced motion, where the
 * mark renders complete and the lines stand in flow.
 *
 * Canopy only: the bone prose block that followed is gone with the three
 * paragraphs it carried. No photograph. Adding one halves it.
 */
import { useLayoutEffect, useRef } from 'react'
import './Statement.css'
import type { Section } from '@/content/schemas'
import { Mark } from '@/components/Mark'
import { SectionHeader } from '@/components/SectionHeader'
import { gsap, ScrollTrigger, SplitText } from '@/motion/gsap'
import { E } from '@/motion/tokens'
import { triadLines } from '@/lib/home'

/** docs/04 §6: one viewport from 768px, 0.8 below (round 1, R3). */
const PIN_DESKTOP = '+=100%'
const PIN_MOBILE = '+=80%'
const SCRUB = 0.6

/** Timeline positions, in scrub-seconds, ported from the concept site's §02. */
const T = {
  strokeStagger: 0.12,
  strokeDuration: 1.1,
  point: 0.9,
  pointDuration: 0.5,
  hairline: 0.2,
  hairlineDuration: 0.9,
  lines: 1.4,
  lineStagger: 0.6,
  lineDuration: 0.9,
  recede: 3.4,
  recedeDuration: 1,
  foot: 3.4,
  footDuration: 0.8,
  hold: 0.4,
} as const
const RECEDE = { scale: 1.1, opacity: 0.5 } as const

type Props = Readonly<{ section: Section; numeral: string }>

function buildTimeline(el: HTMLElement, end: string, lines: HTMLElement[]) {
  return gsap
    .timeline({
      scrollTrigger: { trigger: el, start: 'top top', end, pin: '.statement__pin', scrub: SCRUB },
    })
    .from('.statement__mark .mark__stroke', {
      strokeDashoffset: 1,
      stagger: { each: T.strokeStagger, from: 'center' },
      ease: E.outQuart,
      duration: T.strokeDuration,
    })
    .from(
      '.statement__mark .mark__point',
      { scale: 0, ease: E.outExpo, duration: T.pointDuration },
      T.point
    )
    .from(
      '.statement__hairline',
      { scaleX: 0, ease: E.outExpo, duration: T.hairlineDuration },
      T.hairline
    )
    .from(
      lines,
      { yPercent: 110, stagger: T.lineStagger, ease: E.outExpo, duration: T.lineDuration },
      T.lines
    )
    .to('.statement__mark', { ...RECEDE, ease: E.outQuart, duration: T.recedeDuration }, T.recede)
    .from('.statement__foot', { opacity: 0, ease: E.outQuart, duration: T.footDuration }, T.foot)
    .to({}, { duration: T.hold })
}

export function Statement({ section, numeral }: Props) {
  const root = useRef<HTMLElement>(null)
  const headingId = `${section.id}-title`
  const lines = triadLines(section.subtitle ?? '')
  const [foot] = section.paragraphs

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    let split: SplitText | null = null

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)
      const motionOk = '(prefers-reduced-motion: no-preference)'

      mm.add(
        {
          desktop: `${motionOk} and (min-width: 768px)`,
          mobile: `${motionOk} and (max-width: 767px)`,
        },
        (context) => {
          const end = context.conditions?.desktop ? PIN_DESKTOP : PIN_MOBILE
          const run = () => {
            split = SplitText.create('.statement__lines', {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              // no aria-label on a <p>: axe forbids naming a paragraph, and the
              // split lines read in order as they are
              aria: 'none',
            })
            buildTimeline(el, end, split.lines as HTMLElement[])
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
    <section
      className="statement"
      id={section.id}
      data-n={numeral}
      data-ground="dark"
      data-pinned="true"
      ref={root}
      aria-labelledby={headingId}
    >
      <div className="statement__pin">
        <div className="shell">
          <SectionHeader n={numeral} label={section.title ?? ''} id={headingId} />
        </div>

        <div className="statement__stage">
          <Mark className="statement__mark" animated />
          <span className="statement__hairline" aria-hidden="true" />

          <div className="shell grid12 statement__copy">
            <div className="p-narrow">
              <p className="statement__lines t-d1">
                {lines.map((line) => (
                  <span key={line} className="statement__line">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        {foot && (
          <div className="shell grid12">
            <p className="p-narrow t-lead statement__foot">{foot}</p>
          </div>
        )}
      </div>
    </section>
  )
}
