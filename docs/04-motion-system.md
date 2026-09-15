# 04 — Motion System

> This is the document that separates this site from a template. Read it fully before writing a single tween or variant.

## Philosophy

**Motion here is not decoration. It is pacing.** The page controls how fast the reader is allowed to absorb it, the way a film controls a scene through cut length. Every animation answers one of three questions: *what arrived*, *what is important*, or *where am I*. If a motion answers none of them, it is deleted.

Three governing principles:

**1. Slow in, no out.** Elements enter over `--d-slow` or `--d-glacial`. They almost never leave. Content that scrolls away simply scrolls away — no exit animations except in the preloader, the route curtain and the nav overlay.

**2. One thing moves at a time.** Within a viewport, a single element should command motion. Stagger exists so that a group *reads* as one thing arriving in sequence, not as five things moving at once.

**3. Motion is invisible when it works.** The reader should never think "nice animation." They should think "this is calm." Any effect the user *notices as an effect* is too loud — with exactly three intentional exceptions: the home hero, the home statement with the ghosted ceiba, and the route curtain, which are allowed to be moments.

## 0. Two libraries, one boundary

The site uses **GSAP** (ScrollTrigger, SplitText, Lenis on its ticker) and **Motion** (`motion/react`). They never overlap, and the rule that keeps them apart is short enough to memorise:

> **Scroll-driven → GSAP. State-driven → Motion. No springs.**

| Driven by | Library | Examples |
| --- | --- | --- |
| Scroll position, viewport entry, pins, scrubs, parallax, smooth scroll | **GSAP** | `<Reveal>`, hero settle, manifesto scrub, sticky index, timeline rule, travelling glow, header settle/hide, drifting carousel |
| React state: mount/unmount, route change, open/closed, hover/tap, layout change | **Motion** | Route curtain, nav overlay `AnimatePresence`, form → confirmation swap, self-assessment result reveal, index plate preview |

Enforced by:

- `<MotionProvider>` in `src/motion/motion-config.ts`, mounted once in `app/layout.tsx` around the page. It is `<MotionConfig reducedMotion="user" transition={defaultTransition}>`, and `defaultTransition` is `{ type: 'tween', duration: D.base, ease: identityEase.outExpo }`. Every child `motion` component inherits it; no component passes `type: 'spring'`.
- An ESLint `no-restricted-imports` rule (`eslint.config.mjs`) forbidding `useScroll`, `useSpring`, `useTransform`, `useVelocity` and `useMotionValueEvent` from both `motion/react` and `motion`, and forbidding `framer-motion` outright. Scroll belongs to GSAP; springs are banned. Import from `motion/react` only.
- Never both on one element. If a scroll-revealed element also needs a state transition, split it into a GSAP wrapper and a Motion child.

### What `motion-config.ts` exports

| Export | What it is |
| --- | --- |
| `identityEase` | `outExpo`, `outQuart`, `inOutQuart` as cubic-bezier arrays — the `--e-*` tokens for Motion. |
| `durations` | The same `D` object GSAP uses (`src/motion/tokens.ts`), re-exported so a Motion file imports one thing. |
| `defaultTransition` | The tween above. Spread it when a variant needs a different duration. |
| `curtainVariants` | `hidden → cover → reveal`: a canopy panel rises to cover (`clip-path`, `--d-glacial`, `--e-in-out-quart`), then wipes away upward. Task 9 mounts it. |
| `overlayVariants` | `panel` (wipe in `--d-slow`, out `--d-base`, `--e-in-out-quart`, children after the panel on open and before it on close) and `item` (masked line rise, `delayChildren: stagger(0.08)`). Task 7 mounts it. |
| `fadeVariants` | `hidden / visible / exit` on opacity only, inheriting the default transition. The reduced-motion curtain, the result reveal, small swaps. |
| `MotionProvider` | The `MotionConfig` wrapper. |

**Reduced motion in Motion.** With `reducedMotion="user"`, Motion completes every positional value — transforms, `x`/`y`, layout — instantly and keeps only opacity and colour tweens. That gives the nav overlay its specified reduced-motion design (opacity only) for free. It does _not_ touch `clip-path`, so a component whose reduced-motion design is a fade rather than a wipe (the curtain) must read `useReducedMotion()` and choose `fadeVariants`. `prefersReducedMotion()` in `tokens.ts` is for non-React code paths only.

## The forbidden list

| Never | Why |
| --- | --- |
| Bounce, elastic, spring, back easing — GSAP, Motion, or CSS | Playful. Wrong register entirely. |
| Rotation on scroll | Reads as gimmick |
| Parallax on text | Illegible and dated |
| Elements flying in from off-screen edges | 2018 AOS-library vocabulary |
| Anything that animates `width`, `height`, `top`, `left`, or `margin` | Layout thrash. Compositor-only properties: `transform`, `opacity`, `clip-path`, `filter`. |
| Scroll-jacking (overriding scroll to snap between sections) | Hostile. Users must retain scroll control at all times. Smooth-scroll interpolation is fine; hijacking is not. |
| Autoplaying audio | Ever. The home *Listen* toggle is opt-in and defaults off. |
| Loading spinners | The preloader and the curtain are designed moments, not spinners |
| Layout-shifting entrances (a header that grows, a hero that reflows) | CLS budget is 0.1 in CI and 0.02 in intent |

---

## 1. Timing and easing

Tokens are declared in `docs/03-design-system.md` §9. Their application:

| Duration | Used for |
| --- | --- |
| `--d-instant` (120ms) | Cursor state changes, focus rings |
| `--d-fast` (240ms) | Link underlines, small hover states |
| `--d-base` (480ms) | Line-action rule wipes, nav state, form field focus, header settle, result reveal |
| `--d-slow` (800ms) | Scroll reveals, image scale on hover, chrome recolour, the curtain's cover and its reveal (each; §4 _Route transitions_) |
| `--d-glacial` (1400ms) | Hero entrance, the ghosted ceiba, section-opening statements, the preloader's veil |

| Easing | Used for |
| --- | --- |
| `--e-out-expo` | **Default for everything entering.** Fast start, long settle. This curve is 80% of the site's motion. |
| `--e-out-quart` | Slightly softer entrance; hover states, small UI, the mark's stroke draw |
| `--e-in-out-quart` | Only for things that both start and stop on screen: nav overlay open/close, curtain cover/reveal, preloader exit |
| `--e-linear` | Only for continuous loops: the footer marquee, the residences drift |

**Stagger:** `0.06s` default, `0.08s` for larger elements, `0.04s` for character-level splits. Never above `0.12s` — the sequence stops reading as one gesture and starts reading as a queue.

---

## 2. Smooth scroll

**Lenis**, configured conservatively, in `src/motion/SmoothScroll.tsx`:

```js
{ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true, syncTouch: false, touchMultiplier: 1.6 }
```

- `syncTouch: false` — native scroll on touch. Smoothing touch scroll on iOS feels broken and costs battery.
- Lenis runs on GSAP's ticker; there is **exactly one** RAF loop in the application. The cursor lerp and the carousel drift join that ticker; nothing opens its own.
- No component imports Lenis. Scrolling goes through `scrollTo()`, locking through `stopScroll()` / `startScroll()` — the nav overlay and the curtain both use them.
- **Lenis is not created** when `prefers-reduced-motion: reduce` — native scroll.
- **Route changes:** the curtain (task 9) resets scroll to top under cover and calls `ScrollTrigger.refresh()` after the new page mounts. Every page-level GSAP context must revert cleanly on unmount; `ScrollTrigger.getAll().length` must be stable across navigations, and a Playwright test asserts it.

---

## 3. The reveal primitive

95% of the site's scroll motion is one reusable primitive, `<Reveal>` in `src/motion/Reveal.tsx`.

| Property | Value |
| --- | --- |
| Trigger | Element top hits 85% of viewport height (`REVEAL_START`) |
| `once` | `true` — nothing re-animates on scroll-back. Re-triggering reveals is the fastest way to make a site feel cheap. |
| Transform | `translateY(28px) → 0` |
| Opacity | `0 → 1` |
| Clip | `clip-path: inset(0 0 100% 0) → inset(0 0 0% 0)` for masked variants |
| Duration | `--d-slow` |
| Easing | `--e-out-expo` |
| Stagger | `0.06s` between siblings |

Variants (a `variant` prop, not five separate components):

| Variant | Behaviour |
| --- | --- |
| `fade` | Opacity only. For images and large media. |
| `rise` | The default. Translate + opacity. |
| `mask` | Clip-path wipe upward. For headlines and images entering as a block. |
| `lines` | SplitText by line; each line masked and rising, staggered. **The signature move for display type.** Interior headlines, the treatment "may include" index, the confirmation line. |
| `chars` | SplitText by character, staggered `0.04s`. **At most twice per page** — the home overlay title and one statement. Overusing character animation is the single most common way a luxury site starts looking like a portfolio site. |

The CSS in `globals.css` (`[data-reveal]`, the `prefers-reduced-motion` block) is the safety net: if JS never runs or motion is reduced, nothing is left invisible.

---

## 4. Global chrome choreography

### Preloader — the entry veil

Total budget: **1.8s maximum**, skippable by any input (click, key, scroll), **once per session** (`sessionStorage`), shortened to ~0.9s on a warm cache, skipped entirely under reduced motion. Shown on whichever route is entered first.

```
0.0s   Canopy. Nothing.
0.0–1.4s  The ceiba draws itself outward from the point, strokes staggered from centre
0.7s   Wordmark fades in, letterspacing eases open → 0.3em
0.9s   The brass rule draws beneath it, scaleX 0→1
       Hold. (Yes, hold. The pause is the luxury.)
       Veil splits: clip-path inset from centre outward, --d-glacial, --e-in-out-quart
       Preloader removed from DOM, scroll unlocked, `veil:done` dispatched
```

The home hero waits for `veil:done` so the two entrance moments never overlap.

### Route transitions — the curtain, every navigation after the first

`app/template.tsx` renders `<RouteCurtain>` (`src/components/RouteCurtain.tsx`, styles co-located in `RouteCurtain.css`). The preloader owns the first load; from then on every client-side navigation passes through the curtain. Total budget **1.6s of motion** plus however long the route takes to commit, which is a frame or two when the link was prefetched.

```
0.0s   Click on an internal link is caught in the capture phase; Next's <Link> yields.
       Lenis stopped, <main> made inert, skip listeners armed.
Cover  canopy panel rises from the bottom edge, clip-path, --d-slow, --e-in-out-quart
       the small ceiba draws outward from its point in the centre: strokes 1 → 0,
       --d-base, --e-out-quart, stagger 0.06 from centre — finished before the cover is
0.8s   Covered. router.push(). The new route commits under the panel.
Under  window.scrollTo(0,0) and Lenis scrollTo(0, immediate) via resetScroll();
       one paint; ScrollTrigger.refresh() (GroundManager and ScrollRail re-measure)
Reveal panel wipes away upward, --d-slow, --e-in-out-quart; the mark holds, drawn;
       the page's own reveals run as normal beneath it
1.6s   Idle. <main> released and focused (tabindex -1, no scroll); Lenis started;
       the new document.title is announced through a persistent aria-live="polite" region.
```

**Why the click is intercepted.** `usePathname()` changes only once the new page is committed, so a curtain keyed on it alone would always be covering the page it is about to reveal. Navigations that cannot be intercepted — back/forward, programmatic pushes — snap the panel on before the browser paints and play the reveal only. Modified clicks, `target="_blank"`, downloads, external hosts, and same-page hash or query changes are left to the browser.

**Why the state lives outside React.** A root `template.tsx` re-mounts only when the top-level segment changes, and when it does, it re-mounts at the exact moment the route commits — mid-choreography. The controller (phase store, pending navigation, skip listeners) is therefore module-level; each mounted `RouteCurtain` is a view that paints the current phase, portalled into a body-level host. An instance that mounts covered paints covered in the same commit that removed the last one, so no frame shows the page. A pushed route that never commits is released by a watchdog at `6 × --d-glacial`.

**Duration.** Cover and reveal run at `--d-slow` each: `curtainVariants` in `motion-config.ts` declare `--d-glacial`, which is right for one wipe and too long for two back to back. The variants' clip-paths are used as written; the duration is the one thing the curtain tunes, and every animation names its origin keyframe as well as its target, because a finished Web Animation keeps its fill until the next one starts.

**Skip.** Any input — `keydown`, `pointerdown`, `wheel` — completes the running phase and makes the remaining ones instant, exactly as the preloader behaves. The route still commits, scroll still resets, focus still moves.

**Reduced motion.** `useReducedMotion()` selects `fadeVariants`: opacity 0 → 1 → 0 over `--d-fast` on `--e-out-expo`, no clip-path, the mark rendered complete rather than drawn. Scroll reset, `inert`, focus and the announcement are unchanged.

**Boundary.** The panel is Motion (`useAnimate`, state-driven). The mark strokes are the preloader's GSAP `stroke-dashoffset` draw on different elements. No element is driven by both, and `ScrollTrigger.refresh()` is the only other GSAP call.

**Hygiene.** `ScrollTrigger.getAll().length` after three navigations equals a fresh load of the same page; Lenis is created once in `SmoothScroll` and never per route; the preloader's session flag keeps it from returning. `tests/e2e/route-curtain.spec.ts` asserts all of it on every Playwright project, including the reduced-motion project. Next 16 needs no View Transitions flag (the experimental flag was removed as inert) and React's `<ViewTransition>` is not used, so nothing else animates a navigation.

### Nav overlay

Motion `AnimatePresence`, `overlayVariants`: a full-viewport canopy panel enters with a clip-path wipe (`--e-in-out-quart`, `--d-slow`), nav items reveal at `--t-d1` as staggered `lines` (0.08s), the ceiba draws itself once in the corner, secondary links and the founder contact fade in last at the eyebrow register. Close reverses at `--d-base`. Body scroll locked via `stopScroll()`; focus trapped; `Escape` closes; closes on route change. Reduced motion: opacity only.

### Header

Transparent over the first viewport. Past `90vh`, `data-settled` — picks up `--ground` at 88% with a hairline and `backdrop-filter`, `--d-base`. Past `200vh`, hides on scroll-down (`translateY(-110%)`) and returns on scroll-up. GSAP ScrollTriggers, ported from the concept site. Recolours from `--ground-fg` over `--d-base` as the ground beneath it changes.

### Footer marquee

The wordmark repeating at `--t-hero` in `--fg` at `0.055` alpha, `--e-linear`, 40s per cycle. **The single permitted marquee on the site.** Static, one repetition, under reduced motion.

---

## 5. Ground transitions

**Sections paint their own ground. Boundaries are hard edges.**

> The concept site's original spec called for the background to interpolate across section boundaries. It was built, looked at, and reversed. The reasoning is kept because an agent will otherwise try it again.

Why the crossfade fails: a section's text colour switches at its own boundary — it has to, because `--fg` is redefined per section. Any ground that fades *across* that boundary spends the whole fade mis-paired: tighten the window and the incoming section's bone type sits on sand; loosen it and the outgoing section's ink type sits on ink. There is no window that is correct at both ends, and pinned sections make it worse.

Two further traps, both worth knowing:

- **One writer per property.** If a colour must be derived from scroll position, derive it once in a single `onUpdate`. Never one scrubbed tween per section targeting the same property.
- **Custom properties do not re-resolve inherited values.** Each section must claim `color: var(--fg)` itself (`sections.css` does this for every `[data-ground]`).

What remains: `<GroundManager>` publishes `--ground` and `--ground-fg` on `<html>`, naming the section currently under the viewport's top edge. The fixed chrome reads those. They transition over `--d-base`, so the chrome recolours smoothly while the page itself cuts. It re-measures on `ScrollTrigger.refresh()`, which the curtain triggers after every route change.

---

## 6. Section-block choreography (reusable across templates)

The concept site's section moves are the vocabulary the templates draw from. Each is specified once here and mapped to templates in `docs/05`.

| Block | Choreography | Used by |
| --- | --- | --- |
| **Hero settle** | Media `scale 1.08 → 1` over `--d-glacial × 1.4`, `--e-out-expo`, after `veil:done`; lockup draws (mark strokes from centre, wordmark letterspacing, rule `scaleX`, tagline fade); on scroll the media parallaxes `yPercent: 12` and the content lifts `-40px` and fades over 60vh. **Never parallax text.** With video: poster first, then the video fades in over the poster once it can play. | T1 |
| **Ghosted mark + statement** | The ceiba at ~58vh, `--c-bone` at 0.16, `stroke-width 1.5`, behind three lines revealed one at a time; the gold point lands between lines two and three. Pinned for 2× viewport on desktop, 1.4× on mobile; unpinned under reduced motion and authored to read in flow. | T1 §1 |
| **Scrubbed manifesto** | Statement at `--t-d1`, `.p-lead`, pinned 1.5× viewport, revealed line by line on `scrub: 0.8`. The reader controls the pace of the sentence. | T1 §4 *Why The New Practice* |
| **Sticky index** | Left column sticky at `42vh`, one active item at a time: `--fg-muted → --fg` over `--d-base` and a 32px brass rule draws beside it. A reading aid, not a control — anchors are a nicety. ≥ 1024px only. | T1 §4 pillars, T2 pages with ≥ 5 sections |
| **Timeline rule** | A `--rule-strong` hairline the list's full height; an `--accent` rule over it, `scaleY` tied 1:1 to section scroll progress; each time marker becomes `--accent` as the rule passes it. Rendered complete under reduced motion. | T2 `/our-process` *A Typical Day* |
| **Travelling glow** | One radial gradient in `--c-canopy` at 12–20%, bleeding `--s-6` past the row each side, `y` as a transform over `--d-base`; a brass tick in the left margin; driven by pointer **and** focus. One element, not one per row. | T6 index lists |
| **Drifting carousel** | Plates rendered twice; track tweens `xPercent: -50`, `ease: 'none'`, `repeat: -1`, 34s; pauses offscreen via `onToggle`; hover/focus eases `timeScale` to 0.15. No pin, no scrub, no drag. Reduced motion: native `overflow-x: auto` scroll-snap. | T5 |
| **Mark draw on entry** | Strokes from centre, `stagger 0.09 from center`, `--e-out-quart`; point scales in; once. | T2 `/about` ceiba, T3/T4 accents |
| **Discretion band** | One statement, one 21:9 plate, a single `mask` reveal. The least animated block; its absence of motion is the effect. | T5 privacy statement, T2 bands |
| **Field focus / confirmation** | Field rule `scaleX 0 → 1` in `--accent` on focus, `--d-base`; on success (Motion) the fields fade out with a `0.04s` stagger and the confirmation line reveals as `lines`. | T7, home §5 teaser |
| **Hover plate preview** | A 3:4 plate follows the pointer at ≥ 1024px with `pointer: fine`, its image swapping per row with a `--d-fast` crossfade; static thumbnails on touch. The concept site removed this from its team list because it named no people; the index pages *do*, so it returns there and nowhere else. | T6 |

---

## 7. Reduced motion

`prefers-reduced-motion: reduce` is not a degraded experience. It is a second, equally finished design.

| System | Reduced-motion behaviour |
| --- | --- |
| Lenis | Not created. Native scroll. |
| Reveals | Elements render in final state. **No opacity 0.** |
| Pinned sections | Unpinned. Content flows normally in document order. |
| Scrub animations, timeline rule | Rendered at their end state |
| Parallax | Removed |
| Hero video | Not loaded; the poster shows. No scale-settle. |
| Ambient gradient | Not mounted |
| Preloader | Skipped entirely |
| Route curtain | Opacity fade only |
| Nav overlay | Opacity only, no clip-path, no stagger |
| Marquee, carousel | Static; carousel becomes a native scroll-snap track |
| Custom cursor | Removed, native cursor restored |
| Hover scale on images | Removed; hover indicated by a `--rule-strong` outline instead |

Implement as three guards, all three: `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)` wrapping every GSAP effect; `MotionConfig reducedMotion="user"` plus `useReducedMotion()` where a Motion component needs a different variant; and the CSS `@media` block in `globals.css` that resets transforms, opacity and clip-path to final values. The CSS block is the safety net for anything the JS guards miss.

---

## 8. Motion budget

- Character-level splits: at most two per page.
- **One pinned ScrollTrigger active at a time.** Pins only on Home and `/our-process`.
- Ambient gradient (`src/webgl/`): home hero only; desktop `≥ 1024px` with `pointer: fine`; `prefers-reduced-motion: no-preference`; WebGL2 present; `saveData` off; `deviceMemory ≥ 4` when reported; `uSpeed ≤ 0.2` (shipped 0.16); `pixelDensity 1`; paused when its section leaves the viewport and on `visibilitychange`; loaded with `next/dynamic({ ssr: false })` after the hero LCP; a separate chunk that no other route loads. The poster and video are the deliverable; the gradient is additive and removable in one file.
  - Mount `<AmbientGradientLazy className opacity>` and nothing else. It calls `useAmbientEligible()` — the pure rule is `decideAmbientEligibility(env)` in `ambientEligibility.ts`, unit-tested — and renders nothing until every guard passes, so the chunk is never requested on an ineligible device. The two media queries are live subscriptions; flipping Reduce Motion on mid-session unmounts it.
  - Pausing is a real stop: a `FrameloopGate` child inside the R3F tree switches `frameloop` between `always` and `never` from an IntersectionObserver on the wrapper and `document.visibilityState`. The shader keeps its own clock, so on resume the surface is simply further along.
  - Colours are read from `--c-canopy`, `--c-canopy-soft`, `--c-stone` at mount via `readToken()` (`src/lib/tokens.ts`). Never brass. `grain="off"`: the site has its own grain layer above it.
- Every SplitText instance reverted on unmount; every GSAP context scoped to a ref and reverted in cleanup; `ScrollTrigger.getAll().length` stable across three navigations.
- `will-change` applied immediately before a tween and removed in `onComplete`. Never left in a stylesheet (the grain layer and the carousel track are the two tolerated exceptions, documented in their CSS).
- `ScrollTrigger.refresh()` on resize debounced at 200ms and skipped on mobile viewport-height changes (width-only check in `SmoothScroll`).
- No animation runs while its section is outside the viewport.
- Target: **zero** long tasks > 50ms during scroll at 4× CPU throttle. Measure in the Performance panel, not by feel.
