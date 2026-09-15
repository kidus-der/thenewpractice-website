import type { Metadata, Viewport } from 'next'
import { Bodoni_Moda, Jost } from 'next/font/google'
import './globals.css'
// Order matters: section styles must cascade after the shared component styles
// in globals.css, or overrides like .manifesto__body's measure lose the tie.
import './sections.css'

import { UI } from '@/content/ui'
import { Grain } from '@/components/Grain'
import { GroundManager } from '@/components/GroundManager'
import { Preloader } from '@/components/Preloader'
import { ScrollRail } from '@/components/ScrollRail'
import { Cursor } from '@/components/Cursor'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SmoothScroll } from '@/motion/SmoothScroll'
import { MotionProvider } from '@/motion/motion-config'
import { env } from '@/lib/env'
import { buildMetadata } from '@/lib/seo'
import { routes } from '@/content/nav'
import { ROUTE_SEO } from '@/content/seo'

/**
 * The identity specifies a high-contrast Didone in the Didot/Bodoni family —
 * the Cartier/Vogue/Chanel register — paired with a plain geometric sans.
 * Bodoni Moda is a genuine Didone with optical sizing; Jost is the closest
 * Futura-style geometric on Google Fonts. That pairing is the classic one.
 *
 * Both are stand-ins. Typeface licensing is the client's (contract §3), and
 * this file is the single swap point when the foundry originals arrive.
 */
const display = Bodoni_Moda({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni-moda',
  display: 'swap',
  preload: true,
})

const text = Jost({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jost',
  display: 'swap',
  preload: false,
})

// Validated in src/lib/env.ts (defaults to the dev origin, so metadataBase is
// always valid). The site defaults come from buildMetadata() with the home
// entry (Task 10): an absolute title, the canonical, robots from SITE_ENV, and
// the generated Open Graph card — every page overrides them the same way.
const SITE_URL = env().NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildMetadata({ ...ROUTE_SEO.home, path: routes.home }),
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1ECE0' },
    { media: '(prefers-color-scheme: dark)', color: '#14231C' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <head>
        {/* Must run before hydration: the browser schedules scroll restoration
            during load, so setting this from an effect only takes effect on the
            *next* navigation. Every page here has a designed opening and must
            never restore into the middle of a pinned section. The route curtain
            (task 9) owns scroll position on client-side navigations. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('scrollRestoration' in history)history.scrollRestoration='manual';`,
          }}
        />
      </head>
      <body>
        {/* Reveals start hidden and are uncovered by ScrollTrigger. With JS off
            nothing uncovers them, so the resting state is restored here.
            docs/09-performance-accessibility.md §Resilience. */}
        <noscript>
          <style>{`[data-reveal],[data-reveal-children]>*{opacity:1!important;transform:none!important;clip-path:none!important}.preloader{display:none}`}</style>
        </noscript>

        <a className="skip-link" href="#main">
          {UI.skipLink}
        </a>

        <SmoothScroll />
        <GroundManager />
        <Preloader />

        {/* CHROME SLOT — task 7 mounts <Header /> and <NavOverlay /> here.
            Header sits at --z-nav and reads --ground / --ground-fg from
            <html>; the overlay sits at --z-overlay, beneath the texture layer
            so the grain stays continuous across it (docs/03 §8). */}
        <Header />

        <ScrollRail />
        <Cursor />

        {/* ROUTE CURTAIN — task 9 adds app/template.tsx, which wraps {children}
            in <RouteCurtain /> and re-runs on every navigation. Nothing mounts
            here for it; the slot is the template file, not this layout. */}

        {/* Motion's global config: reducedMotion follows the OS, and every
            transition defaults to a tween on the identity's curves (docs/04 §0). */}
        <MotionProvider>{children}</MotionProvider>

        {/* CHROME SLOT — task 8 mounts <Footer /> here, after the page and
            before the texture. It is a server component with data-ground="dark"
            so the GroundManager selector ('footer[data-ground]') already sees it. */}
        <Footer />

        <Grain />
      </body>
    </html>
  )
}
