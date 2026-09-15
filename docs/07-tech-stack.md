# 07 — Tech Stack

> Source: plan §3.1. Every dependency below has a reason; every new one needs a line in this file.

## Decision

| Layer | Choice | Rationale |
| --- | --- | --- |
| Framework | **Next.js 16, App Router, React 19, TypeScript strict, `noUncheckedIndexedAccess`** | Same as the concept site, so the concept is a head start, not a rewrite. `next/image`, `next/font`, static generation of every content route, a server action for the one form. Turbopack in dev and build. |
| Styling | **Tailwind CSS v4** (`@theme`) + the token CSS in `globals.css` | CSS-first config maps 1:1 onto `docs/03`. No `tailwind.config.js`. Utilities are rarely used; the design is written as tokenised CSS classes. |
| Scroll choreography | **GSAP 3 + ScrollTrigger + SplitText**, **Lenis** on the GSAP ticker | Pins, scrubs, line masks — the signature moves. All GSAP plugins are free. One RAF loop. |
| React transitions | **Motion** (`motion/react`) | Route curtain, nav overlay `AnimatePresence`, form → confirmation, result reveal. Global `MotionConfig` forces tweens on the identity's curves. **Boundary rule: scroll-driven → GSAP, state-driven → Motion; no springs.** `useScroll`, `useSpring`, `useTransform` are lint-banned. See `docs/04` §0. |
| Ambient WebGL | **@shadergradient/react** on **@react-three/fiber v9 + three** (+ `three-stdlib`, `camera-controls`, `@types/three`) | One `ShaderGradientCanvas` behind the home hero video, colours canopy / canopy-soft / stone read from CSS variables, `uSpeed ≤ 0.2`, `grain="off"`, `pixelDensity 1`. `next/dynamic({ ssr: false })`, gated by `useAmbientEligible()` (reduced-motion, WebGL2, `saveData`, `≥ 1024px` + fine pointer, `deviceMemory`), paused offscreen and on tab blur, a separate chunk on `/` only. Contract §3 excludes WebGL from the fee, so it is a voluntary, removable enhancement and never load-bearing. |
| Forms | **React Hook Form + Zod** (client) · **Zod** again in a **server action** · **Resend** adapter behind env · honeypot + time-trap | Nothing submitted is stored (contract §1). The adapter falls back to a structured stdout log when `RESEND_API_KEY` is absent. |
| Content | **Typed TS modules per collection with Zod schemas** (`src/content/**`), generated from the client document by `scripts/ingest-content.mjs` | Validated at build and in unit tests. Shaped so a CMS (recommendation: Sanity, on the client's account) can replace the module source after template approval without touching templates. |
| Search / AI visibility | Metadata API per template, JSON-LD (`Organization`, `Person`, `WebPage`, `BreadcrumbList`), `sitemap.ts`, `robots.ts` (disallow-all when `SITE_ENV=staging`), `/llms.txt`, OG image per template | Baked into templates now because the client judges them working |
| Tests | **Vitest + Testing Library + jsdom** (`src/lib`, `src/content`, `src/server`, hooks) · **Playwright** (`mobile-390`, `tablet-768`, `desktop-1280`, `wide-1920`, `reduced-motion`) with `@axe-core/playwright` · **Lighthouse CI** | `npm run verify` = lint, typecheck, unit tests, build. See `docs/11`. |
| Fonts | Bodoni Moda + Jost via `next/font/google` | Stand-ins; licensing is the client's (contract §3); swap point is `layout.tsx`. |
| Hosting | **Vercel**, project `thenewpractice-staging`, scope `kidus-projects-8964b022`, hostname `thenewpractice-staging.kidusder.com`, CLI deploys | Mirrors the concept site. GitHub → Vercel is not connected; `git push` does not deploy. `SITE_ENV=staging` drives `noindex`. |
| Analytics | **None** on staging | One tool on the client's account after approval |

## Explicitly rejected

| Considered | Rejected because |
| --- | --- |
| Astro | Right for a pure content site; wrong once the enquiry action, the interactive scorer and the transitions exist. |
| A UI component library | Every component is bespoke. A library would fight the design system on every element. |
| CSS-only scroll animations (`animation-timeline`) | Safari support is still the constraint, and this audience skews Safari. GSAP. |
| Framer Motion *for scroll* | Weak for scrubbed choreography, and two scroll systems means two RAF loops. Motion is used **only** for state-driven transitions; scroll stays with GSAP. |
| Three.js / R3F *as a page dependency* | Heavy. Accepted **only** as a lazily loaded, gated chunk behind the home hero, with the poster + video as the real render. If the chunk ever appears on another route or costs a Lighthouse point on mobile, it is removed. |
| Password protection on staging | Vercel Hobby cannot. `noindex`, an unguessable hostname and no sitemap instead (plan R9). |
| Persisting enquiries | Contract §1. The mail adapter is the only sink. |

## Dependencies

```
next 16.3.x · react / react-dom 19.2.x · typescript ^5 · tailwindcss ^4 (@tailwindcss/postcss)
gsap ^3.15 · lenis ^1.3 · motion (task 3)
@shadergradient/react · @react-three/fiber ^9 · three · three-stdlib · camera-controls (task 3)
react-hook-form ^7 · zod ^4 · @hookform/resolvers ^5
resend (task 15)
```

Dev only: `eslint ^9` + `eslint-config-next`, `prettier` + `prettier-plugin-tailwindcss`, `sharp` (asset pipeline), `@types/*`, `vitest` + `@testing-library/react` + `jsdom`, `@playwright/test` + `@axe-core/playwright`, `@lhci/cli` (task 4).

No icon library, no utility grab-bag, no date library, no animation helper on top of GSAP or Motion.

## Configuration notes

**Fonts** — `next/font/google`, self-hosted at build, `display: 'swap'`, subset `latin` + `latin-ext`. Preload the display face only.

**Images** — `next/image`; every image has explicit `sizes` and a `blurDataURL` from `media.ts`. The hero poster gets `priority`; nothing else does.

**Video** — served from `/public/video`, `preload="metadata"`, poster required, `muted playsinline loop`, mp4 (H.264, ≤ 4 MB) + webm (VP9). Never `next/image`. Not loaded under reduced motion or `saveData`.

**Environment** — `src/lib/env.ts` reads `SITE_ENV`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `ENQUIRY_TO` with Zod at startup; `.env.example` documents them (task 6). Required secrets are validated present where used; nothing is hard-coded.

**Rendering** — static generation for every content route (`generateStaticParams` from the collections). The only dynamic surface is the enquiry server action. Server Components by default; `'use client'` only on components that own motion or state.

**Security headers** — `vercel.json` (task 6): CSP allowing self + Vercel with no external fonts, `Permissions-Policy`, `X-Content-Type-Options`.

**Strict mode + TS strict** — both on. `noUncheckedIndexedAccess: true`. No `any`. No `@ts-expect-error` without an adjacent comment.

## GSAP + Lenis integration contract

There is exactly one place this wiring happens (`src/motion/SmoothScroll.tsx`), and it does all of the following:

1. Instantiate Lenis with the config in `docs/04` §2 — unless reduced motion is preferred, in which case it only refreshes ScrollTrigger
2. Drive it from GSAP's ticker — **not** its own `requestAnimationFrame`
3. `gsap.ticker.lagSmoothing(0)` (in `gsap.ts`, the single plugin registration point)
4. Call `ScrollTrigger.update` on Lenis's `scroll` event
5. Debounce width-only resize refreshes at 200ms
6. Tear down on unmount

No component may import Lenis. `scrollTo()`, `stopScroll()`, `startScroll()` are the only surface.

## Code conventions

- **Server Components by default.** `'use client'` only on components that own motion or state.
- One component per file, named export, PascalCase file; CSS classes BEM-style (`.hero__media`, `.field__underline`); content keys camelCase.
- Every GSAP context uses `gsap.context()` scoped to a ref, with `ctx.revert()` in cleanup, and every effect inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`.
- Immutability: new objects, never mutation. Files under ~400 lines; functions under 50 lines; early returns.
- Errors are handled explicitly and logged on the server through `src/lib/logger.ts` with levels; no `console.*` in shipped code.
- Input is validated at the boundary with Zod: the form, the server action, the environment, the content modules.

## Repository layout

See `docs/05` §Route map. In addition:

```
docs/            this doc set + BUILD-LEDGER.md + CONTENT-GAPS.md
design/
├─ brand/        the client's logo concept PDF
├─ ASSETS.md     every media file, its source URL and licence
├─ STOCK-SOURCES.md   the researched shortlist (task 2a)
└─ media.manifest.json   drives scripts/prepare-assets.mjs (task 2b)
public/
├─ media/        optimised stills (generated)
├─ video/        hero-loop.mp4 / .webm + poster (generated)
└─ audio/        the voice-over, when the client supplies it
scripts/         prepare-assets.mjs · make-og.mjs · ingest-content.mjs
tests/           unit/ · e2e/
```

## Browser support

| Browser | Support level |
| --- | --- |
| Safari (macOS + iOS), last 2 | **Primary.** This audience is disproportionately on Apple hardware. Test here first, not last. |
| Chrome, Edge, last 2 | Full |
| Firefox, last 2 | Full |
| Anything older | Content readable, layout intact, motion absent. |

Safari-specific things that bite, budgeted in task 19: `clip-path` on transformed elements (the curtain, the overlay), `backdrop-filter` performance (the settled header), `100vh` vs `100dvh`, video autoplay policy (poster-first, `muted playsinline`).
