import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// docs/04-motion-system.md §0 — scroll-driven → GSAP, state-driven → Motion,
// no springs. Motion's scroll and spring hooks are therefore off limits.
const MOTION_BOUNDARY_MESSAGE =
  'Scroll-driven motion belongs to GSAP/ScrollTrigger; springs are banned by the design system (docs/04)'
const MOTION_BANNED_IMPORTS = [
  'useScroll',
  'useSpring',
  'useTransform',
  'useVelocity',
  'useMotionValueEvent',
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'motion/react',
              importNames: MOTION_BANNED_IMPORTS,
              message: MOTION_BOUNDARY_MESSAGE,
            },
            {
              name: 'motion',
              importNames: MOTION_BANNED_IMPORTS,
              message: MOTION_BOUNDARY_MESSAGE,
            },
            {
              name: 'framer-motion',
              message: 'Import from motion/react. framer-motion is the legacy entry (docs/07).',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
