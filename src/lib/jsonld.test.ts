import { describe, expect, it } from 'vitest'

import { BRAND, TEAM } from '@/content'
import { ADDRESS } from '@/content/seo'
import { breadcrumb, itemList, organization, person, serializeJsonLd, webPage } from './jsonld'

const origin = 'https://www.example.health'

const founder = TEAM.find((m) => m.slug === 'lowell-monkhouse')
const uncredentialed = TEAM.find((m) => !m.credentials)

describe('organization', () => {
  const node = organization(origin)

  it('is a plain Organization with only the facts in brand.ts', () => {
    expect(node).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: BRAND.name,
      slogan: BRAND.tagline,
      url: `${origin}/`,
      logo: `${origin}/icon.svg`,
      email: BRAND.email,
      telephone: BRAND.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: ADDRESS.locality,
        addressRegion: ADDRESS.region,
        addressCountry: ADDRESS.country,
      },
      founder: { '@type': 'Person', name: BRAND.founder.name, jobTitle: BRAND.founder.role },
    })
  })

  it('claims no speciality and no medical business type the client did not (audit A6, A7)', () => {
    const json = JSON.stringify(node)
    expect(json).not.toMatch(/medicalSpecialty|MedicalBusiness|Medical/)
  })

  it('makes no rating, review or outcome claim', () => {
    const json = JSON.stringify(node)
    expect(json).not.toMatch(/aggregateRating|review|priceRange|openingHours/i)
  })
})

describe('person', () => {
  it('describes a credentialed member with their letters', () => {
    if (!founder) throw new Error('founder missing from TEAM')
    expect(person(founder, origin)).toMatchObject({
      '@type': 'Person',
      '@id': `${origin}/team/lowell-monkhouse#person`,
      name: founder.name,
      honorificSuffix: founder.credentials,
      jobTitle: founder.role,
      worksFor: { '@type': 'Organization', '@id': `${origin}/#organization`, name: BRAND.name },
      url: `${origin}/team/lowell-monkhouse`,
    })
  })

  it('omits credentials when the document gives none', () => {
    if (!uncredentialed) throw new Error('every member has credentials; test needs revisiting')
    expect(person(uncredentialed, origin)).not.toHaveProperty('honorificSuffix')
  })
})

describe('breadcrumb', () => {
  it('numbers the trail from one with absolute items', () => {
    const node = breadcrumb(
      [
        { name: 'Home', path: '/' },
        { name: 'Team', path: '/team' },
        { name: 'Lowell Monkhouse', path: '/team/lowell-monkhouse' },
      ],
      origin
    )
    expect(node).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Team', item: `${origin}/team` },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Lowell Monkhouse',
          item: `${origin}/team/lowell-monkhouse`,
        },
      ],
    })
  })
})

describe('webPage', () => {
  const input = {
    title: 'About — The New Practice',
    description: 'How the practice began.',
    path: '/about/',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ],
  }

  it('builds a WebPage tied to the site and the organisation', () => {
    const node = webPage(input, origin)
    expect(node).toMatchObject({
      '@type': 'WebPage',
      '@id': `${origin}/about`,
      url: `${origin}/about`,
      name: input.title,
      description: input.description,
      inLanguage: 'en',
      isPartOf: { '@type': 'WebSite', '@id': `${origin}/#website` },
      publisher: { '@id': `${origin}/#organization` },
      breadcrumb: { '@type': 'BreadcrumbList' },
    })
  })

  it('omits the breadcrumb when none is given', () => {
    expect(webPage({ ...input, breadcrumb: undefined }, origin)).not.toHaveProperty('breadcrumb')
  })

  it('is a plain WebPage for a service too, with no medical type or subject (audit A8)', () => {
    const node = webPage({ ...input, path: '/clinical-services/eating-disorders' }, origin)
    expect(node['@type']).toBe('WebPage')
    expect(node).not.toHaveProperty('about')
    expect(JSON.stringify(node)).not.toMatch(/Medical|outcome|success|cure|guarantee/)
  })
})

describe('itemList', () => {
  const node = itemList(
    [
      { name: 'Addiction Treatment', path: '/clinical-services/addiction-treatment' },
      { name: 'Trauma & Complex Trauma', path: '/clinical-services/trauma-and-complex-trauma/' },
    ],
    origin
  )

  it('numbers the collection from one with names and absolute URLs only', () => {
    expect(node).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Addiction Treatment',
          url: `${origin}/clinical-services/addiction-treatment`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Trauma & Complex Trauma',
          url: `${origin}/clinical-services/trauma-and-complex-trauma`,
        },
      ],
    })
  })

  it('carries no description, rating or outcome for any item', () => {
    expect(JSON.stringify(node)).not.toMatch(
      /description|aggregateRating|review|outcome|success|medicalSpecialty/i
    )
  })
})

describe('serializeJsonLd', () => {
  it('escapes script-closing and ambiguous characters so the JSON stays valid', () => {
    const lineSeparator = String.fromCodePoint(0x2028)
    const serialised = serializeJsonLd({ name: `</script><b>&amp;${lineSeparator}` })
    expect(serialised).not.toContain('</script>')
    expect(serialised).not.toContain('<')
    expect(serialised).not.toContain('&')
    expect(JSON.parse(serialised)).toEqual({ name: `</script><b>&amp;${lineSeparator}` })
  })

  it('serialises an array of nodes as one document', () => {
    const serialised = serializeJsonLd([{ '@type': 'A' }, { '@type': 'B' }])
    expect(JSON.parse(serialised)).toEqual([{ '@type': 'A' }, { '@type': 'B' }])
  })
})
