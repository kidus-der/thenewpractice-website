import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const IMPACT_ORDER = ['minor', 'moderate', 'serious', 'critical'] as const
type Impact = (typeof IMPACT_ORDER)[number]

type Options = Readonly<{
  impactAtLeast?: Impact
  /** CSS selector to scope the scan to one region (a chrome component's own spec). */
  include?: string
}>

type Violation = Readonly<{ id: string; impact: Impact; help: string; targets: readonly string[] }>

/**
 * Runs axe-core against the current document — or the `include` region only —
 * and fails on any violation at or above the given impact (docs/09 §2: a
 * serious violation fails the run).
 */
export async function expectNoAxeViolations(
  page: Page,
  { impactAtLeast = 'serious', include }: Options = {}
): Promise<void> {
  const builder = new AxeBuilder({ page })
  const results = await (include ? builder.include(include) : builder).analyze()
  const floor = IMPACT_ORDER.indexOf(impactAtLeast)

  const violations: readonly Violation[] = results.violations
    .filter(
      (v): v is typeof v & { impact: Impact } =>
        v.impact !== undefined && v.impact !== null && IMPACT_ORDER.indexOf(v.impact) >= floor
    )
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.map((n) => n.target.join(' ')),
    }))

  const scope = include ? ` within "${include}"` : ''
  expect(violations, `axe violations at or above "${impactAtLeast}"${scope}`).toEqual([])
}
