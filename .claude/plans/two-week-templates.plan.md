# Plan: The New Practice — Two-Week Template Milestone

**Source content**: `Final Website Instructions_DRAFT Sept 1 2026 .docx.md` (client, 1,286 lines, 7 page groups)
**Source contract**: `thenewpractice-website_signed.pdf` (signed 21/24 Aug 2026)
**Source concept**: `/Volumes/main-storage-2tb/projects/luxury-spa-website-demo` (client-approved one-pager)
**Selected milestone**: Contract §5 two-week mark — the seven templates in §1 plus site-wide header, primary navigation (incl. mobile) and footer, deployed to a staging URL, working at desktop, tablet and mobile. Not the 50-page build-out.
**Complexity**: Large
**Owner's rule**: no time judgements in this plan; the owner judges time.

---

## 1. Requirements restatement

### 1.1 What the contract says the milestone is

Delivery = the templates below are deployed to staging and the client is emailed. Approval is against the design direction (ultra-premium, discreet, clinical, sophisticated; Kusnacht Practice as the quality reference, original design throughout) and does not require final content in place.

| # | Template (contract §1) | Route(s) in this build | Content in the client doc |
|---|---|---|---|
| T1 | Landing page (home) | `/` | Landing page: video+audio hero, 5 sections, founder contact |
| T2 | Standard interior content page | `/about`, `/our-process`, `/a-personal-message`, `/fees`, `/self-assessment` (intro), legal pages | About (4 sections), Process (11 sections), Thank-you letter, Cost |
| T3 | Treatment / programme page | `/clinical-services/[slug]` × 11 | Clinical Services §1–§11 |
| T4 | Team profile page | `/team/[slug]` × 11 | Our Team §2 (11 bios) |
| T5 | Hospitality / residences page | `/residences` | **None supplied** — see risk R1 |
| T6 | Index / listing page | `/clinical-services`, `/team`, `/self-assessment` | Services intro, Team §1, Assessment list |
| T7 | Enquiry page incl. form | `/contact` | Contact (3 sections + founder details) |
| — | Header, primary nav (desktop + mobile), footer | global | Derived from page set |

Approximate page count once populated: 6 singles + 12 services + 12 team + 11 assessments + contact + 2 legal ≈ 44–46. Inside the 55-page ceiling.

### 1.2 What the owner asked for beyond the contract text

- Port the concept site's style: canopy/bone/brass palette, Didone + geometric sans, hairlines, no shadows, no radius, grain + vignette, the ceiba mark as the central device, slow expo-out motion, hard ground boundaries, "stillness test / restraint test / 60fps test".
- Move the client's resources from the demo into this repo (the logo concept PDF, the extracted mark geometry, the favicon, the palette).
- Raise the visual bar using: recent.design (award-tier listing/editorial patterns), shadergradient (ambient WebGL gradient), react-three-fiber (its runtime), motion.dev (React transitions), and mdx.so as a reference (preloader with phrases, showreel hero, ambient audio with MUTE/UNMUTE, big editorial type, page-level transitions).
- Execute the milestone as a long looped subagent run driven from a ledger (section 7).

### 1.3 Client asks embedded in the content doc that shape the templates

- Home hero: 15s video (ocean surf → jungle, sparse birds, no music) with a warm female voice-over of a fixed script, overlay title *A NEW APPROACH TO WELLBEING*, subtitle *From Kusnacht to Puerto Aventuras*, and a *Scroll to discover* cue. Audio must be opt-in (browser policy and the concept site's rule agree).
- Wordmark carries ™ in the doc's page title.
- Founder contact (Lowell Monkhouse, +1 778-679-3369, lowell@thenewpractice.health, Puerto Aventuras) appears on the home page; the contact page leaves phone/email/website blank.
- Self-assessments: 10 questionnaires. The intro specifies a 0–3 scale with bands 0–10/11–20/21–35/36+; the questionnaires specify 1 point per "yes", 0–15 with bands 0–4/5–9/10–15. These contradict each other (risk R3).
- Fee statement: US$55,500 per week all-inclusive (client's content, rendered verbatim).

---

## 2. Patterns to mirror (from the concept site)

| Category | Source | Pattern |
|---|---|---|
| Naming | `src/sections/Hero.tsx`, `src/components/Mark.tsx` | One component per file, named export, PascalCase file; CSS classes BEM-style `.hero__media`, `.field__underline`; content keys camelCase |
| Tokens | `src/app/globals.css` (`:root`, `@theme`, `[data-ground]`) | No raw hex/px/ms outside the token file; ground inversion via `data-ground="dark|mid"`; `--accent` never flips |
| Motion | `src/motion/Reveal.tsx`, `src/motion/gsap.ts`, `src/motion/SmoothScroll.tsx`, `src/motion/tokens.ts` | One GSAP registration point; one RAF loop (Lenis on GSAP ticker); `gsap.context` + `matchMedia('(prefers-reduced-motion: no-preference)')` in every effect; reveals `once: true`; CSS safety net so nothing is left invisible |
| Errors | `src/sections/Enquiry.tsx` | Zod schema + React Hook Form, `mode: 'onBlur'`, `aria-invalid`, `role="alert"` error line per field, copy from content layer |
| Logging | — | **No pattern exists in the demo** (client-only, nothing submitted). This build adds server-side structured logging in the enquiry server action only. |
| Data access | `src/content/brand.ts`, `src/content/copy.ts`, generated `src/content/media.ts` | Typed TS modules are the only place words and media metadata live; components never contain literals |
| Chrome | `src/components/{Header,Preloader,Grain,GroundManager,ScrollRail,Cursor}.tsx` | Fixed chrome reads `--ground`/`--ground-fg` published on `<html>`; preloader once per session; z-index tokens |
| Tests | — | **No tests exist in the demo.** This build introduces Vitest + Testing Library and Playwright (section 5). |
| Docs | `CLAUDE.md`, `docs/00–12` | Docs are the specification; code that disagrees is the bug; every deviation logged in CLAUDE.md §6a |

---

## 3. Architecture decisions

### 3.1 Stack

| Layer | Decision | Why |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TS strict, `noUncheckedIndexedAccess` | Same as the demo; the demo becomes a head start, not a rewrite |
| Styling | Tailwind v4 `@theme` + the demo's token CSS | 1:1 with the design system doc |
| Scroll choreography | GSAP 3 + ScrollTrigger + SplitText, Lenis | Pins, scrubs, line masks — the demo's signature moves |
| React transitions | **Motion** (`motion/react`) | Route transitions (curtain), menu overlay `AnimatePresence`, layout animations, hover/tap gestures. Global `MotionConfig` forces tween easing with the identity's curves; springs are banned by the design system and are not used. Boundary rule: GSAP owns anything driven by scroll position; Motion owns anything driven by React state. |
| Ambient WebGL | **@shadergradient/react** on **@react-three/fiber v9 + three** | One `ShaderGradientCanvas` behind the home hero video (and optionally the contact page ground), colours locked to canopy / canopy-soft / stone (no brass — the gold point stays the only accent). Loaded with `next/dynamic({ ssr:false })` after the hero LCP, only when `prefers-reduced-motion: no-preference`, WebGL2 available, `navigator.connection.saveData` off, and viewport ≥ 1024px. Poster + video are the default render; the gradient is additive. Contract §3 lists WebGL as not included in the fee, so it is a voluntary, removable enhancement and must never be load-bearing. |
| Forms | React Hook Form + Zod on the client; Zod again in a server action; provider adapter (Resend) behind env; honeypot + time-trap; no persistence of any submitted data (contract §1) | |
| Content | Typed TS modules per collection with Zod schemas validated at build (`src/content/**`), populated from the docx.md. Shaped so a CMS (recommendation: Sanity, on the client's account) can replace the module source after template approval without touching templates. | Contract §8: client creates accounts; that dependency must not block the templates |
| Search / AI visibility | Metadata API per template, JSON-LD (`Organization`, `Person`, `WebPage`, `BreadcrumbList`), `sitemap.ts`, `robots.ts` (noindex while `SITE_ENV=staging`), `/llms.txt` route, OG image per template | Baked into templates now because the client judges them working |
| Fonts | Bodoni Moda + Jost via `next/font` (stand-ins) | Contract §3: typeface licensing is the client's; swap point is one file |
| Hosting | Vercel project `thenewpractice-staging`, scope `kidus-projects-8964b022`, hostname `thenewpractice-staging.kidusder.com`, CLI deploys | Mirrors the demo; GitHub → Vercel integration is not connected on this account |
| Analytics | None on staging; one tool on the client's account after approval | Contract §1/§8 |

### 3.2 Route map and template ownership

```
app/
  layout.tsx                      chrome: header, nav overlay, footer, grain, preloader, transition curtain
  template.tsx                    Motion route transition
  page.tsx                        T1 Home
  about/page.tsx                  T2
  our-process/page.tsx            T2 (long-read with sticky index)
  a-personal-message/page.tsx     T2
  fees/page.tsx                   T2
  residences/page.tsx             T5
  clinical-services/page.tsx      T6
  clinical-services/[slug]/page.tsx  T3
  team/page.tsx                   T6
  team/[slug]/page.tsx            T4
  self-assessment/page.tsx        T6 (+ intro & disclaimer)
  self-assessment/[slug]/page.tsx T2 (static questionnaire, see R3)
  contact/page.tsx                T7
  privacy/page.tsx, terms/page.tsx  T2 (client to supply copy)
  sitemap.ts, robots.ts, llms.txt/route.ts, opengraph-image.tsx
src/
  content/   brand.ts nav.ts pages/*.ts services.ts team.ts assessments.ts schemas.ts
  templates/ HomeTemplate InteriorTemplate TreatmentTemplate ProfileTemplate ResidencesTemplate IndexTemplate EnquiryTemplate
  sections/  reusable section blocks shared across templates
  components/ chrome + primitives (Mark, Plate, LineAction, SectionHeader, Field, …)
  motion/    gsap.ts SmoothScroll.tsx Reveal.tsx tokens.ts motion-config.ts
  webgl/     AmbientGradient.tsx (dynamic, gated)
  lib/       cn.ts slugs.ts seo.ts jsonld.ts env.ts logger.ts
  server/    enquiry.action.ts, mail.adapter.ts
```

### 3.3 Design direction per template (what makes it award-tier, not a brochure)

- **Global chrome.** Header: mark + wordmark left, four primary links + *Enquire* line-action right on desktop; a single *Menu* line-action on mobile. Menu is a full-viewport canopy overlay (Motion `AnimatePresence`, clip-path wipe, `--e-in-out-quart`), nav items as `--t-d1` display type with the ceiba drawing itself in the corner, secondary links and founder contact in the eyebrow register. Header recolours from `--ground`. Footer: wordmark marquee (the one permitted), sitemap in four hairline columns, founder contact, location, legal, the mark alone at the bottom.
- **Route transitions.** A canopy curtain with the mark drawing outward covers the outgoing page and reveals the incoming one; scroll resets under the curtain. Reduced motion: instant swap.
- **T1 Home.** Video hero (`preload="metadata"`, poster first, AVIF/WebP poster), ambient shader gradient behind the video at low opacity on desktop, overlay title in the Didone, subtitle in the eyebrow register, *Scroll to discover* cue with the looping vertical rule, a *Listen* toggle (mdx.so's MUTE/UNMUTE, default off) that plays the monologue track when the client supplies it — hidden until the asset exists. Then: §1 statement with the ceiba ghosted behind the triad (the demo's *One* moment, kept), §2 long-read pair, §3 *Who we help* as a two-column editorial list with hover plate preview, §4 philosophy as sticky-index pillars, *Why The New Practice* as a scrubbed line-by-line manifesto, §5 *Begin the conversation* with founder contact and a short form teaser linking to `/contact`.
- **T2 Interior.** Editorial long-read: eyebrow + headline + lead at `.p-lead`, body at `62ch`, pull-quotes in serif italic, optional sticky section index on ≥1024px for pages with ≥5 sections (Process, About), inline plates at 3:4 / 21:9 only, prev/next page rail at the foot.
- **T3 Treatment.** Hero statement + service numeral, *We provide treatment for* as a hairline two-column list, *Treatment may include* as a numbered index with mask reveals, expandable definitions rendered open (no accordion), related services (three), enquire CTA band on dark ground.
- **T4 Profile.** Portrait plate (3:4, duotoned; silhouette placeholder until photography arrives) at `.p-plate`, name in the Didone, role in the eyebrow, bio at `.p-offset`, *Works alongside* cross-links, back-to-team rail.
- **T5 Residences.** Full-bleed 16:9 plate, drifting plate carousel (demo pattern, pauses offscreen, slows on hover), amenities as a hairline table, privacy-first: no map, no address. Copy is structural placeholder flagged `PLACEHOLDER` pending client content.
- **T6 Index.** Numbered editorial list (`01 — Addiction Treatment`) with a single travelling glow and a hover plate that follows the pointer on desktop; on touch, static thumbnails. Filters only if a collection exceeds twelve items (none does).
- **T7 Enquiry.** Split layout: private-letter copy and founder contact on canopy, form on bone. Fields: name, email, telephone (optional), enquiring for (self / family / professional), message, preferred contact method. Bottom-rule fields, brass underline on focus, confirmation revealed line-by-line. Server action, Resend adapter, structured server log, no storage.

### 3.4 Motion budget (per the demo's rules, extended)

- Character-level splits: at most two per page (hero title, one statement).
- One pinned ScrollTrigger active at a time; pins only on Home and Process.
- Ambient gradient: desktop only, `uSpeed` ≤ 0.2, paused offscreen and on tab blur, unmounted under reduced motion.
- Reduced motion is a second finished design: Lenis off, pins unpinned, video shows poster, gradient absent, curtain replaced by a fade, marquee static.

---

## 4. Files to create or change

| File / area | Action | Why |
|---|---|---|
| `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.prettierrc` | CREATE | Next 16 scaffold matching the demo's settings |
| `CLAUDE.md`, `AGENTS.md`, `docs/00–12` | CREATE (ported and rewritten for a multi-page production site) | Docs are the spec; the loop's agents read them first |
| `design/brand/The New Practice - Logo Concept.pdf`, `design/ASSETS.md` | CREATE (copied) | Client resources moved in |
| `public/icon.svg`, `public/media/**`, `public/video/hero-loop.{mp4,webm}` + poster, `public/audio/` | CREATE | Favicon from demo; placeholder plates via the duotone script; licence-free placeholder hero loop flagged as such |
| `scripts/prepare-assets.mjs`, `scripts/make-og.mjs`, `scripts/ingest-content.mjs` | CREATE | Asset pipeline from the demo; a one-off parser that splits the docx.md into typed content modules for review |
| `src/app/globals.css`, `src/app/sections.css` | CREATE (ported) | Tokens and section styles |
| `src/motion/*`, `src/components/{Mark,Grain,GroundManager,Preloader,ScrollRail,Cursor,LineAction,SectionHeader,Plate}.tsx` | CREATE (ported) | Foundation |
| `src/components/{Header,NavOverlay,Footer,RouteCurtain,AudioToggle,StickyIndex,PlateHover,Field}.tsx` | CREATE | New chrome and primitives |
| `src/webgl/AmbientGradient.tsx` | CREATE | Gated shader gradient |
| `src/content/**` | CREATE | All copy, typed and validated |
| `src/templates/*` and `src/app/**/page.tsx` | CREATE | The seven templates and their routes |
| `src/server/enquiry.action.ts`, `src/server/mail.adapter.ts`, `src/lib/logger.ts`, `src/lib/env.ts` | CREATE | Enquiry backend |
| `src/lib/{seo,jsonld,slugs}.ts`, `app/{sitemap,robots}.ts`, `app/llms.txt/route.ts`, `app/opengraph-image.tsx` | CREATE | Search and AI visibility baseline |
| `vitest.config.ts`, `playwright.config.ts`, `tests/unit/**`, `tests/e2e/**`, `lighthouserc.json` | CREATE | Quality gates |
| `docs/BUILD-LEDGER.md` | CREATE | The loop's task queue (section 7) |
| `.env.example`, `.vercel/` (gitignored), `vercel.json` | CREATE | Staging deploy |

---

## 5. Validation

```bash
npm run lint && npm run typecheck                 # clean
npm run test -- --coverage                         # ≥ 80% on src/lib, src/content, src/server
npm run build                                      # clean, static where possible
npm run e2e                                        # Playwright: 7 templates × 4 viewports, reduced-motion, keyboard, axe
npm run lighthouse                                 # Home + one of each template: perf ≥ 90 mobile, CLS < 0.1, LCP < 2.5s
npx vercel deploy --prod --scope kidus-projects-8964b022   # after each template lands
```

Manual gates per template (the agent does these and records evidence in the ledger):
- Screenshots at 390 / 768 / 1280 / 1920 read back and judged against the stillness and restraint tests.
- Chrome DevTools performance trace on scroll with 4× CPU throttle: zero long tasks > 50ms.
- `prefers-reduced-motion: reduce` walkthrough: nothing invisible, nothing pinned, no gradient.
- Keyboard: skip link, menu open/close/trap/escape, form completion, visible focus on both grounds.

---

## 6. Phases (each phase is a set of ledger tasks)

### Phase 0 — Repository foundation
1. Scaffold Next 16 in this repo; port tokens, motion primitives, mark, grain, preloader, ground manager, cursor, scroll rail, asset scripts, docs, `CLAUDE.md` rewritten for production scope.
2. Copy client resources (`Logo Concept.pdf`, `icon.svg`) into `design/brand/` and `public/`; write `design/ASSETS.md`.
3. Install Motion; create `motion-config.ts` (tween-only, identity curves); install shadergradient + R3F 9 + three; create the gated `AmbientGradient` with a static fallback and a bundle-size check.
4. Test harness: Vitest + RTL, Playwright (4 projects by viewport, one reduced-motion project, axe), Lighthouse CI config, `npm run verify` composite script.
5. Content ingestion: parse the docx.md into `src/content/**` with Zod schemas; a review report listing every heading mapped to a route, plus a `CONTENT-GAPS.md` (residences, contact details, assessment scoring, legal pages, photography, video, audio, ™ usage).
6. Vercel project + staging hostname + `SITE_ENV=staging` noindex; first deploy of the scaffold.

### Phase 1 — Global chrome
7. Header (settled/hidden states, ground-aware), desktop nav, mobile nav overlay, focus trap, escape, route-close.
8. Footer (marquee, sitemap, contact, legal, mark).
9. Route curtain transition + scroll reset + reduced-motion fade.
10. SEO baseline: metadata helpers, JSON-LD builders, sitemap, robots, llms.txt, OG image template.

### Phase 2 — Templates (order chosen so shared blocks land first)
11. T2 Interior → `/about` (first real page; proves eyebrow/lead/body/plate/sticky-index/prev-next).
12. T6 Index → `/clinical-services`, `/team`, `/self-assessment` (numbered list, travelling glow, hover plate).
13. T3 Treatment → `/clinical-services/[slug]` with all 11 services populated.
14. T4 Profile → `/team/[slug]` with all 11 bios populated, silhouette placeholders.
15. T7 Enquiry → `/contact` with server action, Resend adapter, logging, honeypot, tests.
16. T1 Home → hero video + poster + ambient gradient + audio toggle slot, the six home sections.
17. T5 Residences → structure, carousel, amenities table, `PLACEHOLDER` copy.
18. Remaining T2 pages: `/our-process` (sticky index), `/a-personal-message`, `/fees`, `/self-assessment/[slug]` (static questionnaires), `/privacy`, `/terms` stubs.

### Phase 3 — Hardening and delivery
19. Cross-template pass: 4 viewports × 7 templates screenshots, 4× throttle traces, reduced-motion, keyboard, axe, Safari-specific checks (`100dvh`, `clip-path` on transforms, video autoplay policy).
20. Lighthouse budgets; image `sizes` audit; font preload audit; bundle audit (gradient chunk only on desktop home).
21. Staging deploy, smoke test on the live URL, `HANDOFF.md` with the review-call walkthrough and the list of client decisions needed (from `CONTENT-GAPS.md`).

---

## 7. The looped subagent run

**Ledger.** `docs/BUILD-LEDGER.md` lists tasks 1–21 above, each with: `id`, `status` (`todo | doing | done | blocked`), `depends_on`, a one-paragraph brief, acceptance checks, and the verify command. Each task is sized to fit one fresh agent context.

**Driver (recommended).** In this session, `/loop` in dynamic mode with a fixed prompt:

1. Read the ledger; pick the first `todo` task whose dependencies are `done`.
2. Spawn one `general-purpose` agent with: the task brief, the pointer list (`CLAUDE.md`, the governing `docs/*`, the plan section), the GateGuard preamble (state the request and what each command verifies before the first Bash call), and the rule "finish the task, run `npm run verify`, report evidence, do not touch other tasks".
3. On return, the main session runs `npm run verify` itself, reads the screenshots for the touched routes, and either commits (`feat(scope): …`, conventional format, no co-author trailer) and marks `done`, or marks `blocked` with notes after two failed attempts and moves on.
4. After tasks 6, 12, 15, 16 and 21: `vercel deploy --prod` and record the URL in the ledger.
5. Stop when every task is `done` or every remaining task is `blocked`; write the final `HANDOFF.md`.

Main-session context stays small because subagent tool output never enters it. Tasks are independent across templates, so tasks 13 and 14 may run as two agents in parallel once 12 is done.

**Alternatives.** (B) A `Workflow` script with the same ledger, if you would rather the orchestration be deterministic and visible in `/workflows`. (C) A detached `claude -p` bash pipeline from the ECC autonomous-loops skill for an overnight run with no session attached. Both use the same ledger; the choice does not change the tasks.

---

## 8. Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | No residences / hospitality content exists in the client doc | Certain | Build T5 with structural `PLACEHOLDER` copy; list in `CONTENT-GAPS.md`; ask the client (contract §4 pauses only the affected pages, not the milestone) |
| R2 | No video, voice-over, photography or team portraits supplied | Certain | Licence-free placeholder loop and duotoned placeholder plates, all flagged; audio toggle hidden until the track exists; art-direction shot list is a separate contract deliverable |
| R3 | Self-assessment scoring is internally inconsistent, and an interactive scorer is "functionality beyond the enquiry form" (contract §6 change order) | Certain | Render questionnaires statically under T2 with the client's own scoring text; flag the contradiction and offer the interactive scorer as a change order |
| R4 | Contract §3 excludes WebGL; shadergradient + three adds weight | High | Voluntary enhancement only; desktop-only, lazy, gated, removable in one file; static hero is the deliverable |
| R5 | Two animation libraries (GSAP + Motion) drift into overlap | Medium | Written boundary in `docs/04`: scroll-driven → GSAP, state-driven → Motion; lint rule banning `useScroll` from Motion |
| R6 | Next 16 + R3F 9 + shadergradient compatibility | Medium | shadergradient documents R3F 9 + React 19 for App Router; pin versions; smoke test in task 3 before any template depends on it |
| R7 | Health content and regulatory claims | Medium | Render the client's text verbatim; never invent claims; `Kusnacht` references are the client's own words (contract §13) |
| R8 | Contact details differ between pages (home has phone/email, contact page blank) | Certain | Single `brand.ts` source; use the home-page values everywhere; list in gaps |
| R9 | Vercel Hobby cannot password-protect staging | Certain | `noindex, nofollow` via env; unguessable hostname; no sitemap on staging |
| R10 | GateGuard hooks block subagent Bash calls mid-loop | High | Loop prompt includes the fact-forcing preamble; fallback env documented in the ledger |
| R11 | Safari (the audience's browser) breaks `clip-path` on transformed elements, `100vh`, autoplay | Medium | Task 19 tests Safari first; `100dvh`; poster-first video with `muted playsinline` |
| R12 | Fonts are stand-ins | Certain | One swap point in `layout.tsx`; licensing is the client's per contract |

---

## 9. Acceptance

- [ ] Seven templates live on staging, each rendering real client content where it exists and flagged placeholders where it does not
- [ ] Header, desktop nav, mobile nav overlay and footer live on every route
- [ ] Every template passes at 390 / 768 / 1280 / 1920, under reduced motion, by keyboard, and under axe with no serious violations
- [ ] `npm run verify` green; coverage ≥ 80% on `src/lib`, `src/content`, `src/server`
- [ ] Lighthouse mobile performance ≥ 90 on Home and one page per template
- [ ] `CONTENT-GAPS.md` and `HANDOFF.md` written; staging URL recorded; nothing invented in clinical copy
- [ ] Patterns mirrored from the concept site, deviations logged in `CLAUDE.md`
