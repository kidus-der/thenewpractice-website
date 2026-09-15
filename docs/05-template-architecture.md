# 05 — Template Architecture

> Source: plan §3.2 (route map) and §3.3 (design direction per template). This document is the build spec for every route; the plan is the authority if the two ever disagree, and the disagreement is logged in `CLAUDE.md` §6a.

## Structural principle

Seven templates, one grammar. Every template opens with the eyebrow lockup, alternates ground in hard cuts, places text on the standing grid placements, and draws its motion from the section blocks in `docs/04` §6. A visitor should be able to land on any route and know, without a logo, that it is the same house.

Templates take **props from a content module**; they contain no copy, no route strings and no media keys of their own. A template rendered with a different module is a different page, not a different design.

## Route map

```
app/
  layout.tsx                        chrome: skip link, smooth scroll, ground manager, preloader,
                                    header + nav overlay (task 7), scroll rail, cursor,
                                    footer (task 8), grain
  template.tsx                      route curtain (task 9)
  page.tsx                          T1 Home
  about/page.tsx                    T2 Interior
  our-process/page.tsx              T2 Interior (11 sections, sticky index, timeline rule)
  a-personal-message/page.tsx       T2 Interior (letter layout, signature block)
  fees/page.tsx                     T2 Interior (single statement)
  privacy/page.tsx, terms/page.tsx  T2 Interior (PLACEHOLDER stubs)
  residences/page.tsx               T5 Residences
  clinical-services/page.tsx        T6 Index (11)
  clinical-services/[slug]/page.tsx T3 Treatment × 11
  team/page.tsx                     T6 Index (11)
  team/[slug]/page.tsx              T4 Profile × 11
  self-assessment/page.tsx          T6 Index (10) + intro, disclaimer, how-to
  self-assessment/[slug]/page.tsx   Interactive scorer × 10 (task 18b)
  contact/page.tsx                  T7 Enquiry
  sitemap.ts, robots.ts, llms.txt/route.ts, opengraph-image.tsx   (task 10)

src/
  content/    brand.ts ui.ts nav.ts pages/*.ts services.ts team.ts assessments.ts schemas.ts media.ts
  templates/  HomeTemplate InteriorTemplate TreatmentTemplate ProfileTemplate
              ResidencesTemplate IndexTemplate EnquiryTemplate
  sections/   reusable section blocks shared across templates
  components/ chrome + primitives (Mark, Plate, LineAction, SectionHeader, Field, Header,
              NavOverlay, Footer, RouteCurtain, AudioToggle, StickyIndex, PlateHover, …)
  motion/     gsap.ts SmoothScroll.tsx Reveal.tsx tokens.ts sectionStops.ts useMediaQuery.ts
              motion-config.ts
  webgl/      AmbientGradient.tsx (dynamic, gated)
  lib/        cn.ts slugs.ts seo.ts jsonld.ts env.ts logger.ts
  server/     enquiry.action.ts mail.adapter.ts
```

Navigation: primary — About, Our Process, Clinical Services, Team, Residences, Self-Assessment; utility — Contact / _Enquire_; footer groups from `nav.ts`.

---

## Global chrome

### Header

`src/components/Header.tsx` + `Header.css` (client, mounted once in `app/layout.tsx`; it renders the overlay as its sibling).

Fixed, `--z-nav`. Left: the ceiba (16px) and the wordmark in the display face, letterspaced, one `Link` home named _The New Practice_ — the only place the wordmark appears in the chrome, never with the ™. Right, ≥ 1024px: the six primary routes from `nav.ts` as line actions, then _Enquire_; below 1024px a single _Menu_ line action whose label reads _Close_ while the overlay is open (both labels share one grid cell, so the trigger never changes width).

**Ground.** The header reads `--ground-fg` from `<html>` at all times, not only once settled: an interior page opens on bone. `Header.css` carries a `body:has(main > [data-ground='light' | 'mid']:first-child)` fallback for the frames before GroundManager has painted. Every template's first section must carry `data-ground` (docs/03 §1).

**Scroll** (GSAP, ported from the concept site): transparent over the first viewport; past 90vh `data-settled` — ground at 88%, blur, a hairline drawn as a pseudo-element so the box never changes size; past 200vh hides on scroll-down and returns on scroll-up. On a page too short to scroll 200vh the hide trigger is inert (ScrollTrigger otherwise clamps the start onto the end and reports a phantom scroll-down on refresh).

**Current route.** `isActiveRoute(href, pathname)` in `nav.ts` — a section route owns its children — sets `aria-current="page"`, and the brass rule is already drawn under that label. The six route links rest _without_ the line action's hairline: six resting rules in a row read as tabs and take the CTA's distinction from it; hover and focus still wipe the brass in. _Enquire_ and the trigger keep the full treatment. (Departure from docs/03 §5's resting rule; logged in the ledger, Task 7.)

**Without JS** the primary links are shown at every width in place of the trigger (a `<noscript>` style inside the header), so navigation never depends on the overlay.

### Nav overlay

`src/components/NavOverlay.tsx` + `NavOverlay.css` (client). Rendered by the header from derived state: the menu belongs to the route it opened on and to viewports below 1024px, so a route commit or a resize past the threshold closes it during render — no effect synchronises it.

Full-viewport canopy panel at `--z-overlay`, beneath the texture and the cursor, `data-ground="dark"` so the semantic aliases already hold. Motion `AnimatePresence` with `overlayVariants`: clip-path wipe in over `--d-slow`, out over `--d-base`, `--e-in-out-quart`, children after the panel on open and before it on close. The six primary routes at `--t-d1` in the Didone, each its own masked line, rising with `delayChildren: stagger(0.08)`; the contact column (_Enquire_, the founder's telephone and email as line actions, the location, all from `brand.ts` and `nav.ts`) fades in last; the ceiba draws outward from its point in the lower-right corner once per open (GSAP `stroke-dashoffset`, on different elements from Motion's). Current route, hover and focus all draw the same **brass tick** — the line action's rule laid beside the word instead of under it, running from the page edge toward the label — so a 5rem Didone line is never underlined. No numerals, no secondary page list: the footer carries the full sitemap.

**Behaviour.** Trigger: `aria-expanded`, `aria-controls`. Panel: `role="dialog" aria-modal="true" aria-label`. Focus moves to the first link on open and back to the trigger on close; Tab and Shift+Tab cycle through the header (wordmark, trigger) and the panel; `Escape` closes; the page behind (`main`, `footer`) is `inert`; body scroll locked through `stopScroll()` / `startScroll()`. The header stays above the panel (`--z-overlay + 1`) while it is open.

**Navigation from the menu.** A click on a menu link does _not_ close the overlay. The header drops back under the overlay, the route curtain (Task 9) covers header and panel canopy-over-canopy, and the overlay closes when the new route commits — the page changes beneath one continuous surface. A link to the current route simply closes it. Without the curtain the same route-commit close still applies.

**Reduced motion:** opacity fade over `--d-fast`, no clip-path, no stagger, no draw — `useReducedMotion()` selects the variants, and `NavOverlay.css` carries the safety net.

### Footer

`src/components/Footer.tsx` with its co-located `Footer.css` (chrome components own their stylesheet; `sections.css` is for template blocks). Server component on canopy, `<footer role="contentinfo" data-ground="dark">`, mounted once in `app/layout.tsx` after `{children}`, so it closes every route. Top to bottom:

| Part       | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marquee    | `<Marquee>` (`src/components/Marquee.tsx`), the only client code in the footer and the one permitted marquee on the site. The wordmark at `--t-hero` in `--fg` at `0.06` alpha, three repetitions per set, the set rendered twice, GSAP `xPercent: -50`, `ease: 'none'`, `repeat: -1`, 40s per cycle, paused offscreen through a ScrollTrigger `onToggle`, inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`. Under reduced motion `Footer.css` shows one static repetition aligned to the page margin and allowed to run out of frame. The whole band is `aria-hidden`; the duplicate set is `aria-hidden` again and the wordmark exists as real text in the lockup below. |
| Sitemap    | `<nav aria-label="Footer">` with a visually hidden `<h2>`; the four `NAV.footer` groups (_Practice_, _Care_, _Contact_, _Legal_) as `<h3>` eyebrows over `.link` items at `--t-small`. Laid on the 12-column grid: one column below 768, two at 768, four at 1024. Each group carries a top hairline; the vertical hairline between groups sits in the gutter so column text stays on the grid.                                                                                                                                                                                                                                                                                               |
| Contact    | `<address>` at `.p-offset` (column 7, directly beneath the _Contact_ column at ≥ 1024): founder name and credentials, role, `tel:` and `mailto:` links, the location as four lines split from `BRAND.locale`. No form.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Legal line | Hairline, then `© <year> The New Practice`, the privacy and terms links (labels from the _Legal_ group in `nav.ts`) and, on the right, the client's own sentence _Every enquiry is handled with complete confidentiality._ read from `HOME` (closing section, second paragraph), never re-typed.                                                                                                                                                                                                                                                                                                                                                                                              |
| Lockup     | Centred, after everything: the mark alone at ~40px tall with the brass point, the wordmark in the display face at `--t-small` letterspaced with the ™ as a `<sup>` at `--t-eyebrow` (the one footer use of the trademark), the tagline in the eyebrow register.                                                                                                                                                                                                                                                                                                                                                                                                                               |

Every string comes from `brand.ts`, `nav.ts`, `UI_FOOTER` in `ui.ts` or `pages/home.ts`. Playwright coverage: `tests/e2e/footer.spec.ts` (landmarks, every link's `href`, `tel:`/`mailto:`, the marquee's `aria-hidden` contract, static under reduced motion, paused offscreen, axe scoped to the landmark).

### Route curtain

`app/template.tsx` → `<RouteCurtain>`. Covers, resets scroll, reveals. Reduced motion: fade. Preloader once per session, then the curtain owns every navigation.

### Scroll rail

Ported from the concept site: an 88px hairline in the right margin with a brass segment tracking page progress and the current section numeral (`data-n`) beside it. Hidden below 768px. Every template section that wants a numeral sets `data-n`.

---

## Templates

### T1 — Home (`/`)

**Job:** establish register in under two seconds, then make _one client at a time_ land as a moment.

| Part | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero | Full-viewport video (`muted playsinline loop preload="metadata"`, mp4 + webm, poster first, AVIF/WebP poster is the LCP). `<AmbientGradient>` behind at 0.35 opacity when eligible. Overlay title _A NEW APPROACH TO WELLBEING_ at `--t-d1` (`lines`), subtitle _From Kusnacht to Puerto Aventuras_ at the eyebrow register, _Scroll to discover_ cue with the looping vertical rule. A _Listen_ toggle (MUTE / UNMUTE, default off) that renders only when `pages/home.ts` has an `audioSrc`. Scrim per the concept hero. `<h1>` is the overlay title. |
| §1   | _Private Treatment Without Compromise_ — the ceiba ghosted at ~58vh behind _One Client. One Team. One Purpose._, the gold point between lines two and three; the four body paragraphs beneath at `.p-lead`. Ground bone.                                                                                                                                                                                                                                                                                                                                |
| §2   | _Recovery Without Interruption_ — long-read pair: headline `.p-lead`, body `.p-offset`. Bone.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| §3   | _Who We Help_ — the twelve conditions as a two-column hairline list with hover plate preview at ≥ 1024px. Sand.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| §4   | _Our Philosophy_ as sticky-index pillars; _Why The New Practice_ as the scrubbed manifesto. Canopy.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| §5   | _Begin the conversation_ — founder contact (name, credentials, role, phone, email) and a line action to `/contact`. Bone.                                                                                                                                                                                                                                                                                                                                                                                                                               |

Pins: §1 and §4 only. Character splits: the overlay title and one statement.

### T2 — Interior (`/about`, `/our-process`, `/a-personal-message`, `/fees`, `/privacy`, `/terms`)

**Job:** the editorial long-read. Reads like a monograph page.

Props: `eyebrow`, `headline`, `lead`, `sections[]` (subtitle, paragraphs, optional list, optional plate at 3:4 or 21:9), optional prev/next rail. Layout: eyebrow + headline + lead at `.p-lead`; body at `62ch`; pull-quotes in serif italic; sticky section index on ≥ 1024px when a page has ≥ 5 sections (Process, About); inline plates on sand bands; prev/next page rail at the foot.

Variants: `/our-process` renders _A Typical Day_ as the timeline rule; `/a-personal-message` is a letter — lead at `--t-lead`, signature block (founder name, credentials, role) from `brand.ts`; `/fees` is a single statement page; `/about` includes _Our Logo — The Ceiba_ with the mark at ~150px on sand, drawn once on entry.

### T3 — Treatment (`/clinical-services/[slug]` × 11)

**Job:** clinical credibility for one condition, without a brochure.

Hero statement + service numeral (`01`–`11`); intro paragraphs at `.p-lead`; _We provide treatment for_ as a hairline two-column list; _Treatment may include_ as a numbered index with `lines` reveals, definitions rendered **open** (no accordion); sub-sections with subtitles as they appear in the document; related services (the next three in order) as an index list; enquire CTA band on canopy. `generateStaticParams` from `services.ts`.

### T4 — Profile (`/team/[slug]` × 11)

**Job:** a person, presented with the same restraint as the place.

Portrait plate (3:4, duotoned; generated silhouette placeholder until portraits arrive) at `.p-plate`; name in the Didone at `--t-d2`; credentials after the name; role in the eyebrow register; biography at `.p-offset`, paragraphs as in the document; _Works alongside_ — three other members as an index list; back-to-team rail. Order as in the document.

### T5 — Residences (`/residences`)

**Job:** make the place feel real and unavailable to anyone else. Privacy-first: no map, no address.

Full-bleed 16:9 plate; the drifting plate carousel (six 3:4 plates); amenities as a hairline table; a privacy statement on canopy (the discretion band); enquire band. All copy is structural `PLACEHOLDER` from `pages/residences.ts` until the client supplies it (`docs/CONTENT-GAPS.md`).

### T6 — Index (`/clinical-services`, `/team`, `/self-assessment`)

**Job:** a list that reads as a composition.

Intro block (the collection's own intro copy — Services intro, Team §1, Assessment intro + disclaimer + how-to); numbered editorial list (`01 — Addiction Treatment`) with the single travelling glow; hover plate preview following the pointer at ≥ 1024px with `pointer: fine`; static thumbnails on touch; every row is a link. Filters only if a collection exceeds twelve items (none does).

### T7 — Enquiry (`/contact`)

**Job:** make contact feel like a private letter, not a lead form.

Split layout: the contact page's three sections and the founder contact on canopy; the form on bone. Fields: name, email, telephone (optional), enquiring for (self / family member / professional), message, preferred contact (email / telephone). Bottom-rule fields, brass underline on focus, `onBlur` validation with RHF + Zod, `role="alert"` per field. Server action re-validates with the same schema, checks a honeypot and a minimum-elapsed-time token, calls the mail adapter (Resend when configured, structured stdout log otherwise), returns a discriminated result, **persists nothing**. Confirmation revealed line by line.

### Interactive self-assessment (`/self-assessment/[slug]` × 10)

Fifteen yes/no questions as a hairline list with two line-action toggles per row (radio-group semantics); a live tally after the first answer; _See your result_ reveals the band (0–4 mild, 5–9 moderate, 10–15 severe) with the questionnaire's own interpretation text and a link to `/contact`; `aria-live` on the result; nothing stored, nothing sent. Scoring is a pure function, unit-tested.

---

## Reusable blocks — the concept site's section grammar

The concept site's ten sections were specified as a single narrative. Their specs survive here as **blocks**, each mapped to the templates that use it. Full choreography per block is in `docs/04` §6.

| Block                    | From           | Spec kept                                                                                                                                                                          | Used by                                                                                    |
| ------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Hero lockup**          | §00            | Full-bleed media, scrim (vertical gradient + radial pool), centred lockup — mark → wordmark → brass rule → tagline; meta lower-left; scroll cue bottom-centre. No CTA in the hero. | T1 (with the client's overlay title in place of the wordmark headline), preloader, OG card |
| **Statement**            | §01 Manifesto  | Three to four sentences at `--t-d1`, `.p-lead`, no image, no supporting element. The emptiness is the argument.                                                                    | T1 §4, `/fees`, `/a-personal-message` opening                                              |
| **One / ghosted mark**   | §02            | Mark at ~58vh at 0.16, `stroke-width 1.5`, three lines `.p-narrow`, one supporting line `--fg-muted`. No photograph.                                                               | T1 §1                                                                                      |
| **The ceiba**            | §03            | Sand ground; the mark ~150px with its Latin and Yucatec name; the story at `.p-offset`. Written about the tree, never the logo.                                                    | `/about` _Our Logo_                                                                        |
| **Plate carousel**       | §04 The house  | Drifting, two copies, captions `01 / 06` at the eyebrow, lead paragraph above at `.p-offset`.                                                                                      | T5                                                                                         |
| **Sticky-index pillars** | §05 The method | Left sticky list, right panels; numeral, title `--t-d3`, 40–60 words. No icons, no cards.                                                                                          | T1 §4, T2 sticky index                                                                     |
| **Timeline**             | §06 A day      | Time markers + one line each, scrubbed rule.                                                                                                                                       | `/our-process` _A Typical Day_                                                             |
| **Discretion band**      | §07            | Canopy, one statement `--t-d1`, one 21:9 plate `.p-wide`, three flat lines. Least animated.                                                                                        | T5 privacy statement                                                                       |
| **Hairline list**        | §08 The team   | Two-column rows, hairline-separated, glow on hover/focus.                                                                                                                          | T6 lists, T1 §3, T3 "we treat"                                                             |
| **Enquire**              | §09            | Invitation line, founder contact as line actions, bottom-rule fields, no consent theatre.                                                                                          | T7, enquire bands, T1 §5                                                                   |
| **Footer**               | —              | Marquee, contact, legal, the mark. No social icons.                                                                                                                                | Global                                                                                     |

---

## Component inventory

Foundation (ported, task 1): `Mark`, `Grain`, `GroundManager`, `Preloader`, `ScrollRail`, `Cursor`, `LineAction` / `LineActionButton`, `SectionHeader`, `Plate`, `Reveal`, `SmoothScroll`.

Chrome and primitives (tasks 3–10): `Header`, `NavOverlay`, `Footer`, `RouteCurtain`, `AudioToggle`, `StickyIndex`, `PlateHover`, `Field`, `AmbientGradient`, `MotionProvider`.

Templates (tasks 11–18b): the seven above plus the assessment scorer.

If the component count climbs far past twenty-five, something is being over-engineered. Prefer a prop on an existing primitive to a new file.
