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

Navigation: primary — About, Our Process, Clinical Services, Team, Residences, Self-Assessment; utility — Contact / *Enquire*; footer groups from `nav.ts`.

---

## Global chrome

### Header

Fixed, `--z-nav`. Left: ceiba mark (16px) + wordmark in the display face, letterspaced — links home. Right, ≥ 1024px: the six primary links as line actions plus *Enquire*; below 1024px: a single *Menu* line action. Transparent over the first viewport; settles past 90vh (ground pickup at 88%, hairline, blur); hides on scroll-down past 200vh and returns on scroll-up. Recolours from `--ground-fg`. Active route carries the brass rule.

### Nav overlay

Full-viewport canopy panel at `--z-overlay`, beneath the texture. Nav items at `--t-d1` in the Didone, staggered `lines`; the ceiba drawing itself in a corner; secondary links (Contact, Fees, A Personal Message, legal) and the founder contact in the eyebrow register. Motion `AnimatePresence` with a clip-path wipe. Focus trap, `Escape` closes, closes on route change, `aria-expanded` / `aria-controls` on the trigger, `inert` on the page behind, body scroll locked via `stopScroll()`.

### Footer

Server component, `data-ground="dark"`. Wordmark marquee (the one permitted); four hairline sitemap columns from `nav.ts`; founder contact block (name, credentials, role, phone, email — from `brand.ts`); location; legal links; the mark alone at the very bottom.

### Route curtain

`app/template.tsx` → `<RouteCurtain>`. Covers, resets scroll, reveals. Reduced motion: fade. Preloader once per session, then the curtain owns every navigation.

### Scroll rail

Ported from the concept site: an 88px hairline in the right margin with a brass segment tracking page progress and the current section numeral (`data-n`) beside it. Hidden below 768px. Every template section that wants a numeral sets `data-n`.

---

## Templates

### T1 — Home (`/`)

**Job:** establish register in under two seconds, then make *one client at a time* land as a moment.

| Part | Spec |
| --- | --- |
| Hero | Full-viewport video (`muted playsinline loop preload="metadata"`, mp4 + webm, poster first, AVIF/WebP poster is the LCP). `<AmbientGradient>` behind at 0.35 opacity when eligible. Overlay title *A NEW APPROACH TO WELLBEING* at `--t-d1` (`lines`), subtitle *From Kusnacht to Puerto Aventuras* at the eyebrow register, *Scroll to discover* cue with the looping vertical rule. A *Listen* toggle (MUTE / UNMUTE, default off) that renders only when `pages/home.ts` has an `audioSrc`. Scrim per the concept hero. `<h1>` is the overlay title. |
| §1 | *Private Treatment Without Compromise* — the ceiba ghosted at ~58vh behind *One Client. One Team. One Purpose.*, the gold point between lines two and three; the four body paragraphs beneath at `.p-lead`. Ground bone. |
| §2 | *Recovery Without Interruption* — long-read pair: headline `.p-lead`, body `.p-offset`. Bone. |
| §3 | *Who We Help* — the twelve conditions as a two-column hairline list with hover plate preview at ≥ 1024px. Sand. |
| §4 | *Our Philosophy* as sticky-index pillars; *Why The New Practice* as the scrubbed manifesto. Canopy. |
| §5 | *Begin the conversation* — founder contact (name, credentials, role, phone, email) and a line action to `/contact`. Bone. |

Pins: §1 and §4 only. Character splits: the overlay title and one statement.

### T2 — Interior (`/about`, `/our-process`, `/a-personal-message`, `/fees`, `/privacy`, `/terms`)

**Job:** the editorial long-read. Reads like a monograph page.

Props: `eyebrow`, `headline`, `lead`, `sections[]` (subtitle, paragraphs, optional list, optional plate at 3:4 or 21:9), optional prev/next rail. Layout: eyebrow + headline + lead at `.p-lead`; body at `62ch`; pull-quotes in serif italic; sticky section index on ≥ 1024px when a page has ≥ 5 sections (Process, About); inline plates on sand bands; prev/next page rail at the foot.

Variants: `/our-process` renders *A Typical Day* as the timeline rule; `/a-personal-message` is a letter — lead at `--t-lead`, signature block (founder name, credentials, role) from `brand.ts`; `/fees` is a single statement page; `/about` includes *Our Logo — The Ceiba* with the mark at ~150px on sand, drawn once on entry.

### T3 — Treatment (`/clinical-services/[slug]` × 11)

**Job:** clinical credibility for one condition, without a brochure.

Hero statement + service numeral (`01`–`11`); intro paragraphs at `.p-lead`; *We provide treatment for* as a hairline two-column list; *Treatment may include* as a numbered index with `lines` reveals, definitions rendered **open** (no accordion); sub-sections with subtitles as they appear in the document; related services (the next three in order) as an index list; enquire CTA band on canopy. `generateStaticParams` from `services.ts`.

### T4 — Profile (`/team/[slug]` × 11)

**Job:** a person, presented with the same restraint as the place.

Portrait plate (3:4, duotoned; generated silhouette placeholder until portraits arrive) at `.p-plate`; name in the Didone at `--t-d2`; credentials after the name; role in the eyebrow register; biography at `.p-offset`, paragraphs as in the document; *Works alongside* — three other members as an index list; back-to-team rail. Order as in the document.

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

Fifteen yes/no questions as a hairline list with two line-action toggles per row (radio-group semantics); a live tally after the first answer; *See your result* reveals the band (0–4 mild, 5–9 moderate, 10–15 severe) with the questionnaire's own interpretation text and a link to `/contact`; `aria-live` on the result; nothing stored, nothing sent. Scoring is a pure function, unit-tested.

---

## Reusable blocks — the concept site's section grammar

The concept site's ten sections were specified as a single narrative. Their specs survive here as **blocks**, each mapped to the templates that use it. Full choreography per block is in `docs/04` §6.

| Block | From | Spec kept | Used by |
| --- | --- | --- | --- |
| **Hero lockup** | §00 | Full-bleed media, scrim (vertical gradient + radial pool), centred lockup — mark → wordmark → brass rule → tagline; meta lower-left; scroll cue bottom-centre. No CTA in the hero. | T1 (with the client's overlay title in place of the wordmark headline), preloader, OG card |
| **Statement** | §01 Manifesto | Three to four sentences at `--t-d1`, `.p-lead`, no image, no supporting element. The emptiness is the argument. | T1 §4, `/fees`, `/a-personal-message` opening |
| **One / ghosted mark** | §02 | Mark at ~58vh at 0.16, `stroke-width 1.5`, three lines `.p-narrow`, one supporting line `--fg-muted`. No photograph. | T1 §1 |
| **The ceiba** | §03 | Sand ground; the mark ~150px with its Latin and Yucatec name; the story at `.p-offset`. Written about the tree, never the logo. | `/about` *Our Logo* |
| **Plate carousel** | §04 The house | Drifting, two copies, captions `01 / 06` at the eyebrow, lead paragraph above at `.p-offset`. | T5 |
| **Sticky-index pillars** | §05 The method | Left sticky list, right panels; numeral, title `--t-d3`, 40–60 words. No icons, no cards. | T1 §4, T2 sticky index |
| **Timeline** | §06 A day | Time markers + one line each, scrubbed rule. | `/our-process` *A Typical Day* |
| **Discretion band** | §07 | Canopy, one statement `--t-d1`, one 21:9 plate `.p-wide`, three flat lines. Least animated. | T5 privacy statement |
| **Hairline list** | §08 The team | Two-column rows, hairline-separated, glow on hover/focus. | T6 lists, T1 §3, T3 "we treat" |
| **Enquire** | §09 | Invitation line, founder contact as line actions, bottom-rule fields, no consent theatre. | T7, enquire bands, T1 §5 |
| **Footer** | — | Marquee, contact, legal, the mark. No social icons. | Global |

---

## Component inventory

Foundation (ported, task 1): `Mark`, `Grain`, `GroundManager`, `Preloader`, `ScrollRail`, `Cursor`, `LineAction` / `LineActionButton`, `SectionHeader`, `Plate`, `Reveal`, `SmoothScroll`.

Chrome and primitives (tasks 3–10): `Header`, `NavOverlay`, `Footer`, `RouteCurtain`, `AudioToggle`, `StickyIndex`, `PlateHover`, `Field`, `AmbientGradient`, `MotionProvider`.

Templates (tasks 11–18b): the seven above plus the assessment scorer.

If the component count climbs far past twenty-five, something is being over-engineered. Prefer a prop on an existing primitive to a new file.
