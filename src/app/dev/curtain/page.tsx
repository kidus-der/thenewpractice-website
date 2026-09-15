// TEMPORARY — removed by Task 19.
//
// A second route so the route curtain can be exercised before the real pages
// exist: a canopy first section and a bone second section, each with a link
// home, and a few reveals so ScrollTrigger hygiene across navigations is
// measurable. Server component; hidden on production by SITE_ENV.
//
// The strings below are PLACEHOLDER dev-harness copy and never ship: this
// route answers 404 on production and is deleted with the harness.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { env } from '@/lib/env'
import { Reveal } from '@/motion/Reveal'

const COPY = {
  title: 'Curtain harness',
  eyebrow: 'Development route',
  heading: 'A second page, so the curtain has somewhere to go',
  lead: 'This page exists only to be navigated to and from while the route transition is built.',
  paragraphs: [
    'The first section is canopy, the second is bone, so the ground manager and the scroll rail have a boundary to measure.',
    'Each paragraph is a reveal, so the number of ScrollTriggers this page creates is the number a fresh load of it must also create after three navigations.',
    'Scroll to the bottom before returning: the curtain resets the scroll position under cover, and the test asserts it.',
  ],
  back: 'Return to the lockup',
} as const

export const metadata: Metadata = { title: COPY.title }

export default function Page() {
  if (env().SITE_ENV === 'production') notFound()

  return (
    <main id="main">
      <section className="hero" data-ground="dark" data-n="01" aria-labelledby="curtain-heading">
        <div className="hero__content">
          <div className="hero__lockup">
            <p className="t-eyebrow">{COPY.eyebrow}</p>
            <h1 id="curtain-heading" className="t-d2">
              {COPY.heading}
            </h1>
            <p>
              <Link className="link t-small" href="/">
                {COPY.back}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section" data-ground="light" data-n="02">
        <div className="shell">
          <Reveal as="p" className="t-lead">
            {COPY.lead}
          </Reveal>
          {COPY.paragraphs.map((text) => (
            <Reveal key={text} as="p" className="t-body">
              {text}
            </Reveal>
          ))}
          <Reveal as="p" className="t-small">
            <Link className="link" href="/" data-testid="curtain-return">
              {COPY.back}
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
