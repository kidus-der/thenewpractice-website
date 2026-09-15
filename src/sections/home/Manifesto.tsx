'use client'

/**
 * Why The New Practice? — the scrubbed manifesto (docs/04 §6 "Scrubbed
 * manifesto", docs/05 §T1). The client's opening statement, at display size
 * on canopy, pinned 1.5× viewport and revealed line by line on `scrub: 0.8`
 * so the reader sets the pace of the sentence; the four paragraphs that
 * follow stand beneath it at the reading placement. Unpinned under reduced
 * motion, where the lines are simply there.
 *
 * Nested inside the philosophy section as its one subsection, so the label
 * is an h3 and the outline holds.
 */
import { useLayoutEffect, useRef } from 'react'
import './Manifesto.css'
import type { Section } from '@/content/schemas'
import { SectionHeader } from '@/components/SectionHeader'
import { gsap, ScrollTrigger, SplitText } from '@/motion/gsap'
import { E } from '@/motion/tokens'
import { Reveal } from '@/motion/Reveal'

/** docs/04 §6: pinned 1.5× viewport, scrub 0.8. */
const PIN = '+=150%'
const SCRUB = 0.8
/** Lines a scrub-half-second apart, then a hold before the pin releases. */
const LINE_STAGGER = 0.5
const HOLD = 0.4

type Props = Readonly<{ section: Section; numeral: string }>

export function Manifesto({ section, numeral }: Props) {
  const root = useRef<HTMLElement>(null)
  const headingId = `${section.id}-title`
  const [statement, ...rest] = section.paragraphs

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    let split: SplitText | null = null

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const run = () => {
          split = SplitText.create('.manifesto__statement', {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            // no aria-label on a <p> (axe aria-prohibited-attr); the lines read in order
            aria: 'none',
          })
          gsap
            .timeline({
              scrollTrigger: {
                trigger: '.manifesto__pin',
                start: 'top top',
                end: PIN,
                pin: true,
                scrub: SCRUB,
              },
            })
            .from(split.lines, { yPercent: 110, stagger: LINE_STAGGER, ease: E.outExpo })
            .to({}, { duration: HOLD })
        }
        if (document.fonts?.status === 'loaded') run()
        else void document.fonts?.ready.then(run)
      })

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
      <div className="manifesto__pin">
        <div className="shell grid12">
          <div className="p-lead">
            <SectionHeader as="h3" n={numeral} label={section.title ?? ''} id={headingId} />
            <p className="manifesto__statement">{statement}</p>
          </div>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="shell grid12">
          <Reveal staggerChildren className="p-lead manifesto__prose">
            {rest.map((text) => (
              <p key={text} className="t-body">
                {text}
              </p>
            ))}
          </Reveal>
        </div>
      )}
    </section>
  )
}
