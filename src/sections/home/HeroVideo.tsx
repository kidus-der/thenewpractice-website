'use client'

/**
 * The hero's loop, layered over the poster (docs/08 §Video specifics, ledger
 * triage of Task 2b). Rendered only after hydration and only when motion is
 * allowed and the connection is not on data saver, so the server HTML carries
 * the poster alone: the poster is the LCP and the video request never
 * competes with it. Under reduced motion this component renders nothing and
 * the poster stands (docs/04 §7).
 *
 * The element starts at opacity 0 and fades in over --d-slow once it can
 * play, so the poster's duotone never cuts to the loop's colour. If autoplay
 * is refused (iOS Low Power Mode, an old policy) the promise rejects, the
 * element stays transparent and the poster remains the hero.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { VIDEO } from '@/content/media'
import { gsap } from '@/motion/gsap'
import { D, E } from '@/motion/tokens'
import { MOTION_OK } from '@/motion/useMediaQuery'

type Loop = (typeof VIDEO)[keyof typeof VIDEO]

type Props = Readonly<{ loop: Loop; posterSrc: string; className?: string }>

type NavigatorHints = Navigator & { connection?: { saveData?: boolean } }

/** HAVE_FUTURE_DATA: enough buffered to start; the same bar `canplay` uses. */
const CAN_PLAY_READY_STATE = 3

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(MOTION_OK)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  const saveData = (navigator as NavigatorHints).connection?.saveData === true
  return window.matchMedia(MOTION_OK).matches && !saveData
}

const getServerSnapshot = (): boolean => false

/** True on the client when the loop may load: motion allowed, no data saver. */
export function useVideoAllowed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function HeroVideo({ loop, posterSrc, className }: Props) {
  const allowed = useVideoAllowed()
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!allowed || !video) return

    // React does not reflect `muted` into the server markup, and autoplay
    // policy reads the property before play(); set it here, before any call.
    video.muted = true

    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      gsap.to(video, { opacity: 1, duration: D.slow, ease: E.outExpo })
    }

    const start = () => {
      video.play().then(reveal, () => {
        // Autoplay refused: the poster stays. Nothing to log; this is a policy, not a fault.
      })
    }

    // `playing` as well as the play() promise: on a slow decode the promise can
    // settle well after the first frame is on screen.
    video.addEventListener('playing', reveal, { once: true })
    if (video.readyState >= CAN_PLAY_READY_STATE) start()
    else video.addEventListener('canplay', start, { once: true })

    return () => {
      video.removeEventListener('canplay', start)
      video.removeEventListener('playing', reveal)
      gsap.killTweensOf(video)
      video.pause()
    }
  }, [allowed])

  if (!allowed) return null

  return (
    <video
      ref={ref}
      className={className}
      muted
      playsInline
      loop
      preload="metadata"
      poster={posterSrc}
      width={loop.width}
      height={loop.height}
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    >
      <source src={loop.webm} type="video/webm" />
      <source src={loop.mp4} type="video/mp4" />
    </video>
  )
}
