/**
 * The Playwright project matrix (docs/07, docs/11): four widths plus a
 * reduced-motion desktop, and a WebKit desktop on request. Names are spelled
 * here once; playwright.config.ts and the specs import them.
 */
export const PROJECTS = {
  mobile: 'mobile-390',
  tablet: 'tablet-768',
  desktop: 'desktop-1280',
  wide: 'wide-1920',
  reducedMotion: 'reduced-motion',
  /** WebKit at 1280 × 800; only in the matrix under `npm run e2e:webkit` (Task 19). */
  webkit: 'webkit',
} as const

export type ProjectName = (typeof PROJECTS)[keyof typeof PROJECTS]

export const PROJECT_NAMES: readonly ProjectName[] = Object.values(PROJECTS)

export function isProjectName(name: string): name is ProjectName {
  return (PROJECT_NAMES as readonly string[]).includes(name)
}

/**
 * Where the ambient gradient may mount (docs/04 §8): a fine-pointer viewport
 * of at least 1024px with motion allowed. Everywhere else the canvas must be
 * absent and its chunk never requested.
 */
export const AMBIENT_GRADIENT_EXPECTED: Readonly<Record<ProjectName, boolean>> = {
  [PROJECTS.mobile]: false,
  [PROJECTS.tablet]: false,
  [PROJECTS.desktop]: true,
  [PROJECTS.wide]: true,
  [PROJECTS.reducedMotion]: false,
  [PROJECTS.webkit]: true,
}
