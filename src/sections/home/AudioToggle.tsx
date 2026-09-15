'use client'

/**
 * The hero's Listen / Mute line action (plan §3.3 T1, docs/08 §Audio). Opt-in
 * and default off: the <audio> element carries no `src` until the first
 * press, never autoplays, fades in over --d-glacial and out over --d-slow,
 * and falls silent when the track ends or the tab is hidden. The state rules
 * are the pure reducer in src/lib/audioToggle.ts.
 *
 * Mounted only when pages/home.ts carries an `audioSrc`; today it does not,
 * so this component ships unmounted (docs/05 §T1).
 */
import { useEffect, useReducer, useRef } from 'react'
import './AudioToggle.css'
import { LineActionButton } from '@/components/LineAction'
import { gsap } from '@/motion/gsap'
import { D, E, prefersReducedMotion } from '@/motion/tokens'
import {
  INITIAL_AUDIO_STATE,
  audioLabel,
  audioReducer,
  shouldLoadAudio,
  type AudioLabels,
} from '@/lib/audioToggle'

type Props = Readonly<{ src: string; labels: AudioLabels; className?: string }>

export function AudioToggle({ src, labels, className }: Props) {
  const [state, dispatch] = useReducer(audioReducer, INITIAL_AUDIO_STATE)
  const audio = useRef<HTMLAudioElement>(null)

  // Drive the element from state: play with a fade in, or fade out then pause.
  useEffect(() => {
    const el = audio.current
    if (!el || !state.requested || state.failed) return
    const instant = prefersReducedMotion()

    if (state.active) {
      el.volume = instant ? 1 : 0
      el.play().then(
        () => {
          if (!instant) gsap.to(el, { volume: 1, duration: D.glacial, ease: E.outExpo })
        },
        () => dispatch({ type: 'error' })
      )
      return
    }

    if (el.paused) return
    if (instant) {
      el.pause()
      return
    }
    gsap.to(el, { volume: 0, duration: D.slow, ease: E.outQuart, onComplete: () => el.pause() })
    return () => gsap.killTweensOf(el)
  }, [state.active, state.requested, state.failed])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') dispatch({ type: 'hidden' })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <div className={className}>
      <LineActionButton
        type="button"
        className="audio-toggle"
        aria-pressed={state.active}
        onClick={() => dispatch({ type: 'toggle' })}
      >
        <span className="audio-toggle__bars" aria-hidden="true" data-active={state.active}>
          <span />
          <span />
          <span />
        </span>
        {audioLabel(state, labels)}
      </LineActionButton>
      <audio
        ref={audio}
        preload="none"
        src={shouldLoadAudio(state) ? src : undefined}
        onEnded={() => dispatch({ type: 'ended' })}
        onError={() => dispatch({ type: 'error' })}
      />
    </div>
  )
}
