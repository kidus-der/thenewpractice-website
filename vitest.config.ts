import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Unit and hook tests. docs/07-tech-stack.md, docs/11-qa-acceptance.md.
 *
 * Coverage is measured on the pure layers only — lib, content, server, the
 * gradient's decision function and the motion tokens — never on components,
 * whose behaviour is verified in the browser by Playwright.
 */
const COVERAGE_FLOOR = 80

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { '@': src } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**',
        'src/content/**',
        'src/server/**',
        'src/webgl/ambientEligibility.ts',
        'src/motion/tokens.ts',
      ],
      exclude: ['src/**/*.test.{ts,tsx}'],
      thresholds: {
        lines: COVERAGE_FLOOR,
        functions: COVERAGE_FLOOR,
        branches: COVERAGE_FLOOR,
        statements: COVERAGE_FLOOR,
      },
    },
  },
})
