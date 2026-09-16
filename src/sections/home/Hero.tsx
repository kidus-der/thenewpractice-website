'use client'

/**
 * 00 — Hero (docs/05 §T1, docs/04 §6 "Hero settle"). The client's opening:
 * the surf loop over its own poster frame, the lockup where the preloader
 * left it, the overlay title lower left, the cue at the foot.
 *
 * Layers, back to front: the section's canopy; the ambient gradient when a
 * desktop is eligible (docs/04 §8); the poster — a priority <Image>, the LCP
 * (docs/09 §1); the <video>, client-only, faded in over the poster once it
 * plays; the scrim; the content.
 *
 * Two entrance clocks. The media settle (scale 1.08 → 1) starts on mount so
 * the poster is painting and settling under the preloader's veil rather than
 * waiting for it — the Task 4 Lighthouse run showed the veil handshake was
 * the LCP (ledger, Task 4). The words wait for `veil:done` so the two
 * entrance moments never overlap (docs/04 §4). The lockup itself does not
 * animate: it is the preloader's lockup in the preloader's place, so when
 * the veil splits it is simply already there.
 *
 * All `from` tweens: the resting state is the finished state. With JS off,
 * or an entrance that never fires, the frame is still complete.
 */
import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import './Hero.css'
import { BRAND } from '@/content/brand'
import { MEDIA, VIDEO, type VideoKey } from '@/content/media'
import type { Hero as HeroContent } from '@/content/schemas'
import type { AudioLabels } from '@/lib/audioToggle'
import { Mark } from '@/components/Mark'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { D, E, STAGGER } from '@/motion/tokens'
import { Reveal } from '@/motion/Reveal'
import { AmbientGradientLazy } from '@/webgl/AmbientGradientLazy'
import { AudioToggle } from './AudioToggle'
import { HeroVideo } from './HeroVideo'

/** docs/04 §6: the settle runs --d-glacial × 1.4; the media parallaxes 12%. */
const SETTLE_SCALE = 1.08
const SETTLE_FACTOR = 1.4
const PARALLAX_PERCENT = 12
/** The content lifts and fades over the first 60% of the hero's scroll. */
const CONTENT_LIFT_PX = -40
const CONTENT_FADE_END = '60% top'
/** The gradient behind the media: the brief's 0.25 (docs/05 said 0.35; CLAUDE.md §6a). */
const AMBIENT_OPACITY = 0.25

type Props = Readonly<{
  hero: HeroContent
  video: VideoKey
  audioLabels: AudioLabels
  /** id of the <h1>, referenced by the section's aria-labelledby. */
  titleId: string
  numeral: string
}>

export function Hero({ hero, video, audioLabels, titleId, numeral }: Props) {
  const root = useRef<HTMLElement>(null)
  const loop = VIDEO[video]
  const poster = MEDIA[loop.poster]

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The settle: from mount, not from the veil (see the file comment).
        gsap.from('.hero__media', {
          scale: SETTLE_SCALE,
          duration: D.glacial * SETTLE_FACTOR,
          ease: E.outExpo,
          onComplete: () => gsap.set('.hero__media', { willChange: 'auto' }),
        })

        // The words. `veil:done` is dispatched from inside the preloader's
        // timeline onComplete, and GSAP makes the calling animation's context
        // current while a callback runs, so a timeline built in the listener
        // with string selectors resolved them against the preloader's root and
        // found nothing (ledger, Task 21). The targets are resolved against the
        // hero here, while this context is live, and the timeline is kept so
        // the matchMedia cleanup reverts it with everything else.
        const q = gsap.utils.selector(el)
        const eyebrow = q('.hero__eyebrow')
        const toggle = q('.hero__toggle')
        const cue = q('.hero__cue')
        let words: gsap.core.Timeline | undefined
        const fadeWordsIn = () => {
          const fade = { opacity: 0, duration: D.slow, ease: E.outExpo }
          words = gsap.timeline().from(eyebrow, fade, 0.2)
          // No recording, no toggle (HOME.hero.audioSrc is null): GSAP warns on an empty target.
          if (toggle.length) words.from(toggle, fade, D.base + STAGGER.large)
          words.from(cue, fade, D.slow)
        }
        if (document.documentElement.dataset.veil === 'done') fadeWordsIn()
        else window.addEventListener('veil:done', fadeWordsIn, { once: true })

        // Scroll: the media parallaxes, the words lift away. Never parallax text.
        gsap.to('.hero__media', {
          yPercent: PARALLAX_PERCENT,
          ease: E.linear,
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        })
        gsap.to('.hero__content', {
          y: CONTENT_LIFT_PX,
          opacity: 0,
          ease: E.linear,
          scrollTrigger: { trigger: el, start: 'top top', end: CONTENT_FADE_END, scrub: true },
        })

        return () => {
          window.removeEventListener('veil:done', fadeWordsIn)
          words?.revert()
        }
      })

      return () => mm.revert()
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section
      className="hero"
      data-ground="dark"
      data-n={numeral}
      ref={root}
      aria-labelledby={titleId}
    >
      <AmbientGradientLazy className="hero__ambient" opacity={AMBIENT_OPACITY} />

      <div className="hero__media">
        <Image
          className="hero__poster"
          src={poster.src}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          placeholder="blur"
          blurDataURL={poster.blurDataURL}
        />
        <HeroVideo loop={loop} posterSrc={poster.src} className="hero__video" />
      </div>
      <div className="hero__scrim" aria-hidden="true" />

      {/* The client's lockup, in the preloader's place: mark, wordmark™, rule, tagline. */}
      <div className="hero__lockup">
        <Mark className="hero__mark" />
        <p className="hero__wordmark">
          {BRAND.nameUpper}
          <sup className="hero__tm">{BRAND.trademark}</sup>
        </p>
        <span className="hero__rule" aria-hidden="true" />
        <p className="hero__tagline t-eyebrow">{BRAND.tagline}</p>
      </div>

      <div className="hero__content shell">
        <div className="hero__title-block">
          <p className="hero__eyebrow t-eyebrow">{hero.subtitle}</p>
          <Reveal variant="lines" as="h1" id={titleId} className="hero__title t-d1">
            {hero.title}
          </Reveal>
        </div>
        {hero.audioSrc && (
          <AudioToggle src={hero.audioSrc} labels={audioLabels} className="hero__toggle" />
        )}
      </div>

      <div className="hero__cue t-eyebrow" aria-hidden="true">
        <span>{hero.cue}</span>
        <span className="hero__cue-rule" />
      </div>
    </section>
  )
}
