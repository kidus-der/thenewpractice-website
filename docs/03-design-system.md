# 03 — Design System

> **Rule:** no component contains a raw hex, px, ms or easing value. If the token you need is not here, add it to `src/app/globals.css` _and_ here in the same change, then use it. `src/motion/tokens.ts` mirrors the motion tokens for GSAP and Motion.

Tokens are declared once as CSS custom properties on `:root` in `src/app/globals.css` and exposed through Tailwind v4's `@theme` layer. There is no second source.

---

## 1. Colour

### Core palette

**These are the client's values, read out of the vector in their logo PDF — not sampled by eye and not ours to adjust.**

| Token             | Value     | Role                                                                                                                                                  |
| ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--c-canopy`      | `#14231C` | Primary dark ground. Deep near-black green — never `#000`, never neutral.                                                                             |
| `--c-canopy-soft` | `#1C2E25` | Raised surfaces on dark ground; input fills; the second gradient colour                                                                               |
| `--c-bone`        | `#F1ECE0` | Primary light ground. Warm alabaster — never `#fff`, never clinical.                                                                                  |
| `--c-sand`        | `#E3DCCB` | Mid ground; the ceiba section, index bands, plate frames                                                                                              |
| `--c-clay`        | `#C8B9A0` | Muted warm neutral; decorative text on light                                                                                                          |
| `--c-stone`       | `#566059` | Tertiary text, captions, metadata; the third gradient colour                                                                                          |
| `--c-brass`       | `#A9895C` | **The only accent in the identity.** Aged brass. The gold point in the mark, the lockup rule, focus rings, active states, the travelling glow's tick. |

The client's rationale is explicit: _"The single gold point at the center is the only accent color anywhere in the identity."_ There is no second accent, and `--accent` therefore does **not** flip between grounds. Adding a second accent breaks the identity, not just the palette. The ambient gradient uses canopy, canopy-soft and stone — never brass.

### Semantic aliases

Components reference these, not the core palette. This is what makes the dark/light ground inversion trivial.

| Token           | On light ground        | On dark ground                             |
| --------------- | ---------------------- | ------------------------------------------ |
| `--fg`          | `--c-canopy`           | `--c-bone`                                 |
| `--fg-muted`    | `--c-stone`            | `rgb(241 236 224 / 0.64)`                  |
| `--fg-faint`    | `--c-clay`             | `rgb(241 236 224 / 0.40)`                  |
| `--bg`          | `--c-bone`             | `--c-canopy`                               |
| `--bg-raised`   | `--c-sand`             | `--c-canopy-soft`                          |
| `--rule`        | `rgb(20 35 28 / 0.14)` | `rgb(241 236 224 / 0.16)`                  |
| `--rule-strong` | `rgb(20 35 28 / 0.30)` | `rgb(241 236 224 / 0.32)`                  |
| `--accent`      | `--c-brass`            | `--c-brass` _(deliberately does not flip)_ |

Ground inversion is applied by setting `data-ground="dark"` (or `"mid"` for sand) on a section; the aliases are redefined in a single `[data-ground='dark'] { … }` block. No component ever branches on ground itself.

**`[data-ground]` must also declare `color: var(--fg)`.** Redefining a custom property on a section does not re-resolve a `color` already computed on an ancestor — the section has to claim it. Omitting this line renders every dark section ink-on-ink. `sections.css` does this globally.

### Chrome ground

Two further properties are written to `<html>` at runtime by `<GroundManager>`, naming the ground currently under the viewport's top edge:

| Token         | Meaning                                                   |
| ------------- | --------------------------------------------------------- |
| `--ground`    | Background colour of the section beneath the fixed chrome |
| `--ground-fg` | A legible foreground for it — `--c-canopy` or `--c-bone`  |

The header, scroll rail, and cursor use these, because they float outside every section and inherit none of the aliases above. Nothing inside a section should use them. The GroundManager's selector is `main [data-ground], footer[data-ground]` — every template section and the footer must carry `data-ground` or the chrome will not recolour over it.

**A light surface inside a dark section** — the enquiry sheet (T7) — carries `data-surface="light"` instead of `data-ground`. `globals.css` declares the same light aliases under that attribute, so the sheet reads as bone without becoming a ground: GroundManager never sees it and the chrome keeps the section's canopy. Use it for a panel; use `data-ground` for a section.

### Contrast floor

Every foreground/background pair must clear **WCAG AA (4.5:1)** for body text and **3:1** for text ≥ 24px. `--fg-faint` on `--bg` fails AA and is therefore permitted **only** for decorative text that is duplicated in an accessible label — section numerals, letterspaced eyebrow labels of ≤ 3 words. Never for reading copy.

Measured: `--fg-muted` on the **light** grounds — stone `#566059` on bone `#F1ECE0` — is **5.5:1**, and on sand `#E3DCCB` **4.8:1**, so the muted register clears AA at every size on both (the stone was darkened from `#6F7A72` after Task 11, when it measured 3.8:1). On dark ground the muted alias (bone at 0.64) passes. `--fg-faint` (clay) remains decorative-only, and axe measures decorative text too: anything set in it must be `aria-hidden` with an accessible duplicate and is still reported, so prefer the muted register.

**Co-located stylesheets cascade child after parent.** A block that imports its own CSS and then imports a child block puts the child's stylesheet later in the cascade, so a parent's single-class rule for the child's root loses to the child's own (`ContentSection` styles `PlateFigure` with two classes for this reason, ledger Task 11). Parents styling a child block use two classes or a wrapper.

---

## 2. Typography

### Faces

| Role        | Face        | Source                    | Notes                                                                                        |
| ----------- | ----------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| **Display** | Bodoni Moda | Google Fonts, `next/font` | A genuine Didone with optical sizing. Wordmark, all headlines ≥ 32px, the nav overlay items. |
| **Text**    | Jost        | Google Fonts, `next/font` | Geometric sans, Futura-adjacent. Taglines, labels, body, form fields.                        |
| **Mono**    | _(none)_    | —                         | No monospace on this site. Numerals come from Jost's tabular figures.                        |

**These are the client's stated direction, not our taste.** From their rationale:

> The wordmark is set in a high-contrast serif in the Didot/Bodoni family — the same style of typeface Cartier, Vogue, and Chanel use for their wordmarks — paired with a plain geometric sans for the tagline underneath.

Bodoni Moda and Jost are the closest licence-free equivalents, self-hosted through `next/font` so there is no third-party request. **Typeface licensing is the client's responsibility under the contract**; the swap point is the two `next/font` declarations in `src/app/layout.tsx` and nothing else.

### Scale

A modular scale on a 1.25 ratio, expressed in `clamp()` so every size is fluid between 390px and 1920px viewports. No breakpoint-specific font sizes anywhere.

| Token         | Clamp                            | Use                                                                                                                                                 |
| ------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--t-hero`    | `clamp(3.5rem, 11vw, 12rem)`     | Footer marquee                                                                                                                                      |
| `--t-d1`      | `clamp(2.5rem, 6vw, 5.5rem)`     | Statements, the home overlay title, nav overlay items, every title page's `h1` — interior headlines, treatment and profile titles (Tasks 13 and 14) |
| `--t-d2`      | `clamp(2rem, 4vw, 3.5rem)`       | Section headlines, the enquire band's line, the residences statement                                                                                |
| `--t-d3`      | `clamp(1.5rem, 2.5vw, 2.25rem)`  | Sub-headlines, pillar titles, index list items                                                                                                      |
| `--t-lead`    | `clamp(1.125rem, 1.5vw, 1.5rem)` | Lead paragraphs, pull quotes, the letter                                                                                                            |
| `--t-body`    | `clamp(1rem, 1.1vw, 1.125rem)`   | Body copy                                                                                                                                           |
| `--t-small`   | `0.875rem`                       | Captions, form labels, meta                                                                                                                         |
| `--t-eyebrow` | `0.6875rem`                      | Letterspaced caps labels, section numerals, line actions                                                                                            |

### Typographic rules

| Property       | Display (serif)                                                                                                                                                                                      | Text (sans)                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Line height    | `0.95`–`1.05`                                                                                                                                                                                        | `1.6` body, `1.45` lead                           |
| Letter spacing | `-0.03em` at hero, `-0.02em` at d1/d2                                                                                                                                                                | `0` body, `0.18em` on eyebrow caps                |
| Max measure    | `18ch` headlines; `20–30ch` statements                                                                                                                                                               | `62ch` body — hard cap, never exceed; `46ch` lead |
| Case           | Sentence case. **All-caps in the serif only for the wordmark** and the client's own all-caps titles (_A NEW APPROACH TO WELLBEING_).                                                                 | Caps permitted only at `--t-eyebrow`              |
| Widows         | Not tolerated in any headline. Use a non-breaking space before the last word, or an explicit `<br>` at the designed break.                                                                           |                                                   |
| Italic         | Serif italic is the _only_ emphasis mechanism on this site. No bold in the display face. The client's markdown emphasis is stripped on ingestion; italics return only where a template chooses them. |                                                   |

### The eyebrow pattern

Every section opens with the same lockup — this repetition is the site's structural grammar across all seven templates:

```
04 ─────  W H O   W E   H E L P
↑         ↑
numeral   letterspaced caps, --t-eyebrow, --fg-muted
          preceded by a 48px hairline rule in --rule-strong
```

`--fg-muted`, not `--fg-faint`: the label is real content and has to clear AA. `<SectionHeader>` renders it.

---

## 3. Space

An 8px base with a non-linear scale. Larger steps grow faster because luxury layouts live at the top of the scale.

| Token    | Value   | Use                                          |
| -------- | ------- | -------------------------------------------- |
| `--s-1`  | `4px`   | Hairline offsets                             |
| `--s-2`  | `8px`   | Tight pairs                                  |
| `--s-3`  | `16px`  | Related elements                             |
| `--s-4`  | `24px`  | Within a block                               |
| `--s-5`  | `40px`  | Between blocks                               |
| `--s-6`  | `64px`  | Sub-section                                  |
| `--s-7`  | `104px` | Between content groups                       |
| `--s-8`  | `168px` | Section padding, mobile                      |
| `--s-9`  | `264px` | Section padding, desktop                     |
| `--s-10` | `400px` | The deliberate void — at most twice per page |

**Section rhythm:** every section is `padding-block: var(--s-8)` on mobile, `var(--s-9)` on desktop. `sections.css` applies this to `main > section` so it cannot silently stop being true. Sections that size an inner element to the viewport (the hero, pinned statements) opt out with `padding-block: 0`.

---

## 4. Grid

**12 columns. 24px gutter. Full-bleed container with responsive margins.**

| Viewport     | Margin                               | Columns used                                   |
| ------------ | ------------------------------------ | ---------------------------------------------- |
| `< 768px`    | `20px`                               | 4-col mental model; most content is full-width |
| `768–1279px` | `40px`                               | 8 of 12                                        |
| `≥ 1280px`   | `64px`                               | 12                                             |
| `≥ 1920px`   | `auto`, container capped at `1720px` | 12                                             |

### Standing placements

Reuse these; do not invent new column spans per template.

| Name        | Span     | Use                                                                                                                                              |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.p-lead`   | `2 / 8`  | Lead paragraphs, statements, interior body                                                                                                       |
| `.p-offset` | `7 / 13` | Secondary text blocks, profile bio, the counterweight                                                                                            |
| `.p-plate`  | `1 / 7`  | Portrait image plates                                                                                                                            |
| `.p-narrow` | `4 / 10` | Centred-ish text moments (the home statement only)                                                                                               |
| `.p-wide`   | `1 / -1` | Full-bleed media (a `grid12` child spanning everything)                                                                                          |
| `.p-list`   | `2 / 12` | Index and hairline lists: numerals align with the section titles at column 2, the margin holds the brass tick (blessed after Task 12; T3 and T6) |

---

## 5. Interactive states

There are exactly three interactive treatments on this site. Do not invent a fourth. Navigation links, index rows, form submits and the _Enquire_ CTA all resolve to one of them.

**1. Text link** — inline, in body copy and footer columns.
Underline is a `1px` `currentColor` bottom border at `0.3` alpha. On hover, alpha → `1` over `--d-fast`. No colour change. No movement.

**2. Line action** — the primary CTA (`Enquire`, `Menu`, `See your result`, `Send`), primary nav links, self-assessment toggles.
Letterspaced caps at `--t-eyebrow`, with a full-width `1px` rule beneath. On hover the rule wipes from left to right in `--accent` over `--d-base` using `scaleX` from `transform-origin: left`. The label itself does not move. Active route: the brass rule is already drawn.

**3. Media surface** — plates, portraits, index hover previews.
On hover: `scale(1.03)` on the inner `<img>` only, `--d-slow`, `--e-out-expo`, with `overflow: hidden` on the frame so the crop tightens rather than the box growing. No opacity change, no overlay, no caption slide-up.

### Focus

`outline: 1px solid var(--accent); outline-offset: 4px;` — applied via `:focus-visible` only. Never removed. Never replaced with a shadow. The brass is legible on both grounds.

### Form fields

Bottom-rule only. The label overlays the baseline and floats up on focus or when filled; a brass underline wipes in from the left on focus (`--d-base`, `--e-out-expo`). Errors sit outside the control, in `--accent`, in a `role="alert"` line per field. Radius `--radius-input` (`2px`) — the one radius on the site.

---

## 6. Elevation, radius, shadow

|               |                                                                 |
| ------------- | --------------------------------------------------------------- |
| **Shadow**    | None. Zero `box-shadow` declarations in this codebase.          |
| **Radius**    | `0` everywhere, except form inputs at `2px` (`--radius-input`). |
| **Elevation** | Communicated by overlap and ground value only.                  |

If a design problem seems to require a shadow, the layout is wrong.

---

## 7. Breakpoints

```
sm   640px
md   768px
lg  1024px
xl  1280px
2xl 1536px
3xl 1920px
```

Design at **1440px** first, then verify at 390px, 768px, 1280px, 1920px — those four are the Playwright projects. `1024px` is the threshold for desktop-only behaviour: primary links in the header, sticky indexes, pointer-following plate previews, the ambient gradient.

---

## 8. Z-index scale

Named, never numeric-in-component.

| Token           | Value | Layer                                   |
| --------------- | ----- | --------------------------------------- |
| `--z-base`      | `0`   | Page content                            |
| `--z-sticky`    | `10`  | Pinned section elements, sticky indexes |
| `--z-nav`       | `40`  | Header, scroll rail                     |
| `--z-overlay`   | `60`  | Nav overlay, route curtain              |
| `--z-texture`   | `80`  | Grain + vignette                        |
| `--z-cursor`    | `90`  | Custom cursor                           |
| `--z-preloader` | `100` | Entry veil                              |

Note that texture sits **above** the overlay so the grain is continuous across the menu and the curtain — this is a deliberate detail and a common thing to get wrong.

---

## 9. Motion tokens

Defined here for completeness; the choreography that uses them is in `docs/04-motion-system.md`. `src/motion/tokens.ts` mirrors them as GSAP ease names (`D`, `E`, `STAGGER`); task 3 adds the same curves as cubic-bezier arrays for Motion.

| Token              | Value                            | GSAP          | Motion               |
| ------------------ | -------------------------------- | ------------- | -------------------- |
| `--d-instant`      | `120ms`                          | `D.instant`   | `0.12`               |
| `--d-fast`         | `240ms`                          | `D.fast`      | `0.24`               |
| `--d-base`         | `480ms`                          | `D.base`      | `0.48`               |
| `--d-slow`         | `800ms`                          | `D.slow`      | `0.8`                |
| `--d-glacial`      | `1400ms`                         | `D.glacial`   | `1.4`                |
| _(none)_           | `40s`                            | `D.marquee`   | —                    |
| `--e-out-expo`     | `cubic-bezier(0.16, 1, 0.3, 1)`  | `expo.out`    | `[0.16, 1, 0.3, 1]`  |
| `--e-out-quart`    | `cubic-bezier(0.25, 1, 0.5, 1)`  | `quart.out`   | `[0.25, 1, 0.5, 1]`  |
| `--e-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` | `quart.inOut` | `[0.76, 0, 0.24, 1]` |
| `--e-linear`       | `linear`                         | `none`        | `'linear'`           |

`D.marquee` is the footer marquee's seconds per cycle (docs/04 §4), the site's one continuous loop; it has no CSS counterpart because nothing in a stylesheet runs that long.

**There is no spring, elastic, back, or bounce token, and none may be added — in either library.**
