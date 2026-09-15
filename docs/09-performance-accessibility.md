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
| Initial JS (gzipped), any route | — | < 160kB; the gradient chunk excluded and loaded only on `/` at desktop |
| Initial media, above the fold | — | < 1.6MB including fonts |
| Sustained scroll FPS at 4× CPU throttle | — | **60**, zero long tasks > 50ms (task 19 records traces on `/`, `/our-process`, `/clinical-services`) |
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
| Hero video | `preload="metadata"`, poster-first, poster is the LCP, skipped on saveData / reduced motion, ≤ 4MB |
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
- `will-change` applied immediately before a tween, removed on complete
- `content-visibility: auto` with `contain-intrinsic-size` on below-fold sections of the long interior pages
- Every `<img>`, `<video>` and plate frame has explicit dimensions or an aspect-ratio box
- Fonts: `display: swap`, display face preloaded, fallback metrics adjusted so the swap does not shift layout
- Static generation for every content route; the only server work is the enquiry action

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
