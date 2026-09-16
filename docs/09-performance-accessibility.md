# 09 — Performance & Accessibility

## Why this doc has teeth

A heavy, jittery luxury site is worse than a plain one — it demonstrates ambition without competence. And this practice's audience includes people in acute distress, on older devices, on hotel wifi, at three in the morning, often searching on behalf of someone else. Performance and accessibility here are brand attributes, not compliance chores.

---

## 1. Performance budgets

Two tiers: **CI gates** fail the build; **intent** is what we design to.

| Metric | CI gate (Lighthouse CI, mobile) | Intent |
| --- | --- | --- |
| Lighthouse Performance | **≥ 90** on `/` and one URL per template | ≥ 95 |
| LCP | **< 2.5s** | < 1.8s |
| CLS | **< 0.1** | < 0.02 |
| INP | — | < 150ms throughout scroll |
| TBT | — | < 200ms |
| Initial JS (gzipped), any route | — | < 160kB; the gradient chunk excluded and loaded only on `/` at desktop. Measured 251–259 kB after Task 20 (`/contact` 347 kB with its route-scoped form chunk); the floor set by React, the router, GSAP and Motion — see _Measured budgets_ |
| Initial media, above the fold | — | < 1.6MB including fonts |
| Sustained scroll FPS at 4× CPU throttle | — | **60**, zero long tasks > 50ms (Task 20 recorded the traces on `/`, `/our-process`, `/clinical-services`; see _Measured budgets_) |
| Lighthouse Accessibility / Best Practices | — | 100 / 100 |

### The 4× throttle test is the real gate

Lighthouse scores are easy to game with a light page. What decides whether this site lands is whether scroll is buttery on a mid-range laptop. Procedure:

1. Chrome DevTools → Performance → CPU: 4× slowdown
2. Record a full-page scroll at a natural speed
3. Inspect the frame chart: **zero red long-task bars during scroll**
4. Repeat in Safari with the Web Inspector timeline — the primary target

### Where the budget will actually go

| Cost | Mitigation |
| --- | --- |
| Hero video | `preload="metadata"`, poster-first, the poster complete at first paint, skipped on saveData / reduced motion, ≤ 4MB. Chromium excludes an image that covers the whole viewport from the LCP candidates, so the *reported* LCP element on `/` is the `<h1>`; it must paint with first paint, never after the veil (Task 16, `home.spec.ts`). |
| Ambient gradient (three + R3F + shadergradient) | Separate dynamic chunk, `/` only, desktop only, after LCP, gated, paused offscreen; removed outright if it costs a mobile point |
| GSAP + ScrollTrigger + SplitText | ~50kB gz. Accepted — the core of the product. |
| Motion | Accepted for the curtain and overlay; tree-shaken; no `useScroll`. |
| Lenis | ~4kB gz. Accepted. |
| Pinned sections | Only one active at a time; only on `/` and `/our-process`. |
| `backdrop-filter` on the settled header | Expensive on Safari. If it costs frames, replace with a solid `--ground` at 0.92. |
| Grain overlay | Static tiled SVG, `pointer-events: none`, one layer. **Never animated.** |
| Custom cursor | One lerped `transform` on a single element in the existing ticker. |
| Eleven-item lists with hover plates | One plate element, image swapped; never eleven images decoded at once. |

### Rendering rules

- Compositor-only properties in animation: `transform`, `opacity`, `clip-path`, `filter`
- `will-change` applied immediately before a tween, removed on complete. One standing exception: `HoverPlate` (the pointer-following plate on the home conditions list) holds `will-change: transform` for its lifetime. It is a single element per page, exists only on desktop with a fine pointer, and is written by GSAP `quickTo` on every pointer move, so promoting it once is cheaper than promoting and demoting it around every move; docs/04 §8 tolerates that class of element. Do not extend the exception to anything that scrolls.
- `content-visibility: auto` with `contain-intrinsic-size` on below-fold sections of the long interior pages
- Every `<img>`, `<video>` and plate frame has explicit dimensions or an aspect-ratio box
- Fonts: `display: swap`, display face preloaded, fallback metrics adjusted so the swap does not shift layout
- Static generation for every content route; the only server work is the enquiry action

### Measured budgets (Task 20)

Measured on the merged tree at the end of the template milestone, production build (`next build`, Turbopack), Playwright's Chromium 151 as Lighthouse's browser (`tests/lighthouse/run.mjs`), on an Apple-silicon laptop. Every number below is reproducible with the commands named; the scratch scripts that produced the tables are described in the Task 20 ledger entry.

**Method.** Lighthouse CI runs with `throttlingMethod: "devtools"` (`lighthouserc.json`): a real 4× CPU slowdown and slow-4G request throttling applied to the page, so FCP and LCP are paints that happened. The default `simulate` (lantern) was recorded alongside and is kept out of the gate on purpose: lantern credits a text LCP only after every head-referenced script has downloaded on its modelled slow 4G, so it reports LCP ≈ 4 s on every route of this site while the trace's observed paint is under 100 ms (Task 16 finding). Both methods are in the tables so Task 21 can compare live numbers with either. Assertions use the median of three runs per URL.

**JavaScript.** First-load JS is measured from the prerendered HTML: every `<script src>` a route's document carries (the `noModule` legacy polyfill excluded, since no supported browser fetches it), gzip −9. Attribution comes from `next experimental-analyze` (Next 16's Turbopack analyser; `.next/diagnostics/analyze/data/<route>/analyze.data`).

| Route | Before (gzip) | After (gzip) | Change |
| --- | --- | --- | --- |
| `/` | 347.0 kB | 258.8 kB | −25% |
| `/about` (T2) | 339.7 kB | 251.4 kB | −26% |
| `/clinical-services` (T6) | 342.9 kB | 254.7 kB | −26% |
| `/clinical-services/addiction-treatment` (T3) | 342.9 kB | 254.7 kB | −26% |
| `/team/lowell-monkhouse` (T4) | 342.9 kB | 254.7 kB | −26% |
| `/residences` (T5) | 346.8 kB | 254.5 kB | −27% |
| `/self-assessment/alcohol` | 344.7 kB | 252.6 kB | −27% |
| `/contact` (T7) | 348.1 kB | 347.1 kB | 0% (see below) |

What moved: Zod v4 (87 kB gzip as a real chunk; 131 kB by the analyser's per-module count) left every route. The content modules used to call `schema.parse()` at module scope, and because `Header`, `NavOverlay`, `Preloader` and `Footer` import `NAV`, `BRAND` and `HOME`, the schemas rode along on every page. The modules now export plain objects annotated with the schemas' inferred types; `content.checks.ts` parses each one in `npm test` and `npm run content:check`; `src/content/index.ts` re-exports the schema *types* only. `/contact` keeps Zod deliberately: `enquiryFormSchema` is the React Hook Form resolver, and it is route-scoped (a 100.9 kB gzip chunk that only `/contact` references, holding Zod, react-hook-form and the form).

Top of the shared client bundle after the pass (analyser, gzip, `/about`): `next` 210 kB (react-dom 62 kB of it, the app router and segment cache the rest), `motion-dom` 53 kB + `framer-motion` 19 kB (the `motion/react` runtime behind the curtain, the overlay, the form and the scorer), `gsap` 48 kB (core 19, ScrollTrigger 14, CSSPlugin 8, Observer 4, SplitText 3), `lenis` 5 kB; everything of ours is under 2 kB per file. The 160 kB gzip intent in §1 is therefore not met: the floor set by React, the router, GSAP and Motion is about 250 kB on this stack. `experimental.optimizePackageImports` for `gsap`, `motion`, `motion-dom` and `lenis` was built and measured: byte-identical output (GSAP is imported by deep path and Motion is already tree-shaken by Turbopack), so it is not enabled. The remaining lever is Motion's `LazyMotion` + `m` components (drops the drag, pan and layout-projection features that `motion.div` bundles, roughly 25–30 kB gzip); it touches the curtain, the overlay, the enquiry form and the scorer and is left for the owner to schedule.

**Gradient chunk.** three + R3F + shadergradient + `AmbientGradient` remain one lazy chunk of 1,139,875 bytes raw / 276,974 bytes gzip, referenced by no route's HTML and requested only when `useAmbientEligible()` is true, which is `/` on a desktop with a fine pointer, motion allowed, WebGL2, no `saveData`. Unchanged since Task 3; the decision to keep it stands (docs/07).

**Client components.** Every `'use client'` file owns motion or state (checked file by file; the list is in the Task 20 ledger entry). `HoverPlate`, `IndexList`, `Header`, `Footer`'s `Marquee` import nothing server-only; `Plate` imports the `MEDIA` manifest (15 frames with their 20 px LQIPs) into any client component that renders a plate, which is the design.

**Images.** Every `<Image>` was read in the browser at 390 (3×), 768 (2×), 1280 (1×) and 1920 (1×) — rendered width, `sizes`, the width `next/image` served and the bytes on the wire — on ten routes. Fixed: `ContentSection` plates now carry `sizes` per ratio (`(min-width: 1024px) 52vw, 90vw` for wide plates, `(min-width: 1024px) 36vw, 56vw` for the 3:4 plate that keeps to 62% of the column), and `HoverPlate` mirrors its `clamp(160px, 14vw, 240px)`; before, the About page's canopy plate was fetched at 1200–1920 px for a 217–570 px box. Only the hero poster carries `priority` / `fetchpriority="high"`. Per-frame quality lives in `src/lib/plates.ts` (`index-01` at 60, everything else 75; `images.qualities: [60, 75]`). Served sizes after the pass, worst case per frame: hero poster 60.7 kB at 1920; residences band 87.1 kB at 1920; About sea plate 49 kB at 1200; carousel plates 9–12 kB; the canopy silhouette `index-01` 46 kB at 384, 136 kB at 640 and 372 kB at 1080 wide, the one frame still over the 120 kB plate budget wherever it is served above 640 px (a high-frequency image; the honest fix is a different frame, an owner decision).

**Fonts.** The display face is preloaded and Jost is not; Bodoni Moda now ships one weight (400 upright and italic, the only settings the stylesheets use) instead of 400 + 500: four preloaded files at 48.8 kB instead of 86 kB, eight `@font-face` rules instead of sixteen. `font-display: swap` on every face, with `next/font`'s metric-adjusted fallbacks (`Bodoni Moda Fallback` on Times New Roman, `Jost Fallback` on Arial), which is why CLS is 0.004–0.010 on every title page under both methods.

**Rendering.** `next build` prerenders all 52 pages (`○`/`●`); `/og` is the only function (`ƒ`), by design (docs/09 §5). `dynamicParams = false` on the three `[slug]` routes, so an unknown slug is a 404 at the edge rather than a render. For Task 21 on the live URL: `curl -sI https://<host>/ | grep -i x-vercel-cache` should read `HIT` (or `PRERENDER` on the first request after deploy), never `MISS` on repeat, and `x-matched-path: /`; the same for one route per template. `vercel inspect` listing a function per route is not evidence either way (Task 6 finding).

**Lighthouse, before and after (mobile, median of three runs per route; ms).** *Before* is commit `eb7cbd7` (the merged tree before this task), *after* is this branch. Every route scores Accessibility 100 and Best Practices 100 under both methods. Chromium leaves a full-viewport image out of the LCP candidates, so the reported LCP element is text on every route.

devtools throttling (the CI method):

| Route | Perf before → after | FCP | LCP before → after | LCP element | CLS | TBT before → after | SI |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 80 → 82 | 2117 | 2313 → 2117 | `h1#home-title` | 0.005 | 316 → 322 | 8033 |
| `/about` | 85 → 87 | 2045 | 2135 → 2045 | preloader wordmark | 0.005 | 213 → 199 | 7852 |
| `/clinical-services` | 88 → **90** | 2029 | 2115 → 2029 | `h1` | 0.005 | 74 → 66 | 7846 |
| `/clinical-services/addiction-treatment` | 68 → 75 | 2047 | 5218 → **4428** | `p.t-lead` | 0.005 | 176 → 97 | 7815 |
| `/team/lowell-monkhouse` | 87 → **90** | 2007 | 2159 → 2007 | `h1` | 0.005 | 138 → 57 | 7815 |
| `/residences` | 84 → 87 | 2131 | 2110 → 2131 | `h1` | 0.005 | 230 → 146 | 9226 |
| `/contact` | 73 → 74 | 1821 | 4916 → **4742** | `p.t-body` (the letter) | 0.005 | 87 → 58 | 7798 |
| `/self-assessment/alcohol` | 87 → **90** | 2015 | 2132 → 2015 | `h1` | 0.004 | 144 → 73 | 7745 |

simulated throttling (lantern; recorded, not asserted):

| Route | Perf before → after | FCP | LCP before → after | CLS | TBT | SI |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 82 → 87 | 1657 | 4367 → 3676 | 0.009 | 63 | 3852 |
| `/about` | 83 → 88 | 1655 | 4286 → 3597 | 0.009 | 33 | 3766 |
| `/clinical-services` | 85 → 90 | 1505 | 4062 → 3372 | 0.009 | 7 | 3624 |
| `/clinical-services/addiction-treatment` | 85 → 90 | 1505 | 4061 → 3415 | 0.009 | 20 | 3560 |
| `/team/lowell-monkhouse` | 85 → 91 | 1506 | 4061 → 3225 | 0.009 | 12 | 3589 |
| `/residences` | 78 → 83 | 1657 | 5110 → 4319 | 0.009 | 20 | 4046 |
| `/contact` | 82 → 85 | 1355 | 4656 → 4212 | 0.009 | 18 | 3434 |
| `/self-assessment/alcohol` | 85 → 91 | 1505 | 4061 → 3222 | 0.009 | 18 | 3571 |

**What the gate says now.** Three of the eight routes reach Performance ≥ 90 under the CI method; `/about`, `/residences` and `/` sit at 87 / 87 / 82, and `/clinical-services/addiction-treatment` and `/contact` fail both the score and the LCP assertion. The thresholds were not lowered (`lighthouserc.json`; the two LCP failures and five score failures are the known state for Task 21 to decide on). Two causes, both outside the bundle:

1. **The lead paragraph is the LCP on the treatment and contact routes, and it reveals through opacity.** `Reveal`'s default `rise` variant starts at `opacity: 0`, and Chromium credits an element's LCP only when it is painted opaque, so on a page where the lead runs longer than the `h1` the LCP is the moment the lead's tween ends: after the veil at 4× CPU, about 4.4–4.7 s. The `h1` reveals through SplitText line masks (clip, not opacity) and is credited at first paint, which is why every other route's LCP equals its FCP. The one-line fix is to reveal the lead with the `mask` variant (or lift its starting opacity) in `PageIntro` and the enquiry letter; it changes a motion decision from Tasks 11 and 15, so it is reported rather than made here.
2. **Speed Index of 7.8–9.2 s everywhere is the preloader veil at 4× CPU** (`D.glacial` timeline; SI is 10% of the score and costs each route roughly 5–8 points). TBT is the hydration long task and is now under 200 ms on seven routes (`/` at 322 ms, the hero's pinned stages).

Task 21 should re-run `npm run lighthouse` against the live URL (`--collect.url=`) and expect the same shape: the deployed edge removes nothing from these two causes.

**After the lead reveal fix (Task 21).** The title-page lead in `PageIntro` and the enquiry opening's lead and first paragraphs now reveal with the `mask` variant (a clip; `[data-reveal='mask']` and `[data-reveal-children='mask'] > *`), so Chromium credits them at first paint as it does the `h1`'s line masks; reduced motion and the no-JS safety net already neutralise `clip-path`. Same method as the table above (`npm run lighthouse`, devtools throttling, mobile, median of three, this branch's production build, same laptop); _before_ is the _after_ column above.

| Route | Perf before → after | FCP | LCP before → after | LCP element | CLS | TBT | SI |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 82 → 81 | 2118 | 2117 → 2118 | `h1#home-title` | 0.005 | 343 | 8003 |
| `/about` | 87 → 86 | 2040 | 2045 → 2040 | preloader wordmark | 0.005 | 223 | 7818 |
| `/clinical-services` | 90 → **90** | 2012 | 2029 → 2012 | `h1` | 0.005 | 74 | 7836 |
| `/clinical-services/addiction-treatment` | 75 → 89 | 2029 | **4428 → 2029** | `h1` (was `p.t-lead`) | 0.005 | 98 | 7788 |
| `/team/lowell-monkhouse` | 90 → **90** | 2000 | 2007 → 2000 | `h1` | 0.005 | 99 | 7792 |
| `/residences` | 87 → 85 | 2026 | 2131 → 2026 | `h1` | 0.005 | 211 | 9162 |
| `/contact` | 74 → **90** | 1820 | **4742 → 1824** | `h1` / `p.t-body` (masked, credited at first paint) | 0.005 | 72 | 7811 |
| `/self-assessment/alcohol` | 90 → **90** | 2016 | 2015 → 2016 | `h1` | 0.004 | 79 | 7739 |

Both LCP assertions pass: the treatment route's LCP fell from 4.43 s to 2.03 s and `/contact`'s from 4.74 s to 1.82 s, and on every route LCP now equals FCP. Performance moved 75 → 89 on the treatment route and 74 → 90 on `/contact`. Five routes are at or over 90; `/` (81), `/about` (86), the treatment route (89) and `/residences` (85) miss the score assertion by the Speed Index cost of the preloader veil described in cause 2, which is unchanged and is the owner's decision (`HANDOFF.md` §Performance state). Run-to-run spread on the sub-90 routes is one point (`/` 0.80–0.82, treatment 0.89 × 3). Thresholds are unchanged. Cause 1 above is closed; cause 2 stands.

**4× CPU scroll traces (docs/09 §1, the gate that matters).** Playwright Chromium, 1280 × 800, `Emulation.setCPUThrottlingRate 4`, a scripted 12 px-per-frame scroll from top to foot after the preloader settled, a `PerformanceObserver` on `longtask`, two runs per route on the production build:

| Route | Scroll length | Frames per second | Worst frame | Long tasks > 50 ms during scroll |
| --- | --- | --- | --- | --- |
| `/` | 14,346 px | 57.2 | 43 ms | **0** |
| `/our-process` | 16,928 px | 60.0 | 25 ms | **0** |
| `/clinical-services` | 5,998 px | 60.0 | 21 ms | **0** |

The home page's worst frame lands in the pinned hero stages (two SplitText line sets and the poster's scrub); it stays under a long task but is the one place the 60 fps test is not clean at 4×. Safari's timeline (docs/09 §1 step 4) remains a hand check for Task 21.

---

## 2. Accessibility

Target: **WCAG 2.2 AA**, with the specific ambition of a genuinely good screen-reader and keyboard experience rather than a passing audit. Every template runs under `@axe-core/playwright` on four viewports; a serious violation fails the run.

### Structure

- One `<h1>` per page: the hero title on Home, the page headline on interiors, the service / person's name on treatment and profile pages, the collection title on index pages. Sections use `<h2>`; sub-sections `<h3>`. No level skipping.
- Every section is a `<section>` with `aria-labelledby` pointing at its heading; eyebrow numerals are `aria-hidden`
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`. Skip link to `#main` as the first focusable element.
- Document order matches visual order — verify with the accessibility tree, not by looking. Pinned sections and the split enquiry layout are where this breaks.
- Breadcrumb JSON-LD mirrors the visible prev/next and back rails.

### Keyboard

- Every interactive element reachable in a logical order; `:focus-visible` ring visible on both grounds, never removed
- **Nav overlay:** trigger has `aria-expanded` and `aria-controls`; focus moves into the overlay on open and back to the trigger on close; focus trapped while open; `Escape` closes; the page behind is `inert`
- **Route curtain** traps nothing and steals no focus; focus lands on the new page's `<main>`
- **Index lists:** every row is a real link; the travelling glow and the plate preview follow focus as well as pointer
- **Self-assessment:** each question is a radio group reachable by arrow keys; the result is reachable and announced
- **Enquiry form:** completable end to end by keyboard; the confirmation is focused when it appears
- The preloader traps nothing and is dismissible by any key
- Test by tabbing from the URL bar to the footer without touching the mouse, on every template

### Screen readers

- Decorative imagery: `alt=""`. Content imagery: a real description in the brand voice, from the content layer.
- Custom cursor, grain, vignette, scroll rail, ghosted mark, curtain: `aria-hidden`
- The audio toggle is a real `<button>` with `aria-pressed`
- Form fields have real `<label for>` elements; errors are `role="alert"` and associated via `aria-describedby`; the server action's result is announced
- The assessment tally and result are in an `aria-live="polite"` region
- The video is `aria-hidden` (it is atmosphere); the overlay title is the accessible name of the hero
- Test with VoiceOver on Safari specifically

### Motion

The full reduced-motion specification is in `docs/04` §7. The failure modes to watch:

1. **Content stuck at `opacity: 0`** because a reveal never triggered — the CSS safety net in `globals.css` forces final states independent of JS.
2. **Pinned content unreadable when unpinned** — every pinned block is authored to read correctly in document flow.
3. **A Motion component with only an animated variant** — every `AnimatePresence` child has a reduced variant (opacity only) chosen through `useReducedMotion()` or `MotionConfig reducedMotion="user"`.
4. **Video or gradient loading under reduced motion** — both gated before any request.

### Colour

- Body text ≥ 4.5:1, large text ≥ 3:1 against its ground
- `--fg-faint` fails AA and is restricted to decorative text duplicated in an accessible label
- Nothing is communicated by colour alone: the active index item has a rule *and* a value change; the active nav route has the drawn rule; form errors have text
- Verify both grounds. Dark-ground contrast is where this will fail if it fails.

---

## 3. Resilience

| Condition | Behaviour |
| --- | --- |
| JS disabled | All content readable, layout intact, no motion, nothing invisible. Server-render everything that can be. The nav overlay's trigger degrades to a link to the footer sitemap. The enquiry form still posts (server action) and shows a server-rendered result. |
| Slow connection | Poster instead of video, LQIP blur-up, fonts swap without shift |
| `saveData` | No video, no gradient, no audio |
| Old Safari | Motion degrades, layout holds |
| Print | Bone ground, ink type, images at 3:4, no fixed elements. The self-assessment pages print cleanly — someone will print one to bring to a clinician. |

### Enquiry data handling

The enquiry form is the only place a visitor can hand the site anything, and the contract (§1) says the site collects nothing beyond what a person types there and stores none of it. What happens to a submission, end to end (`src/server/`, Task 15):

- **Sent:** the six fields — name, email, telephone if given, who the enquiry concerns, the message, the preferred channel — as one plain-text email from `enquiries@<site host>` (or `ENQUIRY_FROM_EMAIL`) to `ENQUIRY_TO_EMAIL` through Resend, with the enquirer as reply-to. Resend receives exactly that email and nothing else (no tags, no metadata, no HTML). While `RESEND_API_KEY` is unset (staging today) nothing leaves the machine.
- **Logged:** one JSON line per event on stdout — `enquiry.sent | invalid | rejected | failed | logged | mail.*` — carrying the level, the time, the provider message id, the enquiring-for and preferred-contact values, whether a telephone was given, the rejection reason (`honeypot`, `too-fast`, `expired`) and, for text fields, only their character counts. `src/lib/logger.ts` reduces `name`, `email`, `telephone` and `message` to lengths at every depth; a unit test asserts the words never appear.
- **Stored:** nothing. No database, no file, no cookie, no analytics event. The action's result to the browser is a status and, when invalid, the content-layer error messages — never the submitted text, which is also why a no-JavaScript resubmission starts from an empty form.
- **Not done:** no rate limiting beyond the honeypot and the 3 s / 2 h timing window (the window applies when the client stamped the form; without JavaScript only the honeypot guards), no IP logging, no reCAPTCHA or third-party anti-abuse.

### Self-assessment data handling

The ten questionnaires (`/self-assessment/[slug]`, Task 18b) are scored in the browser and nowhere else: the answers are one array in React state (`src/lib/assessment.ts`), there is no `<form>` to submit, and nothing is written to storage, cookies or the URL, sent in a request, or logged — closing the tab is the only exit, and the metadata says so. The unit test in `src/sections/AssessmentForm.test.tsx` and the e2e in `tests/e2e/assessment.spec.ts` assert each of those absences.

### Security headers

Set in `vercel.json` for every route (task 6), so they apply at the edge without a middleware. Vercel adds `Strict-Transport-Security` itself. Any task that introduces a new origin (a video CDN, an embedded map, an analytics endpoint after approval) widens the matching CSP directive in the same commit and records why here.

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | see below | Only our own origin may run code, load media or be a form target |
| `X-Frame-Options` | `DENY` | Belt-and-braces with `frame-ancestors 'none'` for older agents |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing of our responses |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Outbound links learn the origin, never the path a visitor was on |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | The site never asks for any of them |

CSP directives and the reason each one is as wide as it is:

| Directive | Value | Why |
| --- | --- | --- |
| `default-src` | `'self'` | The floor for anything not listed |
| `script-src` | `'self' 'unsafe-inline' https://vercel.live` | Next emits inline bootstrap scripts for hydration; a nonce-based policy needs a middleware and per-request rendering, which conflicts with static generation (§1). `vercel.live` is the toolbar on preview deployments only. |
| `style-src` | `'self' 'unsafe-inline'` | GSAP and Motion write inline `style` attributes |
| `img-src` | `'self' data: blob:` | LQIP data URIs; three.js textures via blob |
| `media-src` | `'self' blob:` | Hero video and (later) ambient audio are self-hosted |
| `font-src` | `'self'` | `next/font` self-hosts; no Google Fonts host at runtime |
| `connect-src` | `'self' https://vitals.vercel-insights.com` | Server actions; Vercel Speed Insights if ever enabled after approval |
| `worker-src` | `'self' blob:` | three.js and R3F may spawn workers |
| `frame-ancestors` | `'none'` | The site is never embedded |
| `object-src` | `'none'` | No plugins |
| `base-uri` | `'self'` | No `<base>` hijack |
| `form-action` | `'self'` | The enquiry form posts only to its own server action |

Not set: `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`, because nothing here needs `SharedArrayBuffer`, and COEP would block any future cross-origin media without CORP headers.

---

## 4. Verification routine

Run per template (the task's own Playwright project) and again as a whole in task 19:

```
□ Lighthouse CI — Performance ≥ 90, LCP < 2.5s, CLS < 0.1 on / and one URL per template
□ 4× CPU throttle scroll recording — zero long tasks on /, /our-process, /clinical-services
□ Safari macOS + iOS — visual and motion parity
□ Keyboard-only pass, URL bar to footer, on every template; nav overlay open/close/trap/escape
□ VoiceOver pass on one page per template
□ prefers-reduced-motion: reduce — nothing invisible, nothing pinned, no video, no gradient
□ JS disabled — content readable
□ 390 / 768 / 1280 / 1920 — screenshots read; no horizontal scroll, no clipped type
□ axe — zero serious violations
□ Zero console errors or warnings
□ ScrollTrigger.getAll().length stable across three navigations
```

The last line catches the most common real bug in a multi-page GSAP site: triggers leaked across route changes, silently multiplying until scroll stutters.

---

## 5. Search and AI visibility

Contract §1 asks for semantic markup, schema.org, titles and meta, Open Graph, an XML sitemap, robots, `llms.txt`, clean URLs, internal linking, alt text and Core Web Vitals. Task 10 shipped the baseline; every template wires it in. The reference test is not a Lighthouse SEO score but whether a link forwarded at three in the morning unfurls into the lockup with the right page named, and whether a search result reads like the practice speaking.

### What ships

| Piece | File | Notes |
| --- | --- | --- |
| Per-route titles and descriptions | `src/content/seo.ts` | `ROUTE_SEO` for the twelve static routes; `serviceSeo()`, `teamSeo()`, `assessmentSeo()` derive collection items from the client's own opening sentences (`excerpt()`, ≤ 155 characters, cut at a sentence boundary). Titles are `<Page> — The New Practice`; home is `The New Practice — Private treatment without compromise`. No ™ anywhere in metadata. |
| Metadata builder | `src/lib/seo.ts` | `buildMetadata({ title, description, path, ogTitle, type?, image?, noIndex? })` → absolute canonical, Open Graph (`en_GB`, site name, per-page card), Twitter `summary_large_image`, and `robots` from `isIndexable()`. Pure; `SeoContext` is injectable for tests. |
| Structured data | `src/lib/jsonld.ts`, `src/components/JsonLd.tsx` | `organization()`, `person()`, `webPage()`, `medicalWebPage()`, `breadcrumb()`, `itemList()` (a collection page's rows: names and URLs only, Task 12); `<JsonLd data={…} />` inlines them with `<`, `>`, `&` and the Unicode line separators escaped. |
| Sitemap | `src/app/sitemap.ts` | From `allRoutes()`; empty unless `SITE_ENV=production`. Home 1.0, static pages 0.8, collection items 0.6, legal 0.3. |
| Robots | `src/app/robots.ts` | Disallow-all and no sitemap line outside production (Task 6); allow-all plus the sitemap URL in production. |
| `llms.txt` | `src/app/llms.txt/route.ts` | Static. Title, the tagline, the client's opening statement verbatim, then Pages, Clinical services, Team, Self-assessments and Contact, one link per line with the metadata description. |
| Open Graph card | `src/lib/og.tsx`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`, `src/app/og/route.tsx` | The lockup on canopy (mark, wordmark, brass rule, tagline) in Bodoni Moda and Jost fetched from Google Fonts at render time. `/opengraph-image` is the static site default; `/og?title=<page>` adds the page name in bone at the foot and is what `buildMetadata()` points every page at. The file convention receives only route params, never the query string, which is why the per-page card is a route handler. `x-og-fonts: google | fallback` on the response says whether the webfonts loaded. `public/og.png` is retired once Task 11 wires the root metadata. |

### What every template must do

1. Export `generateMetadata` (or `metadata`) returning `buildMetadata({ ...ROUTE_SEO.<key>, path })` for a static route, or `buildMetadata({ ...serviceSeo(service), path: serviceHref(slug) })` for a collection item. Pass `noIndex: true` for anything that should never rank (legal stubs while they are placeholders, form confirmations).
2. Render `<JsonLd data={[webPage({ title, description, path, breadcrumb }), …]} />` in the page. Service pages use `medicalWebPage({ …, about: service.title })`; profile pages add `person(member)`; the home page adds `organization()`. The breadcrumb mirrors the visible back and prev/next rails (§2 Structure).
3. Keep one `<h1>`, real `<section aria-labelledby>` landmarks and content-layer alt text (§2). Structured data describes the page; it never substitutes for it.
4. Link internally with descriptive anchors from the content layer: related services, *Works alongside*, the footer sitemap. No page should be more than two clicks from home.

### The no-claims rule for structured data

Structured data is machine-readable copy and is held to the same rule as the visible copy: nothing the client has not said. Concretely: no `aggregateRating`, `review`, `priceRange` or `openingHours`; no `medicalSpecialty` beyond `Psychiatric` (the one the team page supports); `MedicalWebPage.about` names the service in the client's words and carries no condition list, treatment outcome or success statement; `Person` carries credentials only where the document gives them. `FAQPage` is not used because nothing in the content is a question and its answer. The unit tests in `src/lib/jsonld.test.ts` assert the absence of the rating and outcome fields; keep those assertions when adding a builder.

### Staging and production

`SITE_ENV` is the single switch (`src/lib/env.ts`). Outside `production`: `robots.txt` disallows everything and carries no sitemap line, `sitemap.xml` is an empty urlset, every page's `robots` meta is `noindex, nofollow`, and `metadataBase`, canonicals, Open Graph URLs and `llms.txt` links all use `NEXT_PUBLIC_SITE_URL`, so a staging deploy names only itself. Flipping the two Vercel variables to `production` and the live domain turns everything on together; nothing else changes.
