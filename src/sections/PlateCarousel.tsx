'use client'

/**
 * The drifting plate carousel (docs/04 §6 "Drifting carousel", docs/05 §T5),
 * ported from the concept site's house section. The plate list is rendered
 * twice and the track travels exactly -50% over one cycle, so the second copy
 * lands where the first began and the loop is seamless; the duplicate is
 * aria-hidden and lazy, so a screen reader hears six captions once and the
 * browser fetches six files once. The primary set is eager: the track sits in
 * an overflow-hidden viewport and is moving, so a lazy plate would only begin
 * loading as it drifted into frame.
 *
 * Motion: one linear GSAP tween inside matchMedia, paused while the section
 * is offscreen, eased to a near-stop on hover or focus so a caption can be
 * read. Under reduced motion no tween is created and the stylesheet turns the
 * viewport into a native scroll-snap track with the single set (the duplicate
 * is display: none there), and the viewport becomes a focusable, named region
 * so the keyboard can reach a scroller nothing else moves. No pin, no scrub,
 * no drag.
 */
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import './PlateCarousel.css'
import { Plate } from '@/components/Plate'
import type { MediaKey } from '@/content/media'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { D, E } from '@/motion/tokens'
import { MOTION_OK, useMediaQuery } from '@/motion/useMediaQuery'
import { plateCounter, type ResidencePlate } from '@/lib/residences'

/** Seconds for one full pass of the set — slow enough to read as drift (docs/04 §6). */
const CYCLE_SECONDS = 34
/** Hover and focus slow the drift to this fraction rather than stopping it dead. */
const READING_TIME_SCALE = 0.15
const RUNNING_TIME_SCALE = 1
/** The frame is 3:4 at up to 390px wide from 768px (PlateCarousel.css). */
const SIZES = '(min-width: 768px) 390px, 62vw'

export type ObjectPositions = Readonly<Partial<Record<MediaKey, 'top' | 'center' | 'bottom'>>>

type Props = {
  plates: readonly ResidencePlate[]
  numeral: string
  /** Accessible name of the section; the block has no heading in the content. */
  label: string
  /** Per-frame crop anchor, for a source whose subject sits at one edge. */
  objectPositions?: ObjectPositions
}

type ItemStyle = CSSProperties & { '--plate-position'?: string }

function useDrift(root: React.RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const track = el.querySelector<HTMLElement>('.plate-carousel__track')
        if (!track) return

        const drift = gsap.to(track, {
          xPercent: -50,
          ease: E.linear,
          duration: CYCLE_SECONDS,
          repeat: -1,
        })

        // Idle offscreen: a tween against a section nobody is looking at is pure cost.
        const visibility = ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? drift.play() : drift.pause()),
        })
        if (!visibility.isActive) drift.pause()

        const ease = (to: number) => gsap.to(drift, { timeScale: to, duration: D.slow })
        const slow = () => ease(READING_TIME_SCALE)
        const resume = () => ease(RUNNING_TIME_SCALE)
        el.addEventListener('pointerenter', slow)
        el.addEventListener('pointerleave', resume)
        el.addEventListener('focusin', slow)
        el.addEventListener('focusout', resume)

        return () => {
          el.removeEventListener('pointerenter', slow)
          el.removeEventListener('pointerleave', resume)
          el.removeEventListener('focusin', slow)
          el.removeEventListener('focusout', resume)
          visibility.kill()
          drift.kill()
        }
      })

      return () => mm.revert()
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [root])
}

type ItemProps = {
  plate: ResidencePlate
  total: number
  duplicate: boolean
  position?: string
}

function Item({ plate, total, duplicate, position }: ItemProps) {
  const style: ItemStyle | undefined = position ? { '--plate-position': position } : undefined
  return (
    <li
      className="plate-carousel__item"
      data-duplicate={duplicate ? '' : undefined}
      aria-hidden={duplicate ? true : undefined}
      style={style}
    >
      <figure className="plate-carousel__figure">
        <Plate
          media={plate.media}
          alt={duplicate ? '' : plate.alt}
          sizes={SIZES}
          className="plate-carousel__frame"
          loading={duplicate ? 'lazy' : 'eager'}
        />
        <figcaption className="plate-carousel__caption t-small">
          <span>{plate.caption}</span>
          <span className="plate-carousel__meta t-eyebrow">
            <span aria-hidden="true">{plateCounter(plate.index, total)}</span>
            <span className="plate-carousel__credit">{plate.credit}</span>
          </span>
        </figcaption>
      </figure>
    </li>
  )
}

export function PlateCarousel({ plates, numeral, label, objectPositions }: Props) {
  const root = useRef<HTMLElement>(null)
  useDrift(root)
  const total = plates.length
  // Server and first client render assume motion reduced (useMediaQuery), so
  // the scroller is reachable before hydration and hands the stop back after.
  const motionOk = useMediaQuery(MOTION_OK)
  const scroller = motionOk ? {} : { tabIndex: 0, role: 'region', 'aria-label': label }

  return (
    <section
      ref={root}
      className="plate-carousel"
      data-ground="mid"
      data-n={numeral}
      aria-label={label}
    >
      <div className="shell">
        <p className="eyebrow t-eyebrow plate-carousel__eyebrow" aria-hidden="true">
          <span>{numeral}</span>
          <span className="eyebrow__rule" />
        </p>
      </div>
      <div className="plate-carousel__viewport" {...scroller}>
        <ul className="plate-carousel__track">
          {plates.map((plate) => (
            <Item
              key={plate.media}
              plate={plate}
              total={total}
              duplicate={false}
              position={objectPositions?.[plate.media]}
            />
          ))}
          {plates.map((plate) => (
            <Item
              key={`${plate.media}-loop`}
              plate={plate}
              total={total}
              duplicate
              position={objectPositions?.[plate.media]}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
