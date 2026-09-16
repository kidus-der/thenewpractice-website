/**
 * /team/[slug] — the T4 Profile template (Task 14). docs/05 §T4, docs/09 §2 and §5.
 *
 * Three members on every project — the founder (credentials, six paragraphs),
 * the psychiatrist (credentials, two paragraphs, no opening line: CONTENT-GAPS
 * C8) and the last member in the document (the wrap-around case): the h1 is
 * the exact name, the credentials line appears only when the document gives
 * one, the role, the paragraph count, the placeholder plate with its label,
 * three colleagues with the right hrefs, the rail, the Person node, axe on
 * <main>, a full-page capture. Then a smoke pass over all eleven routes and
 * a 404 for a stranger.
 */
import { teamHref } from '../../src/content/nav'
import { TEAM } from '../../src/content/team'
import { UI_INTERIOR, UI_PROFILE } from '../../src/content/ui'
import { biographyLead, profilePrevNext, worksAlongside } from '../../src/lib/profile'
import {
  expect,
  expectNoAxeViolations,
  expectNoConsoleErrors,
  revealAll,
  screenshotRoute,
  settleMotion,
  test,
} from './helpers'

const FIXTURE_SLUGS = [
  'lowell-monkhouse',
  'elena-vasquez-whitfield',
  'fernando-escobosa-garcia',
] as const

const FIXTURES = FIXTURE_SLUGS.map((slug) => {
  const member = TEAM.find((m) => m.slug === slug)
  if (!member) throw new Error(`team.ts has no member "${slug}"`)
  return member
})

const RAIL = `nav[aria-label="${UI_INTERIOR.railLabel}"]`
/** Decorative: hidden from assistive technology, no label (owner decision, Task 21). */
const PLACEHOLDER = 'svg.portrait-placeholder[aria-hidden="true"]'
const ROWS = '.index-list__row'
const BIOGRAPHY = 'section#biography'
const JSON_LD = 'script[type="application/ld+json"]'

type JsonLdNode = Record<string, unknown>

const collectJsonLd = (scripts: readonly string[]): readonly JsonLdNode[] =>
  scripts.flatMap((text) => {
    const parsed: unknown = JSON.parse(text)
    return (Array.isArray(parsed) ? parsed : [parsed]) as JsonLdNode[]
  })

for (const member of FIXTURES) {
  const route = teamHref(member.slug)

  test.describe(`profile: ${member.slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route)
      await settleMotion(page)
    })

    test('opens on bone with the name as the only h1', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(member.name)
      await expect(page.locator('main > :first-child')).toHaveAttribute('data-ground', 'light')
      expectNoConsoleErrors(page)
    })

    test('sets the credentials beneath the name only when the document gives them', async ({
      page,
    }) => {
      const credentials = page.locator('.profile-intro__credentials')
      if (member.credentials) {
        await expect(credentials).toHaveText(member.credentials)
      } else {
        await expect(credentials).toHaveCount(0)
      }
      await expect(page.locator('.profile-intro__role')).toHaveText(member.role)
    })

    test('numbers the eyebrow with the member’s place and links back to the team', async ({
      page,
    }) => {
      const eyebrow = page.locator('.profile-intro__eyebrow')
      await expect(eyebrow).toContainText(String(member.order).padStart(2, '0'))
      await expect(eyebrow.getByRole('link')).toHaveAttribute('href', '/team')
    })

    test('renders every paragraph of the biography, verbatim', async ({ page }) => {
      const { lead, paragraphs } = biographyLead(member)
      const body = page.locator(`${BIOGRAPHY} p`)
      await expect(body).toHaveCount(paragraphs.length)
      const texts = (await body.allTextContents()).map((t) => t.trim())
      expect(texts).toEqual(paragraphs)
      expect(texts.length + (lead ? 1 : 0)).toBe(member.paragraphs.length)
      // an untitled section carries no eyebrow (CLAUDE.md §6a, Task 18)
      await expect(page.locator(`${BIOGRAPHY} .eyebrow`)).toHaveCount(0)
    })

    test('shows the decorative placeholder plate, unlabelled, and no photograph', async ({
      page,
    }) => {
      const plate = page.locator(`main > :first-child ${PLACEHOLDER}`)
      await expect(plate).toHaveCount(1)
      await expect(plate).toBeVisible()
      await expect(plate).not.toHaveAttribute('role', /.+/)
      await expect(plate).not.toHaveAttribute('aria-label', /.+/)
      await expect(page.locator('main > :first-child [role="img"]')).toHaveCount(0)
      const box = await plate.boundingBox()
      if (!box) throw new Error('placeholder has no box')
      expect(box.height / box.width).toBeCloseTo(4 / 3, 1)
      await expect(page.locator('main img')).toHaveCount(0)
    })

    test('lists the three colleagues who follow in the document', async ({ page }) => {
      const rows = page.locator(ROWS)
      await expect(rows).toHaveCount(3)
      const hrefs = await rows
        .getByRole('link')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(hrefs).toEqual(worksAlongside(member.slug).map((m) => teamHref(m.slug)))
      expect(hrefs).not.toContain(route)
      await expect(page.locator('#works-alongside h2')).toHaveText(UI_PROFILE.worksAlongside)
      await expect(page.locator('#works-alongside')).toHaveAttribute('data-ground', 'mid')
    })

    test('links to the previous and next member, or the team page at either end', async ({
      page,
    }) => {
      const { prev, next } = profilePrevNext(member.slug)
      const rail = page.locator(RAIL)
      await expect(rail.getByRole('link')).toHaveCount(2)
      await expect(rail.getByRole('link', { name: prev.label, exact: true })).toHaveAttribute(
        'href',
        prev.href
      )
      await expect(rail.getByRole('link', { name: next.label, exact: true })).toHaveAttribute(
        'href',
        next.href
      )
    })

    test('describes the person in structured data without claims', async ({ page }) => {
      const scripts = await page.locator(JSON_LD).allTextContents()
      const nodes = collectJsonLd(scripts)
      const personNode = nodes.find((n) => n['@type'] === 'Person')
      if (!personNode) throw new Error('no Person node')
      expect(personNode.name).toBe(member.name)
      expect(personNode.jobTitle).toBe(member.role)
      expect(personNode).not.toHaveProperty('award')
      expect(personNode).not.toHaveProperty('alumniOf')
      expect(personNode).not.toHaveProperty('knowsAbout')
      if (member.credentials) expect(personNode.honorificSuffix).toBe(member.credentials)
      else expect(personNode).not.toHaveProperty('honorificSuffix')

      const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList')
      const items = (crumbs?.itemListElement ?? []) as readonly JsonLdNode[]
      expect(items.map((i) => i.name)).toEqual(['Home', 'Team', member.name])
      expect(nodes.map((n) => n['@type'])).toEqual(
        expect.arrayContaining(['WebPage', 'BreadcrumbList'])
      )
    })

    test('has no serious axe violations in the page', async ({ page }) => {
      await revealAll(page)
      // Scoped to <main>: the scroll rail numeral and the footer marquee are
      // chrome findings owned by Task 19 (ledger, Tasks 8 and 11).
      await expectNoAxeViolations(page, { impactAtLeast: 'serious', include: 'main' })
    })

    test('captures the settled page', async ({ page }) => {
      await revealAll(page)
      const path = await screenshotRoute(page, `profile-${member.slug}`)
      test.info().annotations.push({ type: 'screenshot', description: path })
      expectNoConsoleErrors(page)
    })
  })
}

test.describe('profile: every member', () => {
  test('serves all eleven routes with the right h1', async ({ page }) => {
    expect(TEAM).toHaveLength(11)
    for (const member of TEAM) {
      const response = await page.goto(teamHref(member.slug))
      expect(response?.status(), member.slug).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(member.name)
    }
    expectNoConsoleErrors(page)
  })

  test('returns 404 for a slug the document does not name', async ({ page }) => {
    const response = await page.goto(teamHref('nobody'))
    expect(response?.status()).toBe(404)
  })
})
