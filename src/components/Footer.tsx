/**
 * The footer — global chrome, rendered by app/layout.tsx after every page.
 * docs/05 §Global chrome › Footer; plan §3.3.
 *
 * Server component on canopy ground. Reads: the marquee (the site's one
 * permitted marquee, the only client code here), the sitemap from nav.ts,
 * the founder contact from brand.ts, the legal line (copyright and the
 * confidentiality sentence; privacy and terms belong to the Legal column,
 * ledger Task 8 triage), and the lockup — mark,
 * wordmark with the ™, tagline — alone at the very bottom, the way a
 * monograph ends on the publisher's device. Every string comes from the
 * content layer; the confidentiality line is the client's own sentence.
 */
import Link from 'next/link'
import './Footer.css'
import { BRAND } from '@/content/brand'
import { NAV } from '@/content/nav'
import { HOME } from '@/content/pages/home'
import { UI_FOOTER } from '@/content/ui'
import { Mark } from '@/components/Mark'
import { Marquee } from '@/components/Marquee'
import { mailHref, telHref } from '@/lib/contact'

/**
 * "Every enquiry is handled with complete confidentiality." — the second
 * paragraph of the home page's closing section, in the client's words.
 * Looked up rather than copied so the document stays the single source; if
 * the section moves, the line is omitted rather than invented.
 */
const CONFIDENTIALITY_SECTION = 'begin-the-conversation'
const CONFIDENTIALITY_PARAGRAPH = 1

function confidentialityLine(): string | undefined {
  const section = HOME.sections.find((s) => s.id === CONFIDENTIALITY_SECTION)
  return section?.paragraphs[CONFIDENTIALITY_PARAGRAPH]
}

function Sitemap() {
  return (
    <nav className="site-footer__nav" aria-label={UI_FOOTER.navLabel}>
      <h2 className="sr-only">{UI_FOOTER.sitemapHeading}</h2>
      <ul className="site-footer__groups">
        {NAV.footer.map((group) => (
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

function Contact() {
  const { founder, phone, email, locale } = BRAND
  const locationLines = locale.split(', ')
  return (
    <div className="grid12 site-footer__colophon">
      <address className="site-footer__contact p-offset t-small">
        <p>
          {founder.name}, {founder.credentials}
        </p>
        <p className="muted">{founder.role}</p>
        <p className="site-footer__line">
          <a className="link" href={telHref(phone)}>
            {phone}
          </a>
        </p>
        <p>
          <a className="link" href={mailHref(email)}>
            {email}
          </a>
        </p>
        <p className="site-footer__location muted">
          {locationLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </address>
    </div>
  )
}

function Legal({ year }: { year: number }) {
  const note = confidentialityLine()
  return (
    <div className="site-footer__legal t-small muted">
      <p className="site-footer__copyright">
        <span>
          {UI_FOOTER.copyright} {year} {BRAND.name}
        </span>
      </p>
      {note && <p className="site-footer__note">{note}</p>}
    </div>
  )
}

function Lockup() {
  return (
    <div className="site-footer__lockup">
      <Mark className="site-footer__mark" />
      <p className="site-footer__wordmark">
        {BRAND.nameUpper}
        <sup className="site-footer__tm">{BRAND.trademark}</sup>
      </p>
      <p className="site-footer__tagline t-eyebrow muted">{BRAND.tagline}</p>
    </div>
  )
}

export function Footer() {
  // Baked at build for prerendered routes; a build in the new year refreshes it.
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer" data-ground="dark" role="contentinfo">
      <Marquee
        className="site-footer__marquee"
        text={BRAND.nameUpper}
        separator={UI_FOOTER.marqueeSeparator}
      />
      <div className="shell">
        <Sitemap />
        <Contact />
        <Legal year={year} />
        <Lockup />
      </div>
    </footer>
  )
}
