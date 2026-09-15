// TEMPORARY — replaced by Task 16 (T1 Home template).
//
// A single full-viewport canopy section carrying the client's lockup, so the
// build has a route and the foundation — tokens, fonts, grain, preloader,
// ground manager, scroll rail, cursor — is visible and verifiable. Server
// component; the hero classes it uses are the reusable blocks in sections.css.
import { BRAND } from '@/content/brand'
import { UI } from '@/content/ui'
import { Mark } from '@/components/Mark'
import { AmbientGradientLazy } from '@/webgl/AmbientGradientLazy'

export default function Page() {
  return (
    <main id="main">
      <section className="hero" data-ground="dark" data-n="00" aria-labelledby="hero-wordmark">
        {/* Task 3 proof: the gated ambient gradient behind the lockup. Mounts
            only on an eligible desktop (docs/04 §8); otherwise renders nothing
            and its chunk is never requested. Task 16 keeps it behind the video. */}
        <AmbientGradientLazy className="hero__ambient" opacity={0.35} />
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
