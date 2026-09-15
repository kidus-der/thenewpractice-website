# Build Ledger — Two-Week Template Milestone

Source plan: `.claude/plans/two-week-templates.plan.md` (approved 2026-09-14). This file is the task queue for the looped subagent run. One agent per task, one fresh context per agent. The main session picks the first `todo` task whose `depends_on` are all `done`, spawns an agent, verifies the result, commits, and updates this file.

## Owner decisions that override the plan text

- Self-assessments are **interactive scorers** (client-side, no persistence), using each questionnaire's own scoring: 1 point per "yes", 0–15, bands 0–4 mild / 5–9 moderate / 10–15 severe. Contract scoping is the owner's concern, not the agent's.
- Hero video and all photography are **stock, licence-free**, chosen to match the practice: Caribbean surf, Mayan jungle canopy, cenote water, limestone, linen, unoccupied tropical-modern interiors. No people's faces, no resort clichés (see `docs/02-art-direction.md`). Every file logged with source URL and licence in `design/ASSETS.md`.
- Contact details come from **one source** (`src/content/brand.ts`) and match the home page of the client doc: Lowell Monkhouse, Founder & Clinical Director, +1 778-679-3369, lowell@thenewpractice.health, Puerto Aventuras, Riviera Maya, Quintana Roo, Mexico. The contact page uses the same values where the doc left blanks.
- No time estimates anywhere. The owner judges time.

## Rules every agent follows

1. **GateGuard.** Before your first Bash call, state in one line the task you are doing and what that command verifies or produces. Do this once at the start and again if a hook asks.
2. **Read first.** `CLAUDE.md`, then the `docs/*` that governs your layer, then the task brief below, then the plan section referenced. The concept site at `/Volumes/main-storage-2tb/projects/luxury-spa-website-demo` is the pattern source; copy its conventions, not its placeholder prose.
3. **Use the ECC harness.** Invoke the skills that fit the task before writing code: `ecc:tdd-workflow` for any logic; `ecc:frontend-design-direction`, `ecc:design-system`, `ecc:make-interfaces-feel-better` for layout and polish; `ecc:motion-foundations` / `ecc:motion-patterns` / `ecc:motion-advanced` for animation; `ecc:frontend-a11y` / `ecc:accessibility` for keyboard and screen-reader work; `ecc:seo` for metadata and structured data; `ecc:react-patterns` / `ecc:react-performance` / `ecc:nextjs-turbopack` for framework work; `ecc:e2e-testing` / `ecc:browser-qa` for Playwright; `ecc:verification-loop` before reporting done. Use `context7` for library docs (Next 16, Motion, GSAP, shadergradient, R3F) rather than memory.
4. **Tokens or nothing.** No raw hex, px, ms or easing outside `globals.css` and `motion/tokens.ts`. No spring/bounce easing. One accent (`--c-brass`). No `#000`, no `#fff`, no shadows, no radius over 2px.
5. **Content from the content layer.** Components never contain user-facing literals. Clinical copy is the client's text verbatim; never invent claims, credentials or outcomes. Invented structural copy is marked `PLACEHOLDER` in the content module.
6. **Reduced motion is a second finished design.** Every effect inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` or Motion's `useReducedMotion`, plus the CSS safety net.
7. **Verify before claiming.** Run `npm run verify` (lint, typecheck, unit tests, build). For UI tasks also run the Playwright project for the touched routes and read the screenshots at 390 / 768 / 1280 / 1920 yourself. Report evidence: commands run, results, screenshot paths. "It should work" is not a status.
8. **Scope discipline.** Finish your task completely and stop. Do not touch other tasks' files. If you find a defect elsewhere, note it under *Findings* in your report; do not fix it.
9. **Report format.** Final message: what was built (files), how it was verified (evidence), deviations from the brief and why, findings for other tasks, open questions for the owner.
10. **Immutability and small files.** New objects, never mutation; files under ~400 lines; functions under 50 lines; early returns.

## Status table

| id | status | depends_on | task |
|---|---|---|---|
| 1 | doing | — | Scaffold Next 16 in this repo; port the concept site's foundation, docs and client resources |
| 2a | doing | — | Research and shortlist licence-free stock video and imagery with direct download URLs |
| 2b | todo | 1, 2a | Download, grade and encode the stock media; generate `media.ts`; write `design/ASSETS.md` |
| 3 | todo | 1 | Motion integration (tween-only config, route curtain primitive) and gated shader gradient |
| 4 | todo | 1 | Test harness: Vitest + RTL, Playwright (4 viewports + reduced motion + axe), Lighthouse CI, `npm run verify` |
| 5 | todo | 1 | Content ingestion: client doc → typed, Zod-validated `src/content/**`; `docs/CONTENT-GAPS.md` |
| 6 | todo | 1 | Vercel staging project, hostname, `SITE_ENV=staging` noindex, first deploy |
| 7 | todo | 3, 4, 5 | Header, desktop nav, mobile nav overlay |
| 8 | todo | 5 | Footer |
| 9 | todo | 3 | Route curtain transition wired to navigation, scroll reset, reduced-motion fade |
| 10 | todo | 5 | SEO baseline: metadata helpers, JSON-LD builders, sitemap, robots, llms.txt, OG image |
| 11 | todo | 7, 8, 10 | T2 Interior template → `/about` |
| 12 | todo | 11 | T6 Index template → `/clinical-services`, `/team`, `/self-assessment` |
| 13 | todo | 12 | T3 Treatment template → `/clinical-services/[slug]` × 11 |
| 14 | todo | 12 | T4 Profile template → `/team/[slug]` × 11 |
| 15 | todo | 11 | T7 Enquiry template → `/contact` with server action and mail adapter |
| 16 | todo | 2b, 9, 11 | T1 Home template → `/` |
| 17 | todo | 2b, 11 | T5 Residences template → `/residences` |
| 18 | todo | 11 | Remaining T2 pages: `/our-process`, `/a-personal-message`, `/fees`, `/privacy`, `/terms` |
| 18b | todo | 12 | Interactive self-assessment scorer → `/self-assessment/[slug]` × 10 |
| 19 | todo | 13, 14, 15, 16, 17, 18, 18b | Cross-template hardening: viewports, 4× throttle traces, reduced motion, keyboard, axe, Safari |
| 20 | todo | 19 | Performance budgets: Lighthouse, image sizes, font preload, bundle audit |
| 21 | todo | 20, 6 | Staging deploy, live smoke test, `HANDOFF.md` |

Deploy checkpoints: after 6, 12, 15, 16, 21.

## Task briefs

### 1 — Scaffold and port the foundation
Create the Next 16 App Router app in this repo root (TypeScript strict, `noUncheckedIndexedAccess`, Tailwind v4, ESLint, Prettier with the Tailwind plugin, `src/` layout, `@/` alias) matching the concept site's config. Port verbatim, then adapt for a multi-page site: `src/app/globals.css` and `sections.css` (tokens, grounds, primitives, reveal safety net, reduced motion, print), `src/motion/{gsap,tokens,Reveal,SmoothScroll,sectionStops,useMediaQuery}`, `src/components/{Mark,Grain,GroundManager,Preloader,ScrollRail,Cursor,LineAction,SectionHeader,Plate}`, `src/lib/cn.ts`, `src/content/brand.ts` (now with the real contact details listed above and `nameUpper` carrying ™ as a separate `trademark` field), `scripts/{prepare-assets,make-og}.mjs`, `public/icon.svg`. Copy `The New Practice - Logo Concept.pdf` to `design/brand/`. Port `docs/00–12` and `CLAUDE.md`/`AGENTS.md`, rewriting every place that says "one-page demo" for a production multi-page site with seven templates; `docs/05` becomes the template architecture from the plan §3.2–3.3; `docs/07` adds Motion and shadergradient with the GSAP/Motion boundary rule; `docs/10` points to this ledger. Add `npm run verify` as `lint && typecheck && build` for now (task 4 extends it). `layout.tsx` renders the chrome slots with the demo's fonts. `app/page.tsx` is a temporary placeholder that renders the lockup so the build has a route. Verify: `npm run verify` clean, `npm run dev` serves `/`, screenshot at 1280 read back. Commit as `feat: scaffold production site and port concept foundation`.

### 2a — Stock media research
No code. Using web search and fetch, produce `design/STOCK-SOURCES.md`: for each slot below, 2–3 candidates with a direct download URL, resolution, duration (video), licence name and licence URL, and a one-line reason it fits `docs/02-art-direction.md`. Prefer Pexels, Pixabay, Mixkit, Coverr (all free for commercial use without attribution); record attribution anyway. Slots — video: (a) gentle Caribbean surf at dawn, no people; (b) dense jungle canopy with slow movement or mist; (c) cenote or still water with light; each ≥ 1080p, 10–30s, loopable. Stills: hero poster (16:9, surf or canopy), 6 residence plates (3:4: corridor or doorway with light, linen bed unoccupied, limestone or plaster close-up, terrace to canopy, still water, shaded pool edge), 4 index plates (3:4: jungle, sea, stone, leaf with rain), 1 discretion band (21:9: figure turned away or empty room), 11 team silhouettes are *not* sourced (generated placeholder). Reject anything alpine, resort-branded, with faces, lotus, candles, hot stones or lens flare. Report the file.

### 2b — Media pipeline
Extend `scripts/prepare-assets.mjs` from the demo to also fetch the chosen URLs from `design/STOCK-SOURCES.md` (a JSON manifest at `design/media.manifest.json` drives it), apply the demo's duotone grade to stills, write AVIF + WebP + LQIP into `public/media/` and regenerate `src/content/media.ts`. For video: download the chosen surf and canopy clips, transcode with ffmpeg to `public/video/hero-loop.{mp4 (h264, ≤ 4 MB), webm (vp9)}` at 1920×1080, trimmed to a seamless loop, and extract a poster frame that goes through the still pipeline. Write `design/ASSETS.md` in the demo's format with source and licence per file. Verify: files exist at expected sizes, `media.ts` type-checks, `npm run verify` clean. Commit `feat: stock media pipeline and first asset set`.

### 3 — Motion and shader gradient
Install `motion`. Create `src/motion/motion-config.ts` exporting a `MotionConfig` wrapper with `reducedMotion="user"` and a default tween transition using the identity curves from `tokens.ts` (map `--e-out-expo`, `--e-in-out-quart` to bezier arrays); export `curtainVariants`, `overlayVariants`, `fadeVariants`. Add an ESLint `no-restricted-imports` rule that forbids `useScroll`, `useSpring` and `useTransform` from `motion/react` (scroll belongs to GSAP; springs are banned). Install `@shadergradient/react @react-three/fiber@^9 three three-stdlib camera-controls` and `@types/three`. Create `src/webgl/AmbientGradient.tsx`: a `next/dynamic({ ssr:false })` client component rendering `ShaderGradientCanvas` + `ShaderGradient` with `type="waterPlane"`, colours canopy `#14231c`, canopy-soft `#1c2e25`, stone `#6f7a72` (tokens read from CSS variables at mount, not hard-coded), `uSpeed ≤ 0.2`, `grain="off"` (the site has its own), `pixelDensity 1`, `lazyLoad`. A `useAmbientEligible()` hook gates it: `prefers-reduced-motion: no-preference`, WebGL2 available, `navigator.connection?.saveData !== true`, `matchMedia('(min-width: 1024px) and (pointer: fine)')`, `deviceMemory >= 4` when reported. It pauses when its section leaves the viewport and on `visibilitychange`. Mount it on the placeholder home page behind a canopy panel at 0.35 opacity to prove it. Record the gradient chunk size from `next build`; it must be a separate chunk not loaded on any other route. Unit tests for the gate hook. Update `docs/04` and `docs/07`. Commit `feat: motion config and gated ambient gradient`.

### 4 — Test harness
Vitest + `@testing-library/react` + jsdom for `src/lib`, `src/content`, `src/server`, hooks. Playwright with projects `mobile-390`, `tablet-768`, `desktop-1280`, `wide-1920`, `reduced-motion` (desktop with `reducedMotion: 'reduce'`), `@axe-core/playwright` helper, a `screenshotRoute(page, name)` helper writing to `tests/e2e/__screenshots__/`. Lighthouse CI config with budgets (mobile perf ≥ 90, CLS < 0.1, LCP < 2.5s) for `/` and one URL per template (fill in as routes land). Scripts: `test`, `test:coverage` (80% threshold on the covered dirs), `e2e`, `e2e:route -- <path>`, `lighthouse`, and `verify` = `lint && typecheck && test && build`. Seed with real tests: `cn`, `brand` schema, `prefersReducedMotion`. Commit `test: unit, e2e and lighthouse harness`.

### 5 — Content ingestion
Write `scripts/ingest-content.mjs` that parses `Final Website Instructions_DRAFT Sept 1 2026 .docx.md` and emits typed modules under `src/content/`: `pages/home.ts`, `pages/about.ts`, `pages/process.ts`, `pages/personal-message.ts`, `pages/fees.ts`, `pages/contact.ts`, `services.ts` (11 entries: slug, title, intro paragraphs, `treats` list, `mayInclude` list or definitions, subtitled sub-sections), `team.ts` (11 entries: slug, name, credentials, role, paragraphs, sort order as in the doc), `assessments.ts` (intro, disclaimer, how-to, 10 questionnaires each with slug, title, 15 questions, the per-questionnaire scoring text), `nav.ts` (primary: About, Our Process, Clinical Services, Team, Residences, Self-Assessment; utility: Contact/Enquire; footer groups), plus `schemas.ts` with Zod schemas and a `content.test.ts` that validates every module and asserts counts (11 services, 11 team, 10 assessments, 15 questions each). Preserve the client's wording exactly, including British spelling; strip markdown emphasis; keep paragraph breaks. Residences gets `pages/residences.ts` with structural `PLACEHOLDER` copy. Write `docs/CONTENT-GAPS.md`: missing residences content, blank contact fields on the contact page (resolved from home), assessment scoring contradiction (resolved to per-questionnaire scoring by owner), legal pages, photography, video, voice-over, ™ usage, Dr. Vasquez-Whitfield's bio lacking a first-line intro like the others, Caroline Adams's bio start. Commit `feat: typed content layer from client document`.

### 6 — Staging on Vercel
`npx vercel link` a new project `thenewpractice-staging` under scope `kidus-projects-8964b022`; add hostname `thenewpractice-staging.kidusder.com` (a wildcard ALIAS exists on that domain, see the demo's `HANDOFF.md`); set env `SITE_ENV=staging` and `NEXT_PUBLIC_SITE_URL`; `src/lib/env.ts` reads them with Zod; `robots.ts` returns disallow-all when staging and `metadata.robots` noindex. `vercel.json` with security headers (CSP allowing self + Vercel + fonts none-external, `Permissions-Policy`, `X-Content-Type-Options`). Deploy with `npx vercel deploy --prod --scope kidus-projects-8964b022`, confirm the URL serves with `noindex`. Record the URL in this file under *Deploys*. Commit `chore: staging deployment`.

### 7 — Header and navigation
Header per plan §3.3: mark + wordmark, primary links + *Enquire* line-action on ≥1024px, *Menu* line-action below; ground-aware via `--ground`; settles after 90vh; hides on scroll-down after 200vh, returns on scroll-up (port the demo logic). `NavOverlay`: full-viewport canopy panel, Motion `AnimatePresence` with a clip-path wipe using `overlayVariants`; nav items at `--t-d1` staggered `lines`; ceiba mark drawing itself; secondary links and founder contact in eyebrow register; focus trap, `Escape` closes, closes on route change, body scroll locked via `stopScroll/startScroll`, `aria-expanded`, `aria-controls`, `inert` on the page behind. Active route marked with the brass tick. Playwright: open/close by pointer and keyboard on all four viewports, axe clean. Commit `feat: header and navigation overlay`.

### 8 — Footer
Per plan §3.3: wordmark marquee (the one permitted; static under reduced motion), four hairline sitemap columns from `nav.ts`, founder contact block, location, legal links, the mark alone. Server component. Playwright screenshot at four widths. Commit `feat: footer`.

### 9 — Route curtain
`app/template.tsx` wraps pages; a `RouteCurtain` client component listens to `usePathname` changes: cover with the canopy curtain and mark draw (`curtainVariants`), reset scroll to top under cover, reveal. Under reduced motion: opacity fade only. Preloader shows once per session, then the curtain handles every navigation. Ensure Lenis and ScrollTrigger refresh after each route change and that no ScrollTriggers leak (assert `ScrollTrigger.getAll().length` stable across three navigations in a Playwright test). Commit `feat: route transitions`.

### 10 — SEO and AI-visibility baseline
`src/lib/seo.ts`: `buildMetadata({ title, description, path, image })` with canonical, OG, Twitter; `src/lib/jsonld.ts`: `organization()`, `person()`, `webPage()`, `breadcrumb()`; `app/sitemap.ts` from the content collections (excluded on staging); `app/robots.ts`; `app/llms.txt/route.ts` summarising the practice and listing routes; `app/opengraph-image.tsx` rendering the lockup on canopy with a per-page title. Unit tests for every builder. Commit `feat: seo and ai-visibility baseline`.

### 11 — T2 Interior → /about
`InteriorTemplate` per plan §3.3 with props from a page module: eyebrow, headline, lead, sections (subtitle + paragraphs + optional list + optional plate), optional sticky index when ≥ 5 sections at ≥1024px, prev/next rail. Build `/about` from `pages/about.ts` including *Our Logo — The Ceiba* with the mark at ~150px on sand. Metadata + JSON-LD via task 10 helpers. Playwright: four widths, reduced motion, axe, keyboard. Read the screenshots against the stillness and restraint tests and iterate until it reads as a monograph page. Commit `feat(interior): template and about page`.

### 12 — T6 Index
`IndexTemplate`: intro block, numbered editorial list with a single travelling glow (port the demo's team glow), hover plate preview following the pointer at ≥1024px with `pointer: fine`, static thumbnails on touch, all items are links. Build `/clinical-services` (11), `/team` (Team §1 copy + 11), `/self-assessment` (intro, disclaimer, how-to, 10). Commit `feat(index): template and three listings`.

### 13 — T3 Treatment
`TreatmentTemplate` per plan §3.3. All 11 services via `generateStaticParams`. Related services = next three in order. Enquire band on dark ground. Commit `feat(treatment): template and eleven service pages`.

### 14 — T4 Profile
`ProfileTemplate` per plan §3.3. Generated silhouette placeholder plate (SVG, duotone, no face) until portraits arrive. *Works alongside* = three other members. Commit `feat(profile): template and eleven team pages`.

### 15 — T7 Enquiry
`EnquiryTemplate` split layout. Form fields: name, email, telephone (optional), enquiringFor (self / family member / professional), message, preferredContact (email / telephone). Client: RHF + Zod, `onBlur`. Server: `enquiry.action.ts` re-validates with the same schema, checks honeypot and a minimum-elapsed-time token, calls `mail.adapter.ts` (Resend when `RESEND_API_KEY` is set, otherwise a `console`-free structured logger that writes to stdout in JSON), returns a discriminated result; never persists anything. `src/lib/logger.ts` with levels. Unit tests: schema, action happy/invalid/honeypot/rate paths with a fake adapter. Playwright: complete the form by keyboard, see the confirmation revealed line by line. Commit `feat(enquiry): template, server action and mail adapter`.

### 16 — T1 Home
`HomeTemplate` per plan §3.3: video hero (poster first, `muted playsinline loop preload="metadata"`, mp4 + webm from task 2b), `AmbientGradient` behind at low opacity when eligible, overlay title *A New Approach to Wellbeing* (Didone, `lines`), subtitle *From Kusnacht to Puerto Aventuras* (eyebrow), *Scroll to discover* cue, `AudioToggle` that renders only when `pages/home.ts` has an `audioSrc` (none yet). Sections: §1 statement with ghosted ceiba and the triad; §2 long-read; §3 *Who we help* two-column list with hover plates; §4 philosophy sticky-index pillars and *Why The New Practice* as a scrubbed manifesto; §5 *Begin the conversation* with founder contact and a link to `/contact`. Hero LCP must be the poster. Commit `feat(home): landing template`.

### 17 — T5 Residences
`ResidencesTemplate`: full-bleed 16:9 plate, drifting plate carousel (demo pattern; native scroll-snap under reduced motion), amenities hairline table, privacy statement, enquire band. Copy from `pages/residences.ts` (`PLACEHOLDER`). Commit `feat(residences): template`.

### 18 — Remaining interior pages
`/our-process` (11 sections, sticky index, the *A Typical Day* section rendered as the demo's timeline rule), `/a-personal-message` (letter layout with signature block), `/fees` (single statement page), `/privacy` and `/terms` (`PLACEHOLDER` stubs clearly marked). Commit `feat(interior): process, letter, fees and legal stubs`.

### 18b — Interactive self-assessment
`/self-assessment/[slug]`: 15 yes/no questions as a hairline list with two line-action toggles per row (radio group semantics), a live tally that appears only after the first answer, a *See your result* line-action that reveals the band (mild / moderate / severe) with the questionnaire's interpretation text and a link to `/contact`; nothing stored, nothing sent; `aria-live` on the result; keyboard complete; reduced-motion safe. Pure scoring function unit-tested (`scoreAssessment(answers) → { total, band }`). Commit `feat(assessment): interactive scorer`.

### 19 — Hardening
Run the full Playwright matrix; read every screenshot; fix layout at all four widths; Chrome DevTools 4× CPU throttle scroll traces on `/`, `/our-process`, `/clinical-services`, zero long tasks > 50ms; reduced-motion walkthrough on every template; keyboard walkthrough; axe clean; Safari-specific: `100dvh`, `clip-path` on transformed elements, video autoplay with poster, `backdrop-filter` avoided. Commit `fix: cross-template hardening`.

### 20 — Performance budgets
Lighthouse CI on `/` and one URL per template; image `sizes` audit; only the display font preloaded; the gradient chunk appears only on `/` at desktop; no client component without a reason. Commit `perf: budgets and audits`.

### 21 — Deliver
`vercel deploy --prod`, smoke test the live URL on all templates, write `HANDOFF.md` (where things stand, the review-call walkthrough, `CONTENT-GAPS.md` summary, how to run/build/deploy). Commit `docs: handoff`.

## Deploys

| after task | URL | date |
|---|---|---|

## Findings and cross-task notes

(agents append here; the main session triages)

### Task 1 — findings (2026-09-14)

- **`src/components/GroundManager.tsx` carries raw hex** (`GROUND_COLOR`, the `isLight` fallbacks) — ported verbatim from the concept site, so it violates rule 4 as written. Task 3 reads token values from CSS variables for the gradient; the same helper could feed GroundManager. Not fixed here (scope).
- **`src/content/media.ts` is a stub** (`Readonly<Record<string, MediaEntry>>`, empty). `<Plate>` throws on an unknown key. Task 2b's regenerated `as const` manifest replaces it; the guard stays harmless.
- **Chrome DevTools MCP cannot launch here** — no Google Chrome installed (Brave and Safari only). Screenshots were taken with the cached Playwright Chromium (`~/Library/Caches/ms-playwright/chromium-1234`) headless. Task 4's `@playwright/test` install resolves this properly.
- **Next 16.3 `next dev` rewrites `AGENTS.md`** with its own block. Disabled with `agentRules: false` in `next.config.ts`; anyone changing that config should know why it is there.
- **`sections.css` uses raw px** (the concept site's convention: tokens for colour/motion, literal px for component geometry). Rule 4 names only `globals.css` and `tokens.ts`; the owner may want to either bless `sections.css` explicitly or budget a token pass.
- **Chrome strings** (`skipLink`, `scrollCue`) live in `src/content/ui.ts`. Task 5's `nav.ts` should sit beside it, not absorb it.
- **`.gitignore`** keeps `.env*` and whitelists `.env.example` so task 6 can commit the example file.
- **`public/og.png`** is the static lockup card from `npm run og`, so `layout.tsx` metadata resolves; task 10's `opengraph-image.tsx` supersedes it.
- **The client document and the signed contract PDF are committed** at the repo root because the brief said to commit everything; both are excluded from Vercel uploads via `.vercelignore`. Owner to confirm that is intended for wherever this repo is hosted.
