# CLAUDE.md — Agent Operating Manual

> Read this file first. Then `docs/00-project-brief.md`. Then the doc that governs the layer you are about to touch. Then your task brief in `docs/BUILD-LEDGER.md`. Do not write code before all four.

---

## 1. What this repository is

The **production website** for **The New Practice** — a private behavioural health practice in Puerto Aventuras, in Mexico's Riviera Maya, that treats **one client at a time**. It is a multi-page Next.js 16 site built from **seven templates** (home, interior, treatment, profile, residences, index, enquiry) plus global chrome (header, desktop and mobile navigation, footer, route transitions), populated from the client's own content document and deployed to a staging URL for their review.

The build is run as a ledger-driven sequence of agent tasks. The two files that govern what gets built, in what order, and to what standard:

| File | What it is |
| --- | --- |
| `.claude/plans/two-week-templates.plan.md` | The approved plan: requirements, patterns mirrored from the concept site, architecture (§3), files (§4), validation (§5), phases (§6), risks (§8). |
| `docs/BUILD-LEDGER.md` | The task queue: owner decisions, the rules every agent follows, the status table, and one brief per task. Your task is in here. |

The concept site at `/Volumes/main-storage-2tb/projects/luxury-spa-website-demo` is the **pattern source**: its tokens, motion primitives, chrome and section grammar were ported into this repo in task 1. Copy its conventions. Do not copy its placeholder prose; every word on this site is now the client's.

### What is the client's

- **The identity** — name, tagline (*Private treatment without compromise*), the ceiba mark, the canopy/bone/brass palette, the Didone + geometric-sans type direction. From `design/brand/The New Practice - Logo Concept.pdf`. Lives in `src/content/brand.ts`, `src/components/Mark.tsx`, `src/app/globals.css`.
- **The copy** — every page, service, biography and questionnaire, from `Final Website Instructions_DRAFT Sept 1 2026 .docx.md`, rendered **verbatim** (British spelling included) from typed modules under `src/content/**`. Where the document has no content (residences, legal pages) the module carries structural copy marked `PLACEHOLDER`.
- **The contact details** — founder, phone, email, location. One source: `src/content/brand.ts`.

### What is ours

The architecture, the templates, the motion, the stock media (licence-free, logged in `design/ASSETS.md`), the generated placeholder portraits, and any structural copy marked `PLACEHOLDER`. Fonts are stand-ins until the client licenses the originals.

### The mark

The ceiba: the Maya world tree. Three branches rise, three roots descend, all six meet at one point — *one client, one team, one purpose*. A single gold point marks the intersection and is **the only accent colour in the entire identity**.

Every stroke in `Mark.tsx` is authored starting at the centre and travelling outward, so a `stroke-dashoffset` draw grows *from* the point. That is deliberate and load-bearing. Never recolour the point, add a second accent, or use the mark without it.

## 2. The bar

The reference is https://kusnachtpractice.com for *substance, tone, and structure*. The reference for *craft and motion* is the award-site tier (Awwwards SOTD / FWA / recent.design). We are aiming above the reference site, not level with it.

Three tests every commit must pass:

1. **The stillness test** — with all motion paused, does the frame look like a printed page from a luxury monograph? If it only works because it moves, the layout is not finished.
2. **The restraint test** — is there anything on screen that is decorative rather than intentional? Delete it. Luxury reads as subtraction.
3. **The 60fps test** — does scroll stay locked at 60fps on a mid-tier laptop with the CPU throttled 4×? If not, the effect is not shippable regardless of how good it looks.

## 3. Non-negotiables

| Rule | Why |
| --- | --- |
| No bounce, elastic, spring, or overshoot easing anywhere — in GSAP, in Motion, in CSS | Playful easing reads as consumer-tech, not private clinic. Motion's `MotionConfig` forces tweens; `useSpring` is lint-banned. |
| No pure black (`#000`), no pure white (`#fff`), no neutral greys | The palette is canopy green and bone. "Nothing bright, nothing clinical-white" is the client's own instruction. |
| Exactly one accent: `--c-brass`. It does **not** flip between grounds | The client's rationale: the gold point is "the only accent color anywhere in the identity" |
| No shadows; no radius over `2px` | Elevation by overlap and ground value only. See `docs/02` §6–7. |
| No alpine, Nordic or temperate landscape imagery; no resort clichés | The practice is in the Riviera Maya. See `docs/02-art-direction.md`. |
| No claim of indigenous endorsement or "ancient wisdom" as a modality | The ceiba is a living religious symbol. Name it, state what it means, stop. |
| No stock-photo clichés — no faces, no lotus flowers, no hot stones, no spa-menu imagery | This is a medical practice for people in crisis, not a day spa |
| No emoji, no exclamation marks, no marketing exclamation in copy we write | Tone is clinical, discreet, quietly confident |
| Every animation respects `prefers-reduced-motion` — GSAP `matchMedia`, Motion `useReducedMotion`, and the CSS safety net | Non-negotiable accessibility floor; see `docs/09-performance-accessibility.md` |
| **Components never contain user-facing literals; clinical copy is the client's verbatim** | Never invent claims, statistics, credentials or outcomes. Invented structural copy is marked `PLACEHOLDER` in the content module, never in markup. |
| Nothing a visitor submits is stored | Contract §1. The enquiry action validates, sends through the mail adapter, logs a structured line without personal data, and keeps nothing. |
| No third-party analytics, chat widgets, cookie banners, or trackers on staging | One tool on the client's own account after approval, and not before |
| Scroll-driven motion → GSAP. State-driven motion → Motion. Never both on one element. | Two animation systems drift into overlap unless the boundary is written down. See `docs/04` §0 and `docs/07`. |

## 4. Document map — read the one that governs your task

| Doc | Read it before you… |
| --- | --- |
| `docs/00-project-brief.md` | anything — this is the context |
| `docs/01-brand-strategy.md` | name, write, or place anything brand-bearing |
| `docs/02-art-direction.md` | choose imagery, video, texture, grain, or composition |
| `docs/03-design-system.md` | write a single line of CSS or set a token |
| `docs/04-motion-system.md` | write a single line of GSAP, Motion, or a transition |
| `docs/05-template-architecture.md` | build a template, a route, or a section block |
| `docs/06-copy-deck.md` | put words on screen or touch `src/content/**` |
| `docs/07-tech-stack.md` | add a dependency or create a file |
| `docs/08-asset-pipeline.md` | add an image, video, audio file, or font |
| `docs/09-performance-accessibility.md` | ship anything |
| `docs/10-build-plan.md` | decide what to work on next (it points at the ledger) |
| `docs/11-qa-acceptance.md` | call anything done |
| `docs/CONTENT-GAPS.md` | (written by task 5) ask the client for anything |
| `design/ASSETS.md` | (written by task 2b) use or add any media file |

## 5. Working agreements for agents

The ten rules in `docs/BUILD-LEDGER.md` §*Rules every agent follows* are binding. In short:

**GateGuard.** Before your first Bash call, state in one line the task you are doing and what that command verifies or produces.

**Read first.** This file, the governing docs, your brief, the plan section it cites.

**Use the ECC harness.** The skills that fit the task before writing code; `context7` for library docs rather than memory.

**Tokens or nothing.** Never write a raw hex value, a raw pixel value, or a raw duration outside `globals.css` and `motion/tokens.ts`. If the value you need does not exist as a token, add it to the token file *and* to `docs/03-design-system.md` in the same change.

**Content from the content layer.** Components never contain literals. Clinical copy is the client's text verbatim. Invented structural copy is marked `PLACEHOLDER` in the module.

**Reduced motion is a second finished design.** Every effect gated, plus the CSS safety net.

**Verify before claiming.** `npm run verify`; for UI, the Playwright project for the touched routes with the screenshots at 390 / 768 / 1280 / 1920 read by you. Report evidence. "It should work" is not a status.

**Scope discipline.** Finish your task completely and stop. Do not touch other tasks' files. Note defects elsewhere under *Findings* in your report; do not fix them.

**Immutability and small files.** New objects, never mutation; files under ~400 lines; functions under 50 lines; early returns.

**Ask when it's a taste call with real consequences.** Structural or brand-defining decisions are the owner's. Implementation decisions inside an agreed spec are yours.

## 6. Commands

```
npm run dev        # dev server (Turbopack)
npm run build      # production build — must pass before any commit
npm run start      # serve the production build
npm run lint       # eslint — must be clean
npm run typecheck  # tsc --noEmit — must be clean
npm run format     # prettier
npm run assets     # media pipeline → public/media + src/content/media.ts (task 2b extends)
npm run og         # static Open Graph card → public/og.png (task 10 supersedes)
npm run verify     # lint && typecheck && build — task 4 adds unit tests
```

Task 4 adds `test`, `test:coverage`, `e2e`, `e2e:route`, `lighthouse`. Task 6 adds the Vercel deploy command. Node 26 / npm 11.

## 6a. Deviations from the plan and the docs

Every place the shipped code departs from the plan or this doc set is logged here, in the same commit as the departure. Empty at the start of the build.

| Spec | Shipped | Why | Task |
| --- | --- | --- | --- |

## 7. Definition of done

A template, route or chrome component is done when all of the following are true:

- [ ] It matches its spec in `docs/05-template-architecture.md` and the plan §3.3
- [ ] It uses only tokens from `docs/03-design-system.md` and `docs/04-motion-system.md`
- [ ] Its copy comes from `src/content/**`, verbatim where the client wrote it, `PLACEHOLDER`-marked where they did not
- [ ] It reads correctly with motion disabled (`prefers-reduced-motion: reduce`)
- [ ] It is fully keyboard navigable with a visible focus state, and axe reports no serious violation
- [ ] It holds 60fps on 4× CPU throttle
- [ ] It works at 390px, 768px, 1280px, and 1920px — screenshots read, not assumed
- [ ] `npm run verify` is green, including the tests the task was asked to write
- [ ] It passes the stillness test in §2
- [ ] Any deviation is logged in §6a

---

*If code and docs disagree, the docs are the specification and the code is the bug — unless the owner has explicitly changed direction, in which case update the doc in the same commit and log it in §6a.*
