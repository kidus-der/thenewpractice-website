/**
 * The footer — global chrome, rendered by app/layout.tsx after every page.
 * docs/05 §Global chrome › Footer.
 *
 * Server component on canopy ground, and deliberately small (round 1, R2):
 * the sitemap in its link groups from nav.ts, then one hairline and one base
 * line carrying the copyright and the ceiba mark with its brass point. The
 * Legal group is a column production does not show while its pages are
 * PLACEHOLDER stubs (src/lib/placeholderRoutes.ts). Every string comes from
 * the content layer.
 */
import Link from 'next/link'
import './Footer.css'
import { BRAND } from '@/content/brand'
import { UI_FOOTER } from '@/content/ui'
import { Mark } from '@/components/Mark'
import { liveNav } from '@/lib/placeholderRoutes'

function Sitemap() {
  return (
    <nav className="site-footer__nav" aria-label={UI_FOOTER.navLabel}>
      <h2 className="sr-only">{UI_FOOTER.sitemapHeading}</h2>
      <ul className="site-footer__groups">
        {liveNav().footer.map((group) => (
          <li className="site-footer__group" key={group.heading}>
            <h3 className="site-footer__heading t-eyebrow">{group.heading}</h3>
            <ul className="site-footer__links t-small">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link className="link" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Base({ year }: { year: number }) {
  return (
    <div className="site-footer__base">
      <p className="site-footer__copyright t-small muted">
        {UI_FOOTER.copyright} {year} {BRAND.name}
      </p>
      <Mark className="site-footer__mark" />
    </div>
  )
}

export function Footer() {
  // Baked at build for prerendered routes; a build in the new year refreshes it.
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer" data-ground="dark" role="contentinfo">
      <div className="shell">
        <Sitemap />
        <Base year={year} />
      </div>
    </footer>
  )
}
