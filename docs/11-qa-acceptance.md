# 11 — QA & Acceptance

## Three gates

Work passes through three gates. Each is stricter than the last, and none of them is "it looks fine."

1. **Task gate** — an agent runs this on its own work before reporting done; the main session re-runs `npm run verify` and reads the screenshots before committing
2. **Deploy checkpoint** — after tasks 6, 12, 15, 16 and 21, on the staging URL
3. **Ship gate** — task 21, on the staging URL, on real devices, before the link is sent to the client

---

## Gate 1 — Task acceptance

Run for every template, route and chrome component. An agent that reports done without having run this has not finished.

### The verification routine

Four commands, in this order. Each one must be green before the next is worth running.

| Step | Command | What it proves |
| --- | --- | --- |
| 1 | `npm run verify` | `lint`, `typecheck`, the Vitest suite (`npm run test`), then `next build`. The single gate every commit passes. |
| 2 | `npm run test:coverage` | The same suite with the V8 coverage report; thresholds of 80% lines / functions / branches / statements on `src/lib`, `src/content`, `src/server`, `src/webgl/ambientEligibility.ts` and `src/motion/tokens.ts`. Components are not counted — the browser covers them. |
| 3 | `npm run e2e` (or `npm run e2e:route -- <pattern>` for one spec) | Playwright on five projects: `mobile-390`, `tablet-768`, `desktop-1280`, `wide-1920`, `reduced-motion`. Each spec fails on a console error, an uncaught exception or an axe violation at `serious` or above, and writes a full-page PNG to `tests/e2e/__screenshots__/<project>/<name>.png`. |
| 4 | `npm run build && npm run lighthouse` | Lighthouse CI, mobile emulation, three runs against the production build on port 3211: Performance ≥ 0.9, CLS ≤ 0.1, LCP ≤ 2500 ms. Reports land in `.lighthouseci/`. |

`npm run e2e` starts the dev server on port 3210 (or reuses one already there). Set `E2E_PROD=1` to build and serve the production bundle instead, which is what the deploy checkpoints and the Lighthouse run measure. `npm run e2e:ui` opens the Playwright inspector for a failing spec. `npm run content:check` runs the content-layer checks without Vitest.

### The screenshot review

Screenshots are read, not diffed. After `npm run e2e`, open the four width captures for every touched route — `mobile-390`, `tablet-768`, `desktop-1280`, `wide-1920` — and the `reduced-motion` capture, and check each one against the lists below. Report the paths in the task report; the main session reads them again before committing. A route without a screenshot at all four widths is not done.

What to look for, in order: horizontal scroll or clipped type; a collapsed or stretched image; a headline widow; a section whose ground does not match its spec; anything invisible under reduced motion; and finally the stillness test — does the frame read as a designed page with nothing moving.

Every spec uses the helpers in `tests/e2e/helpers/`: `settleMotion(page)` waits for fonts, the preloader handshake and one painted frame; `expectNoConsoleErrors(page)`; `expectNoAxeViolations(page, { impactAtLeast: 'serious' })`; `screenshotRoute(page, name)`. Import `test` from the helpers, not from `@playwright/test`, so console capture starts before navigation.

### Structure
- [ ] Matches its spec in `docs/05` and plan §3.3 — ground sequence, placements, blocks used, eyebrow
- [ ] Heading level is correct and does not skip; one `<h1>`
- [ ] Uses only the standing grid placements from `docs/03` §4
- [ ] Section padding is `--s-8` / `--s-9`, unmodified

### Tokens
- [ ] Zero raw hex values outside `globals.css`
- [ ] Zero raw px / ms / easing values outside `globals.css` and `motion/tokens.ts`
- [ ] Zero `box-shadow`; zero `border-radius` except `--radius-input`
- [ ] No spring, in GSAP, Motion or CSS

### Content
- [ ] Every string imported from `src/content/**`; none in markup
- [ ] Client copy verbatim against the document, British spelling kept
- [ ] `PLACEHOLDER` only where `CONTENT-GAPS.md` says content is missing
- [ ] No widow in any headline at every breakpoint; body measure ≤ 62ch
- [ ] Contact details equal `brand.ts`

### Motion
- [ ] Scroll-driven → GSAP; state-driven → Motion; never both on one element
- [ ] Only `transform`, `opacity`, `clip-path`, `filter` animated
- [ ] `will-change` removed on complete
- [ ] GSAP context scoped to a ref and reverted on cleanup; SplitText reverted
- [ ] Reveals are `once: true`
- [ ] `ScrollTrigger.getAll().length` stable across three navigations through this route

### Accessibility
- [ ] Keyboard reachable, logical order, visible `:focus-visible` ring on both grounds
- [ ] Document order matches visual order (accessibility tree, not the page)
- [ ] Decorative elements `aria-hidden`; content images have real alt text
- [ ] axe: zero serious violations on all four viewports
- [ ] Contrast passes on this route's grounds

### Reduced motion
- [ ] Nothing is invisible
- [ ] If pinned: reads correctly unpinned, in document flow
- [ ] No parallax, no scrub, no scale-settle, no video, no gradient; curtain is a fade

### Responsive
- [ ] Playwright screenshots at 390 / 768 / 1280 / 1920 **read by the agent**, paths reported
- [ ] No horizontal scroll, no clipped type, no collapsed image
- [ ] Touch behaviour specified and implemented (static thumbnails, native scroll-snap), not "the desktop thing but smaller"

### Tests
- [ ] Unit tests for every pure function, hook decision and schema the task introduced, next to the source as `*.test.ts(x)`; `npm run test:coverage` stays at or above 80% on the covered directories
- [ ] A Playwright spec for every touched route in `tests/e2e/`, running on all five projects: console clean, axe clean at `serious`, screenshot written
- [ ] The ambient gradient canvas present only where `AMBIENT_GRADIENT_EXPECTED` says so (home spec); any new gated effect gets the same per-project assertion
- [ ] `npm run verify` green, `npm run e2e` green, and `npm run lighthouse` within budget on the routes the task added to `lighthouserc.json`

### The stillness test
- [ ] With motion disabled, the composition reads as a designed page

---

## Gate 2 — Deploy checkpoints

On the staging URL after tasks 6, 12, 15, 16 and 21:

- [ ] `npx vercel deploy --prod --scope kidus-projects-8964b022` succeeds; URL recorded in the ledger's *Deploys* table
- [ ] The response carries `noindex, nofollow`; `robots.txt` disallows all; no sitemap on staging
- [ ] Every route built so far loads on a phone, a tablet and a laptop
- [ ] Console clean — zero errors, zero warnings
- [ ] Lighthouse recorded and compared with the previous checkpoint. **If it dropped, find out why before continuing.**

---

## Gate 3 — Ship acceptance

Run on the **staging URL**, on real devices, before the link leaves your hands.

### Performance
- [ ] `npm run lighthouse` passes on `/` and one URL per template (`lighthouserc.json` lists them)
- [ ] 4× CPU throttle full-page scroll — zero long tasks on `/`, `/our-process`, `/clinical-services`
- [ ] Safari timeline scroll — no jank on the pinned sections
- [ ] The gradient chunk appears in the network panel only on `/` at desktop, and never on mobile

### Devices
- [ ] iPhone, Safari — real device
- [ ] iPad, Safari
- [ ] MacBook, Safari **and** Chrome
- [ ] Windows, Chrome and Edge
- [ ] Firefox, any platform

### Behaviour
- [ ] Preloader plays once per session, is skippable, short-circuits on a warm cache; every navigation after it runs the curtain
- [ ] Nav overlay opens and closes by pointer and keyboard on all four viewports; focus trapped; `Escape` closes; closes on route change
- [ ] Header settles, hides and returns; recolours over every ground
- [ ] Hero video loops with no visible seam; poster is the LCP; video absent under reduced motion / saveData
- [ ] *Listen* toggle absent (no audio asset yet)
- [ ] Residences carousel drifts seamlessly, slows on hover/focus, pauses offscreen; native scroll-snap under reduced motion
- [ ] Index glow and plate preview follow pointer and focus; static thumbnails on touch
- [ ] Enquiry form validates on blur, shows errors accessibly, submits through the action, shows the confirmation; honeypot and time-trap reject; **nothing is persisted anywhere**
- [ ] Self-assessment scores correctly (unit test + one manual run per band); result announced; nothing sent
- [ ] All 11 service, 11 team and 10 assessment routes resolve; prev/next and back rails correct

### Content
- [ ] Copy QA checklist passes (`docs/06`)
- [ ] `CONTENT-GAPS.md` lists every missing or resolved item and nothing on screen contradicts it
- [ ] No meta-commentary on screen
- [ ] No clinical claim, statistic, credential, accreditation or outcome the client did not write
- [ ] `design/ASSETS.md` complete — every file has a source URL and licence; no image traceable to a competing practice

### Search surface
- [ ] Metadata title and description per route; canonical; OG and Twitter cards render at 1200×630
- [ ] JSON-LD validates (Organization, Person × 11, WebPage, BreadcrumbList)
- [ ] `robots.ts` disallows on staging and will allow in production by env alone; `sitemap.ts` lists every route in production
- [ ] `/llms.txt` summarises the practice and lists routes
- [ ] Favicon renders on light and dark browser chrome

### Resilience
- [ ] JS disabled — content readable, layout intact, nothing invisible
- [ ] Reduced motion — complete and finished, not degraded
- [ ] Print — clean single-column output on an interior page and an assessment

---

## Bug severity

| Level | Definition | Ship? |
| --- | --- | --- |
| **S0** | Content invisible, page broken, client copy altered, a fabricated clinical claim, an unlicensed or competitor-sourced image, `noindex` missing on staging, a submitted enquiry persisted | Never |
| **S1** | Dropped frames on scroll, keyboard trap, contrast failure, broken on Safari, a route that 404s, leaked ScrollTriggers | Never |
| **S2** | Motion off-spec, wrong token, widow in a headline, `PLACEHOLDER` shown where content exists | Fix before sending |
| **S3** | Minor spacing, a caption tweak | Ship, note it in `HANDOFF.md` |

---

## The final read

Before the link leaves your hands, do this once, deliberately, and not on the machine you built it on:

1. Open the staging URL on a phone, cold, on cellular data
2. Go through every template at the pace a stranger would — not the pace of someone checking their own work
3. Ask: *would the client see their practice in this?*

If the answer hesitates anywhere, that place is the bug. It is almost always the hero, the home statement, or the transition between pages — and it is almost always pacing rather than pixels.
