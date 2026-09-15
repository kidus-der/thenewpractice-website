'use client'

/**
 * The fixed header. docs/05 §Global chrome › Header; docs/04 §4.
 *
 * Left: the ceiba at 16px and the wordmark, one link home — the only place
 * the wordmark appears in the chrome, and never with the ™ (ledger triage of
 * Task 1). Right, from 1024px: the six primary routes as line actions with
 * the brass rule already drawn under the current one, then Enquire. Below
 * 1024px: a single Menu line action whose label reads Close while the overlay
 * is open.
 *
 * Ground. The header floats outside every section, so it reads --ground-fg
 * from <html> (GroundManager) at all times, not only once settled — an
 * interior page opens on bone, and a bone header over it would vanish. The
 * CSS carries a :has() fallback for the moment before hydration.
 *
 * Scroll (GSAP, ported from the concept site): transparent over the first
 * viewport; past 90vh it settles — ground fill, hairline; past 200vh it hides
 * on scroll-down and returns on scroll-up. One context, reverted on unmount.
 *
 * Menu state is derived, never synchronised: a route commit or a resize past
 * the desktop threshold resets it during render, in the same pass that
 * changes the page. While the overlay is open the header sits above it
 * (--z-overlay + 1) so the trigger stays reachable; the moment a menu link is
 * clicked it drops back under, so the route curtain covers header and
 * overlay together and the page changes beneath one continuous canopy.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BRAND } from '@/content/brand'
import { NAV, UI_NAV, isActiveRoute, routes } from '@/content/nav'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { startScroll, stopScroll } from '@/motion/SmoothScroll'
import { useMediaQuery } from '@/motion/useMediaQuery'
import { Mark } from './Mark'
import { NavOverlay } from './NavOverlay'
import './Header.css'

/** docs/04 §4: settle past 90vh, hide-on-scroll-down past 200vh. */
const SETTLE_AT_VH = 0.9
const HIDE_AFTER_VH = 2
/** docs/03 §7: the threshold for desktop-only behaviour. */
const DESKTOP_NAV = '(min-width: 1024px)'
/** Everything behind the overlay that must neither be read nor focused. */
const PAGE_BEHIND = 'main, footer'

type MenuState = Readonly<{
  /** The route the menu was opened on; any other route means it is closed. */
  pathname: string
  /** A menu link has been activated: the curtain now owns the transition. */
  navigating: boolean
}>

function setPageInert(inert: boolean) {
  document.querySelectorAll(PAGE_BEHIND).forEach((el) => {
    if (inert) el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  })
}

function useHeaderScroll(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: () => window.innerHeight * SETTLE_AT_VH,
        onToggle: (self) => {
          el.dataset.settled = String(self.isActive)
        },
      })

      ScrollTrigger.create({
        start: () => window.innerHeight * HIDE_AFTER_VH,
        end: 'max',
        onUpdate: (self) => {
          // A page too short to scroll 200vh can never hide the header. With
          // start past the scrollable range ScrollTrigger clamps it onto end
          // and reports a phantom scroll-down on refresh; the guard ignores it.
          const reachable = self.end > self.start
          el.dataset.hidden = String(reachable && self.direction === 1)
        },
        onLeaveBack: () => {
          el.dataset.hidden = 'false'
        },
      })
    })

    return () => ctx.revert()
  }, [ref])
}

function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    stopScroll()
    setPageInert(true)
    return () => {
      setPageInert(false)
      startScroll()
    }
  }, [locked])
}

export function Header() {
  const ref = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const desktop = useMediaQuery(DESKTOP_NAV)
  const overlayId = useId()
  const [menu, setMenu] = useState<MenuState | null>(null)

  // Adjusting state during render (the React-sanctioned pattern for state
  // that depends on a prop): the menu belongs to the route it opened on and
  // to viewports below the desktop threshold. Anything else closes it.
  if (menu && (menu.pathname !== pathname || desktop)) setMenu(null)

  const open = menu !== null && menu.pathname === pathname && !desktop
  const aboveOverlay = open && !menu.navigating

  useHeaderScroll(ref)
  useScrollLock(open)

  const openMenu = () => setMenu({ pathname, navigating: false })
  const closeMenu = () => {
    setMenu(null)
    trigger.current?.focus({ preventScroll: true })
  }
  const onNavigate = (href: string) => {
    if (href === pathname) {
      closeMenu()
      return
    }
    setMenu((current) => (current ? { ...current, navigating: true } : current))
  }

  return (
    <>
      <header
        ref={ref}
        className="site-header"
        data-settled="false"
        data-hidden="false"
        data-menu-open={aboveOverlay ? 'true' : 'false'}
      >
        {/* With JS off nothing can open the overlay: the primary links, present
            in the DOM at every width, are shown instead of the trigger
            (docs/09 §3). */}
        <noscript>
          <style>{`.site-header__nav{display:flex;flex-wrap:wrap}.site-header__trigger{display:none}`}</style>
        </noscript>

        <div className="site-header__inner shell">
          <Link href={routes.home} className="site-header__lockup" aria-label={BRAND.name}>
            <Mark className="site-header__ceiba" />
            <span className="site-header__wordmark">{BRAND.nameUpper}</span>
          </Link>

          <div className="site-header__right">
            <nav className="site-header__nav" aria-label={UI_NAV.ariaLabels.primary}>
              <ul className="site-header__links">
                {NAV.primary.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="line-action t-eyebrow"
                      aria-current={isActiveRoute(item.href, pathname) ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {NAV.utility.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="line-action t-eyebrow site-header__utility"
                  aria-current={isActiveRoute(item.href, pathname) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              ref={trigger}
              type="button"
              className="line-action t-eyebrow site-header__trigger"
              aria-expanded={open}
              aria-controls={overlayId}
              onClick={open ? closeMenu : openMenu}
            >
              {/* Both labels occupy one cell so the trigger never changes
                  width when it flips; the inactive one is invisible and
                  therefore out of the accessible name. */}
              <span className="site-header__swap">
                <span className="site-header__swap-label" data-active={!open}>
                  {UI_NAV.menu}
                </span>
                <span className="site-header__swap-label" data-active={open}>
                  {UI_NAV.close}
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <NavOverlay
        id={overlayId}
        open={open}
        pathname={pathname}
        headerRef={ref}
        onClose={closeMenu}
        onNavigate={onNavigate}
      />
    </>
  )
}
