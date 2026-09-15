/**
 * JSON-LD builders — docs/09-performance-accessibility.md §Search and AI visibility.
 *
 * Plain objects, rendered by <JsonLd />. Every fact comes from the content
 * layer: the organisation is what brand.ts says it is, a person is what
 * team.ts says they are. Nothing here rates, reviews, promises an outcome or
 * names a speciality the client has not claimed. `FAQPage` is deliberately
 * absent: nothing in the content is a question and its answer.
 */
import { BRAND } from '@/content/brand'
import { teamHref } from '@/content/nav'
import { ADDRESS, SEO_DEFAULTS } from '@/content/seo'
import type { TeamMember } from '@/content/schemas'
import { canonicalUrl, liveSeoContext } from '@/lib/seo'

export const SCHEMA_CONTEXT = 'https://schema.org'

export type JsonLdValue = string | number | boolean | null | JsonLdNode | readonly JsonLdValue[]
export type JsonLdNode = { readonly [key: string]: JsonLdValue | undefined }

export type BreadcrumbItem = { name: string; path: string }

export type WebPageInput = {
  title: string
  description: string
  path: string
  breadcrumb?: readonly BreadcrumbItem[]
}

export type MedicalWebPageInput = WebPageInput & {
  /** The condition group or service, in the client's words (the service title). */
  about: string
}

const ORGANIZATION_FRAGMENT = '#organization'
const WEBSITE_FRAGMENT = '#website'
const LOGO_PATH = '/icon.svg'
const IMAGE_PATH = '/opengraph-image'
const ORGANIZATION_TYPES = ['Organization', 'MedicalBusiness'] as const
/** The one speciality the client's own copy supports (a consulting psychiatrist on the team). */
const MEDICAL_SPECIALTY = 'Psychiatric'

const siteUrl = (override?: string): string => override ?? liveSeoContext().siteUrl
const organizationId = (origin: string): string => `${origin}/${ORGANIZATION_FRAGMENT}`
const websiteId = (origin: string): string => `${origin}/${WEBSITE_FRAGMENT}`

const organizationRef = (origin: string): JsonLdNode => ({
  '@type': 'Organization',
  '@id': organizationId(origin),
  name: BRAND.name,
})

const websiteRef = (origin: string): JsonLdNode => ({
  '@type': 'WebSite',
  '@id': websiteId(origin),
  name: BRAND.name,
  url: canonicalUrl(origin, '/'),
})

/** The practice, as brand.ts describes it. */
export function organization(origin: string = siteUrl()): JsonLdNode {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': [...ORGANIZATION_TYPES],
    '@id': organizationId(origin),
    name: BRAND.name,
    slogan: BRAND.tagline,
    url: canonicalUrl(origin, '/'),
    logo: `${origin}${LOGO_PATH}`,
    image: `${origin}${IMAGE_PATH}`,
    email: BRAND.email,
    telephone: BRAND.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: ADDRESS.locality,
      addressRegion: ADDRESS.region,
      addressCountry: ADDRESS.country,
    },
    founder: {
      '@type': 'Person',
      name: BRAND.founder.name,
      honorificSuffix: BRAND.founder.credentials,
      jobTitle: BRAND.founder.role,
    },
    medicalSpecialty: MEDICAL_SPECIALTY,
  }
}

/** One team member; credentials only when the document gives them. */
export function person(member: TeamMember, origin: string = siteUrl()): JsonLdNode {
  const url = canonicalUrl(origin, teamHref(member.slug))
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Person',
    '@id': `${url}#person`,
    name: member.name,
    ...(member.credentials ? { honorificSuffix: member.credentials } : {}),
    jobTitle: member.role,
    worksFor: organizationRef(origin),
    url,
  }
}

/** The visible trail, home first. */
export function breadcrumb(
  items: readonly BreadcrumbItem[],
  origin: string = siteUrl()
): JsonLdNode {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(origin, item.path),
    })),
  }
}

const pageNode = (type: string, input: WebPageInput, origin: string): JsonLdNode => {
  const url = canonicalUrl(origin, input.path)
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': type,
    '@id': url,
    url,
    name: input.title,
    description: input.description,
    inLanguage: SEO_DEFAULTS.language,
    isPartOf: websiteRef(origin),
    publisher: organizationRef(origin),
    ...(input.breadcrumb ? { breadcrumb: breadcrumb(input.breadcrumb, origin) } : {}),
  }
}

/** Any page. */
export const webPage = (input: WebPageInput, origin: string = siteUrl()): JsonLdNode =>
  pageNode('WebPage', input, origin)

/** A service page: names what the page is about and nothing more. */
export const medicalWebPage = (
  input: MedicalWebPageInput,
  origin: string = siteUrl()
): JsonLdNode => ({
  ...pageNode('MedicalWebPage', input, origin),
  about: { '@type': 'Thing', name: input.about },
})

const LINE_SEPARATOR = String.fromCodePoint(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCodePoint(0x2029)

/** Characters that may not appear raw inside an inline <script>, and their JSON escapes. */
const SCRIPT_UNSAFE: Readonly<Record<string, string>> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  [LINE_SEPARATOR]: '\\u2028',
  [PARAGRAPH_SEPARATOR]: '\\u2029',
}
// Built with the constructor so the post-write formatter cannot turn the
// escapes into literal characters (ledger, Task 5 findings).
const SCRIPT_UNSAFE_PATTERN = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, 'g')

/**
 * JSON safe to inline in a <script>: `</script>` and friends become escapes
 * that JSON parsers still read as the original characters.
 */
export function serializeJsonLd(data: JsonLdNode | readonly JsonLdNode[]): string {
  return JSON.stringify(data).replace(SCRIPT_UNSAFE_PATTERN, (char) => SCRIPT_UNSAFE[char] ?? char)
}
