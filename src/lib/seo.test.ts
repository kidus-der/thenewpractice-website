import { describe, expect, it } from 'vitest'

import { ASSESSMENTS, BRAND, NOINDEX_ROUTES, SERVICES, TEAM, allRoutes, routes } from '@/content'
import {
  ADDRESS,
  DESCRIPTION_MAX,
  ROUTE_SEO,
  SEO_DEFAULTS,
  assessmentSeo,
  excerpt,
  sentences,
  serviceSeo,
  teamSeo,
} from '@/content/seo'
import {
  OG_TITLE_MAX,
  buildMetadata,
  canonicalUrl,
  normalisePath,
  ogImagePath,
  sanitiseOgTitle,
  sitemapEntries,
  type SeoContext,
} from './seo'
import { buildLlmsText } from '@/app/llms.txt/route'

const production: SeoContext = { siteUrl: 'https://www.example.health', indexable: true }
const staging: SeoContext = { siteUrl: 'https://staging.example.health/', indexable: false }

/** docs/01 §Voice — never in copy we write. */
const FORBIDDEN_WORDS = [
  'journey',
  'transformative',
  'bespoke',
  'luxury',
  'unparalleled',
  'world-class',
  'cutting-edge',
  'oasis',
  'sanctuary',
  'elevate',
  'curated',
  'paradise',
  'escape',
  'holistic',
]

const ourDescriptions = Object.entries(ROUTE_SEO)
  .filter(([key]) => key !== 'home')
  .map(([, seo]) => seo.description)

describe('sentences', () => {
  it('splits on sentence-final punctuation followed by a capital', () => {
    expect(sentences('One thing. Another thing! A third? Done.')).toEqual([
      'One thing.',
      'Another thing!',
      'A third?',
      'Done.',
    ])
  })

  it('does not split after an honorific', () => {
    expect(sentences('Dr. Vasquez earned her degree. She then trained.')).toEqual([
      'Dr. Vasquez earned her degree.',
      'She then trained.',
    ])
  })
})

describe('excerpt', () => {
  it('keeps as many leading sentences as fit', () => {
    const text = 'Short one. Second short one. A third sentence that will not fit at all.'
    expect(excerpt(text, 30)).toBe('Short one. Second short one.')
  })

  it('cuts an over-long first sentence at a word boundary with an ellipsis', () => {
    const text = 'We provide individualized treatment for adults experiencing many things here.'
    const result = excerpt(text, 40)
    expect(result.length).toBeLessThanOrEqual(40)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toMatch(/\s…$/)
  })

  it('returns a sentence that exactly fits', () => {
    expect(excerpt('Exactly ten', 11)).toBe('Exactly ten')
  })
})

describe('ROUTE_SEO', () => {
  it('has an entry for every static route', () => {
    expect(Object.keys(ROUTE_SEO).sort()).toEqual(Object.keys(routes).sort())
  })

  it('titles every page "<Page> — The New Practice" except home', () => {
    for (const [key, seo] of Object.entries(ROUTE_SEO)) {
      if (key === 'home') continue
      expect(seo.title).toBe(`${seo.name} — ${BRAND.name}`)
    }
    expect(ROUTE_SEO.home.title).toBe(`${BRAND.name} — ${BRAND.tagline}`)
    expect(ROUTE_SEO.home.ogTitle).toBeNull()
  })

  it('keeps every description within the limit', () => {
    for (const seo of Object.values(ROUTE_SEO)) {
      expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })

  it('uses none of the forbidden words in copy we wrote', () => {
    for (const description of ourDescriptions) {
      for (const word of FORBIDDEN_WORDS) {
        expect(description.toLowerCase()).not.toContain(word)
      }
    }
  })

  it('carries no trademark sign or exclamation mark anywhere', () => {
    for (const seo of Object.values(ROUTE_SEO)) {
      expect(`${seo.title}${seo.description}`).not.toMatch(/[™!]/)
    }
    expect(SEO_DEFAULTS.siteName).not.toContain('™')
  })

  it("builds the home description from the client's own opening statement", () => {
    expect(SEO_DEFAULTS.description).toContain('We treat one client at a time.')
    expect(SEO_DEFAULTS.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
  })

  it('keeps the structured address in step with BRAND.locale', () => {
    expect(BRAND.locale).toContain(ADDRESS.locality)
    expect(BRAND.locale).toContain(ADDRESS.region)
  })
})

describe('collection builders', () => {
  it('derives every service description from its intro within the limit', () => {
    for (const service of SERVICES) {
      const seo = serviceSeo(service)
      expect(seo.title).toBe(`${service.title} — ${BRAND.name}`)
      expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
      expect(seo.type).toBe('article')
      const intro = service.intro[0] ?? ''
      expect(intro.startsWith(seo.description.replace(/…$/, ''))).toBe(true)
    }
  })

  it('derives every team description from the biography or the role', () => {
    for (const member of TEAM) {
      const seo = teamSeo(member)
      expect(seo.title).toBe(`${member.name} — ${BRAND.name}`)
      expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
      expect(seo.type).toBe('profile')
      const fromBiography = (member.paragraphs[0] ?? '').startsWith(seo.description)
      const fromRole = seo.description === `${member.name}, ${member.role} at ${BRAND.name}.`
      expect(fromBiography || fromRole).toBe(true)
    }
  })

  it('names every assessment and keeps within the limit', () => {
    for (const assessment of ASSESSMENTS) {
      const seo = assessmentSeo(assessment)
      expect(seo.description.startsWith(assessment.title)).toBe(true)
      expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })
})

describe('normalisePath and canonicalUrl', () => {
  it('normalises slashes, queries and hashes', () => {
    expect(normalisePath('')).toBe('/')
    expect(normalisePath('/')).toBe('/')
    expect(normalisePath('about')).toBe('/about')
    expect(normalisePath('/about/')).toBe('/about')
    expect(normalisePath('/team/x?utm=1#bio')).toBe('/team/x')
  })

  it('builds absolute canonicals, root with a slash and nothing else', () => {
    expect(canonicalUrl(production.siteUrl, '/')).toBe('https://www.example.health/')
    expect(canonicalUrl(staging.siteUrl, '/about/')).toBe('https://staging.example.health/about')
  })
})

describe('ogImagePath and sanitiseOgTitle', () => {
  it('points at /og, with the title encoded when present', () => {
    expect(ogImagePath(null)).toBe('/og')
    expect(ogImagePath('Trauma & Complex Trauma')).toBe('/og?title=Trauma+%26+Complex+Trauma')
  })

  it('strips control characters, collapses whitespace and caps the length', () => {
    expect(sanitiseOgTitle(null)).toBeUndefined()
    expect(sanitiseOgTitle(`  ${String.fromCodePoint(0x0)} `)).toBeUndefined()
    expect(sanitiseOgTitle(`One${String.fromCodePoint(0x7)}  two\n three`)).toBe('One two three')
    const long = sanitiseOgTitle('word '.repeat(40)) ?? ''
    expect(long.length).toBeLessThanOrEqual(OG_TITLE_MAX)
    expect(long.endsWith('…')).toBe(true)
  })
})

describe('buildMetadata', () => {
  const input = {
    title: 'About — The New Practice',
    description: ROUTE_SEO.about.description,
    path: '/about/',
    ogTitle: 'About',
  }

  it('produces canonical, Open Graph, Twitter and robots for production', () => {
    const meta = buildMetadata(input, production)
    expect(meta.title).toEqual({ absolute: input.title })
    expect(meta.alternates?.canonical).toBe('https://www.example.health/about')
    expect(meta.robots).toEqual({ index: true, follow: true })
    expect(meta.openGraph).toMatchObject({
      type: 'website',
      siteName: BRAND.name,
      url: 'https://www.example.health/about',
      images: [{ url: 'https://www.example.health/og?title=About', width: 1200, height: 630 }],
    })
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://www.example.health/og?title=About'],
    })
  })

  it('switches robots off outside production and on noIndex', () => {
    expect(buildMetadata(input, staging).robots).toEqual({ index: false, follow: false })
    expect(buildMetadata({ ...input, noIndex: true }, production).robots).toEqual({
      index: false,
      follow: true,
    })
  })

  it('truncates an over-long description at a sentence boundary', () => {
    const description = `${'A'.repeat(100)}. ${'B'.repeat(100)}.`
    const meta = buildMetadata({ ...input, description }, production)
    expect(meta.description).toBe(`${'A'.repeat(100)}.`)
  })

  it('honours a custom image and Open Graph type', () => {
    const meta = buildMetadata({ ...input, image: '/media/x.jpg', type: 'profile' }, production)
    expect(meta.openGraph).toMatchObject({
      type: 'profile',
      images: [{ url: 'https://www.example.health/media/x.jpg' }],
    })
  })
})

describe('sitemapEntries', () => {
  const when = new Date('2026-09-15T00:00:00Z')

  it('is empty when not indexable', () => {
    expect(sitemapEntries(staging, when)).toEqual([])
  })

  it('lists every indexable route with priorities by kind', () => {
    const entries = sitemapEntries(production, when)
    expect(entries).toHaveLength(allRoutes().length - NOINDEX_ROUTES.size)
    const byUrl = new Map(entries.map((e) => [e.url, e]))
    expect(byUrl.get('https://www.example.health/')?.priority).toBe(1)
    expect(byUrl.get('https://www.example.health/about')?.priority).toBe(0.8)
    const service = SERVICES[0]
    expect(
      byUrl.get(`https://www.example.health/clinical-services/${service?.slug}`)?.priority
    ).toBe(0.6)
    for (const entry of entries) expect(entry.lastModified).toBe(when)
  })

  it('leaves out the noindex routes — the PLACEHOLDER legal stubs — by default', () => {
    const urls = sitemapEntries(production, when).map((e) => e.url)
    expect(NOINDEX_ROUTES.has(routes.privacy)).toBe(true)
    expect(NOINDEX_ROUTES.has(routes.terms)).toBe(true)
    for (const path of NOINDEX_ROUTES) {
      expect(urls).not.toContain(canonicalUrl(production.siteUrl, path))
    }
  })

  it('lists a legal route as yearly and low priority once it is no longer excluded', () => {
    const entries = sitemapEntries(production, when, new Set())
    expect(entries).toHaveLength(allRoutes().length)
    const privacy = entries.find((e) => e.url === 'https://www.example.health/privacy')
    expect(privacy).toMatchObject({ priority: 0.3, changeFrequency: 'yearly' })
  })
})

describe('buildLlmsText', () => {
  const text = buildLlmsText(production.siteUrl)

  it("opens with the name and the client's own statement", () => {
    expect(text.startsWith(`# ${BRAND.name}\n\n> ${BRAND.tagline}.\n\n`)).toBe(true)
    expect(text).toContain('We treat one client at a time.')
    expect(text).toContain('Recovery succeeds when trust is never interrupted.')
  })

  it('lists every route, service, team member and assessment with absolute links', () => {
    for (const path of allRoutes()) {
      expect(text).toContain(`](${canonicalUrl(production.siteUrl, path)})`)
    }
    for (const heading of ['Pages', 'Clinical services', 'Team', 'Self-assessments', 'Contact']) {
      expect(text).toContain(`## ${heading}\n`)
    }
    expect(text).toContain(BRAND.phone)
    expect(text).toContain(BRAND.email)
  })
})
