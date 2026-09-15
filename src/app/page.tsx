// TEMPORARY — replaced by Task 16 (T1 Home template).
//
// A single full-viewport canopy section carrying the client's lockup, so the
// build has a route and the foundation — tokens, fonts, grain, preloader,
// ground manager, scroll rail, cursor — is visible and verifiable. Server
// component; the hero classes it uses are the reusable blocks in sections.css.
import { BRAND } from '@/content/brand'
import { UI } from '@/content/ui'
import { Mark } from '@/components/Mark'

export default function Page() {
  return (
    <main id="main">
      <section className="hero" data-ground="dark" data-n="00" aria-labelledby="hero-wordmark">
        <div className="hero__scrim" aria-hidden="true" />

        <div className="hero__content">
          <div className="hero__lockup">
            <Mark className="hero__mark" />
            <h1 id="hero-wordmark" className="hero__wordmark">
              {BRAND.nameUpper}
            </h1>
            <span className="hero__rule" aria-hidden="true" />
            <p className="hero__tagline t-eyebrow">{BRAND.tagline}</p>
          </div>

          <p className="hero__meta t-small">
            <span>{BRAND.locale}</span>
          </p>
        </div>

        <div className="hero__cue t-eyebrow" aria-hidden="true">
          <span>{UI.scrollCue}</span>
          <span className="hero__cue-rule" />
        </div>
      </section>
    </main>
  )
}
