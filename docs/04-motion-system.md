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

- A global `<MotionConfig reducedMotion="user" transition={tween}>` in `src/motion/motion-config.ts` (task 3) whose default transition is a tween on the identity's curves. No component passes `type: 'spring'`.
- An ESLint `no-restricted-imports` rule forbidding `useScroll`, `useSpring` and `useTransform` from `motion/react`. Scroll belongs to GSAP; springs are banned.
- Never both on one element. If a scroll-revealed element also needs a state transition, split it into a GSAP wrapper and a Motion child.

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
| `--d-slow` (800ms) | Scroll reveals, image scale on hover, chrome recolour |
| `--d-glacial` (1400ms) | Hero entrance, the ghosted ceiba, section-opening statements, the curtain |

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

### Route curtain — every navigation after the first

Motion, in `app/template.tsx` → `<RouteCurtain>` (task 9), keyed on `usePathname()`:

```
Cover    canopy panel wipes over the outgoing page, clip-path, --d-slow, --e-in-out-quart
         the small ceiba draws outward in the centre (strokes from the point)
Under    scrollTo(0) instantly; Lenis and ScrollTrigger refreshed after mount
Reveal   panel wipes away, --d-slow, --e-in-out-quart; page reveals run as normal
```

Reduced motion: an opacity fade only, `--d-base`. `curtainVariants` live in `motion-config.ts`; the curtain never imports GSAP for its own motion — the mark draw inside it is a CSS `stroke-dashoffset` transition on the same curve.

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
- Ambient gradient (`src/webgl/AmbientGradient.tsx`): home hero only; desktop `≥ 1024px` with `pointer: fine`; `prefers-reduced-motion: no-preference`; WebGL2 present; `saveData` off; `deviceMemory ≥ 4` when reported; `uSpeed ≤ 0.2`; `pixelDensity 1`; paused when its section leaves the viewport and on `visibilitychange`; loaded with `next/dynamic({ ssr: false })` after the hero LCP; a separate chunk that no other route loads. The poster and video are the deliverable; the gradient is additive and removable in one file.
- Every SplitText instance reverted on unmount; every GSAP context scoped to a ref and reverted in cleanup; `ScrollTrigger.getAll().length` stable across three navigations.
- `will-change` applied immediately before a tween and removed in `onComplete`. Never left in a stylesheet (the grain layer and the carousel track are the two tolerated exceptions, documented in their CSS).
- `ScrollTrigger.refresh()` on resize debounced at 200ms and skipped on mobile viewport-height changes (width-only check in `SmoothScroll`).
- No animation runs while its section is outside the viewport.
- Target: **zero** long tasks > 50ms during scroll at 4× CPU throttle. Measure in the Performance panel, not by feel.
