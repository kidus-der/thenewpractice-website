'use client'

/**
 * The route curtain. docs/04-motion-system.md §4 "Route transitions".
 *
 * Every client-side navigation after the first load: a canopy panel rises over
 * the outgoing page while the small ceiba draws outward from its point; under
 * cover the route commits, scroll resets to the top and ScrollTrigger measures
 * the new page; then the panel wipes away upward. Reduced motion: an opacity
 * fade over --d-fast, no clip-path, no draw. Any input skips to the end, as
 * with the preloader. Focus lands on the new <main> and the page title is
 * announced politely.
 *
 * WHERE IT LIVES. app/template.tsx renders <RouteCurtain /> so the curtain
 * owns no slot in layout.tsx. But a root template re-mounts only when the
 * top-level segment changes (/ → /about, not /team/a → /team/b), and when it
 * does it re-mounts at the exact moment the new route commits — the middle of
 * the choreography. Nothing about a transition can therefore live in React
 * state. The controller below is module-level: the phase store, the click
 * interception, the pending navigation. Each mounted component is a view of
 * it: it paints the panel for the current phase (an instance mounting
 * mid-transition paints it already covered, in the same commit that removed
 * the previous one, so no frame shows the page), registers its animate
 * functions, and reports pathname commits. The panel is portalled into a
 * body-level host so it never sits inside the page it covers.
 *
 * WHY CLICKS ARE INTERCEPTED. usePathname() changes only once the new page is
 * committed, so a curtain keyed on it alone would always cover the page it is
 * about to reveal. Internal link clicks are caught in the capture phase, the
 * cover plays over the outgoing page, and router.push runs once covered. Next's
 * <Link> honours the preventDefault. Navigations that cannot be intercepted
 * (back/forward, programmatic pushes) snap the panel on and play the reveal.
 *
 * GSAP/Motion boundary (docs/04 §0): the panel is Motion, state-driven, on the
 * curtainVariants clip-paths. The mark strokes are a GSAP tween on different
 * elements — the preloader's draw — and GSAP is where ScrollTrigger.refresh()
 * comes from. No element is driven by both.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useAnimate, useReducedMotion, type AnimationPlaybackControls } from 'motion/react'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { curtainVariants, fadeVariants, identityEase } from '@/motion/motion-config'
import { D, E, STAGGER } from '@/motion/tokens'
import { resetScroll, startScroll, stopScroll } from '@/motion/SmoothScroll'
import { Mark } from './Mark'
import './RouteCurtain.css'

/* ------------------------------------------------------------------------ */
/* Phase store — one immutable state object, replaced never mutated          */
/* ------------------------------------------------------------------------ */

export type Phase = 'idle' | 'covering' | 'covered' | 'revealing'
type CurtainState = Readonly<{ phase: Phase; skipped: boolean }>

const IDLE: CurtainState = { phase: 'idle', skipped: false }
let state: CurtainState = IDLE
const listeners = new Set<() => void>()

const curtainStore = {
  get: (): CurtainState => state,
  set: (patch: Partial<CurtainState>): void => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

const getPhase = () => state.phase
const getServerPhase = (): Phase => 'idle'
const useCurtainPhase = () => useSyncExternalStore(curtainStore.subscribe, getPhase, getServerPhase)

/**
 * Cover and reveal each run at --d-slow so a whole transition — cover, hold,
 * reveal — fits the 1.6s budget. curtainVariants carry --d-glacial, which is
 * right for a single wipe and too long for two back to back; their clip-paths
 * are used as written, the duration is the one thing tuned here.
 */
const PANEL_DURATION = D.slow
const PANEL_TRANSITION = { duration: PANEL_DURATION, ease: identityEase.inOutQuart } as const
const FADE_TRANSITION = { duration: D.fast, ease: identityEase.outExpo } as const
/** The strokes finish drawing inside the cover: --d-base plus five steps of stagger. */
const STROKE_DURATION = D.base
/** A pushed route that never commits must not leave the page covered. */
const COMMIT_WATCHDOG_MS = D.glacial * 6 * 1000
const HOST_ID = 'route-curtain-host'
const STATUS_CLASS = 'route-curtain__status'
const MAIN = 'main'

type CurtainView = Readonly<{
  cover: () => Promise<void>
  reveal: () => Promise<void>
  skip: () => void
}>

/* ------------------------------------------------------------------------ */
/* Controller — module level, survives template re-mounts                    */
/* ------------------------------------------------------------------------ */

let view: CurtainView | null = null
let lastPathname: string | null = null
let generation = 0
let watchdog: ReturnType<typeof setTimeout> | undefined

const nextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

function host(): HTMLElement {
  const existing = document.getElementById(HOST_ID)
  if (existing) return existing
  const el = document.createElement('div')
  el.id = HOST_ID
  // Created once and never re-rendered by React: a live region only speaks
  // when it existed before its text changed.
  const status = document.createElement('div')
  status.className = STATUS_CLASS
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  el.append(status)
  document.body.append(el)
  return el
}

function announce(text: string) {
  const status = host().querySelector(`.${STATUS_CLASS}`)
  if (status) status.textContent = text
}

/** Focus and scroll cannot land under the curtain while it is up. */
function setPageInert(inert: boolean) {
  document.querySelectorAll(MAIN).forEach((el) => {
    if (inert) el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  })
}

const skipOnInput = () => {
  curtainStore.set({ skipped: true })
  view?.skip()
}

function lockPage() {
  stopScroll()
  setPageInert(true)
  window.addEventListener('keydown', skipOnInput)
  window.addEventListener('pointerdown', skipOnInput)
  window.addEventListener('wheel', skipOnInput, { passive: true })
}

function unlockPage() {
  window.removeEventListener('keydown', skipOnInput)
  window.removeEventListener('pointerdown', skipOnInput)
  window.removeEventListener('wheel', skipOnInput)
  setPageInert(false)
  startScroll()
}

/** Hands focus to the visible <main> so assistive tech starts at the new page. */
function focusPage() {
  const mains = Array.from(document.querySelectorAll<HTMLElement>(MAIN))
  const main = mains.find((el) => el.getClientRects().length > 0) ?? mains[0]
  if (!main) return
  main.tabIndex = -1
  main.dataset.routeFocus = ''
  main.focus({ preventScroll: true })
}

/** Cover the outgoing page, then navigate. Called from the click interceptor. */
async function beginTransition(navigate: () => void) {
  if (curtainStore.get().phase !== 'idle' || !view) {
    navigate()
    return
  }
  curtainStore.set({ phase: 'covering', skipped: false })
  lockPage()
  await view.cover()
  // A commit that arrived meanwhile (back button) has taken over.
  if (curtainStore.get().phase !== 'covering') return
  curtainStore.set({ phase: 'covered' })
  navigate()
  clearTimeout(watchdog)
  watchdog = setTimeout(() => {
    if (curtainStore.get().phase === 'covered') void settle()
  }, COMMIT_WATCHDOG_MS)
}

/** The new route is in the DOM: reset, measure, reveal, hand over. */
async function settle() {
  clearTimeout(watchdog)
  const mine = ++generation
  const { phase } = curtainStore.get()
  if (phase === 'revealing') view?.skip()
  if (phase !== 'covered') curtainStore.set({ phase: 'covered', skipped: false })
  // The new <main> mounted without the attribute; Lenis stop is idempotent.
  lockPage()
  resetScroll()
  await nextPaint()
  if (mine !== generation) return
  ScrollTrigger.refresh()
  curtainStore.set({ phase: 'revealing' })
  await view?.reveal()
  if (mine !== generation) return
  curtainStore.set({ phase: 'idle', skipped: false })
  unlockPage()
  focusPage()
  announce(document.title)
}

function onPathnameCommitted(pathname: string) {
  if (lastPathname === null) {
    // First load belongs to the preloader.
    lastPathname = pathname
    return
  }
  if (pathname === lastPathname) return
  lastPathname = pathname
  void settle()
}

/** The href of a same-origin page change under a plain left click, else null. */
function interceptableHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  if (!(event.target instanceof Element)) return null
  const anchor = event.target.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return null
  if (anchor.target && anchor.target !== '_self') return null
  if (anchor.hasAttribute('download') || anchor.rel.split(/\s+/).includes('external')) return null
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return null
  // Hash and query changes on the same page are not page changes.
  if (url.pathname === window.location.pathname) return null
  return `${url.pathname}${url.search}${url.hash}`
}

/* ------------------------------------------------------------------------ */
/* Dev hook — Playwright reads these; never shipped                         */
/* ------------------------------------------------------------------------ */

declare global {
  interface Window {
    __tnp?: Readonly<{ scrollTriggerCount?: () => number; curtainPhase?: () => Phase }>
  }
}

function installDevHooks() {
  if (process.env.NODE_ENV === 'production') return
  window.__tnp = {
    ...window.__tnp,
    scrollTriggerCount: () => ScrollTrigger.getAll().length,
    curtainPhase: () => curtainStore.get().phase,
  }
}

/* ------------------------------------------------------------------------ */
/* View                                                                     */
/* ------------------------------------------------------------------------ */

const isCovered = (phase: Phase) => phase === 'covered' || phase === 'revealing'

/** What the panel must show at rest in each phase; the animations move between these. */
function panelStyle(phase: Phase, reduced: boolean): CSSProperties {
  if (reduced) {
    return {
      opacity: isCovered(phase) ? fadeVariants.visible.opacity : fadeVariants.hidden.opacity,
    }
  }
  return {
    clipPath: isCovered(phase) ? curtainVariants.cover.clipPath : curtainVariants.hidden.clipPath,
  }
}

function drawStrokes(panel: HTMLElement) {
  return gsap.fromTo(
    panel.querySelectorAll('.mark__stroke'),
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      duration: STROKE_DURATION,
      ease: E.outQuart,
      stagger: { each: STAGGER.default, from: 'center' },
    }
  )
}

export function RouteCurtain() {
  const pathname = usePathname()
  const router = useRouter()
  const reduced = useReducedMotion() ?? false
  const phase = useCurtainPhase()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const controls = useRef<AnimationPlaybackControls | null>(null)
  const strokes = useRef<gsap.core.Tween | null>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    // The host is a browser-only element: rendering nothing first keeps the
    // server and client markup identical, and this layout effect re-renders
    // before paint, so an instance mounting mid-transition never shows a gap.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContainer(host())
    installDevHooks()
  }, [])

  // Register this instance as the controller's view, and paint the phase it
  // mounted into. Runs again if the reduced-motion preference flips.
  useLayoutEffect(() => {
    const panel = scope.current
    if (!panel) return

    if (!reduced && isCovered(curtainStore.get().phase)) {
      gsap.set(panel.querySelectorAll('.mark__stroke'), { strokeDashoffset: 0 })
    }

    // Every animation names its origin keyframe as well as its target. The
    // panel's resting style is not a safe origin: a finished Web Animation
    // keeps its fill until the next one starts, so a cover that read the
    // current value would begin where the last reveal ended and wipe the
    // wrong way.
    const run = async (
      target: Record<string, readonly [string | number, string | number]>,
      transition: object
    ) => {
      const animation = animate(panel, target, transition)
      controls.current = animation
      if (curtainStore.get().skipped) animation.complete()
      await animation
    }

    const instance: CurtainView = {
      cover: async () => {
        if (reduced) {
          return run(
            { opacity: [fadeVariants.hidden.opacity, fadeVariants.visible.opacity] },
            FADE_TRANSITION
          )
        }
        strokes.current = drawStrokes(panel)
        return run(
          { clipPath: [curtainVariants.hidden.clipPath, curtainVariants.cover.clipPath] },
          PANEL_TRANSITION
        )
      },
      reveal: async () => {
        if (reduced) {
          return run(
            { opacity: [fadeVariants.visible.opacity, fadeVariants.exit.opacity] },
            FADE_TRANSITION
          )
        }
        return run(
          { clipPath: [curtainVariants.cover.clipPath, curtainVariants.reveal.clipPath] },
          PANEL_TRANSITION
        )
      },
      skip: () => {
        controls.current?.complete()
        strokes.current?.progress(1)
      },
    }
    view = instance

    return () => {
      if (view === instance) view = null
      strokes.current?.kill()
    }
  }, [animate, container, reduced, scope])

  // A pathname change means the new route is committed. Layout effect, so an
  // un-intercepted navigation is covered before the browser paints it.
  useLayoutEffect(() => {
    onPathnameCommitted(pathname)
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const href = interceptableHref(event)
      if (!href) return
      event.preventDefault()
      void beginTransition(() => router.push(href))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  if (!container) return null

  return createPortal(
    <div
      ref={scope}
      className="route-curtain"
      data-phase={phase}
      aria-hidden="true"
      style={panelStyle(phase, reduced)}
    >
      <Mark className="route-curtain__mark" animated={!reduced} />
    </div>,
    container
  )
}
