'use client'

/**
 * The navigation overlay. docs/05 §Global chrome › Nav overlay; docs/04 §4.
 *
 * A full-viewport canopy panel at --z-overlay — beneath the texture, so the
 * grain runs across it, and beneath the cursor. Motion owns the panel and
 * the items (state-driven: open/closed); GSAP draws the ceiba in the corner
 * once per open, on different elements. The six primary routes are set at
 * --t-d1 in the Didone and enter as masked lines, staggered at the large
 * step after the panel has wiped in; the founder contact fades in last at
 * the eyebrow register. The current route, hover and focus all draw the
 * same brass tick — the line action's rule, laid beside the word rather than
 * under it, running from the page edge toward the label.
 *
 * Closing plays the children out first, then the panel (--d-base). A click
 * on a menu link does not close the overlay: the route curtain covers the
 * panel canopy-over-canopy and the parent closes it when the new route
 * commits, so the page changes under one continuous surface.
 *
 * Accessibility (docs/09 §2): role="dialog" aria-modal with a label; the
 * trigger carries aria-expanded / aria-controls; focus lands on the first
 * link on open and the parent returns it to the trigger on close; Tab and
 * Shift+Tab cycle through the header and the panel; Escape closes; the page
 * behind is inert and its scroll locked (Header).
 *
 * Reduced motion: an opacity fade over --d-fast, no clip-path, no stagger,
 * no draw — chosen through useReducedMotion(), with the CSS safety net
 * behind it.
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { BRAND } from '@/content/brand'
import { NAV, UI_NAV, isActiveRoute } from '@/content/nav'
import { gsap } from '@/motion/gsap'
import { fadeVariants, identityEase, overlayVariants } from '@/motion/motion-config'
import { D, E, STAGGER } from '@/motion/tokens'
import { Mark } from './Mark'
import './NavOverlay.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The panel under reduced motion: opacity only, --d-fast, same variant names. */
const reducedPanelVariants = {
  closed: {
    opacity: fadeVariants.hidden.opacity,
    transition: { type: 'tween', duration: D.fast, ease: identityEase.outExpo },
  },
  open: {
    opacity: fadeVariants.visible.opacity,
    transition: { type: 'tween', duration: D.fast, ease: identityEase.outExpo },
  },
} as const satisfies Variants

/** The contact column: fades, never rises (docs/04 §4 "fade in last"). */
const asideVariants = {
  closed: {
    opacity: fadeVariants.hidden.opacity,
    transition: { type: 'tween', duration: D.fast, ease: identityEase.outExpo },
  },
  open: {
    opacity: fadeVariants.visible.opacity,
    transition: { type: 'tween', duration: D.slow, ease: identityEase.outExpo },
  },
} as const satisfies Variants

/** tel: URIs carry digits and the leading plus only. */
const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`
const mailHref = (email: string): string => `mailto:${email}`

/** Visible, tabbable elements inside the given roots, in document order. */
function focusableWithin(roots: readonly (HTMLElement | null)[]): HTMLElement[] {
  return roots
    .filter((root): root is HTMLElement => root !== null)
    .flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)))
    .filter((el) => el.getClientRects().length > 0 && el.closest('[inert]') === null)
}

type Props = Readonly<{
  id: string
  open: boolean
  pathname: string
  headerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onNavigate: (href: string) => void
}>

type PanelProps = Omit<Props, 'open'> & Readonly<{ reduced: boolean }>

/** Escape closes; Tab and Shift+Tab cycle through the header and the panel. */
function useFocusTrap(
  panel: RefObject<HTMLDivElement | null>,
  headerRef: RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const items = focusableWithin([headerRef.current, panel.current])
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return

      const active = document.activeElement
      const inside = active instanceof HTMLElement && items.includes(active)
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [headerRef, onClose, panel])
}

/** The ceiba draws outward from its point once the panel has wiped in. */
function useMarkDraw(panel: RefObject<HTMLDivElement | null>, reduced: boolean) {
  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.nav-overlay__mark .mark__stroke',
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: D.glacial,
          ease: E.outQuart,
          delay: D.slow,
          stagger: { each: STAGGER.large, from: 'center' },
        }
      )
      gsap.from('.nav-overlay__mark .mark__point', {
        scale: 0,
        duration: D.base,
        ease: E.outExpo,
        delay: D.slow + D.base,
      })
    }, panel.current ?? undefined)
    return () => ctx.revert()
  }, [panel, reduced])
}

function Panel({ id, pathname, reduced, headerRef, onClose, onNavigate }: PanelProps) {
  const panel = useRef<HTMLDivElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    firstLink.current?.focus({ preventScroll: true })
  }, [])
  useFocusTrap(panel, headerRef, onClose)
  useMarkDraw(panel, reduced)

  const itemVariants = reduced ? undefined : overlayVariants.item
  const contactLines = BRAND.locale.split(', ')

  return (
    <motion.div
      ref={panel}
      id={id}
      className="nav-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={UI_NAV.ariaLabels.overlay}
      data-ground="dark"
      data-reduced={reduced ? 'true' : 'false'}
      variants={reduced ? reducedPanelVariants : overlayVariants.panel}
      initial="closed"
      animate="open"
      exit="closed"
    >
      <div className="nav-overlay__inner shell">
        <nav className="nav-overlay__primary" aria-label={UI_NAV.ariaLabels.primary}>
          <ul className="nav-overlay__list">
            {NAV.primary.map((item, index) => (
              <li key={item.href} className="nav-overlay__mask">
                <motion.div className="nav-overlay__line" variants={itemVariants}>
                  <Link
                    ref={index === 0 ? firstLink : undefined}
                    href={item.href}
                    className="nav-overlay__item t-d1"
                    aria-current={isActiveRoute(item.href, pathname) ? 'page' : undefined}
                    onClick={() => onNavigate(item.href)}
                  >
                    <span className="nav-overlay__tick" aria-hidden="true" />
                    {item.label}
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        <motion.div className="nav-overlay__aside" variants={reduced ? undefined : asideVariants}>
          <nav className="nav-overlay__utility" aria-label={UI_NAV.ariaLabels.contact}>
            {NAV.utility.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="line-action t-eyebrow"
                aria-current={isActiveRoute(item.href, pathname) ? 'page' : undefined}
                onClick={() => onNavigate(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <address className="nav-overlay__contact">
            <a className="line-action t-eyebrow" href={telHref(BRAND.phone)}>
              {BRAND.phone}
            </a>
            <a className="line-action t-eyebrow" href={mailHref(BRAND.email)}>
              {BRAND.email}
            </a>
            <p className="nav-overlay__location t-eyebrow muted">
              {contactLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </address>
        </motion.div>

        <div className="nav-overlay__corner" aria-hidden="true">
          <Mark className="nav-overlay__mark" animated={!reduced} />
        </div>
      </div>
    </motion.div>
  )
}

export function NavOverlay({ open, ...rest }: Props) {
  const reduced = useReducedMotion() ?? false
  return (
    <AnimatePresence>
      {open && <Panel key="nav-overlay" reduced={reduced} {...rest} />}
    </AnimatePresence>
  )
}
