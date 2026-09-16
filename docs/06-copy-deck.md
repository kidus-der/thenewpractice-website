# 06 — Copy Deck

> **Copy lives in `src/content/**` and is the client's text verbatim.** This document holds no strings. It describes the content layer: which module holds what, the schema rules, the verbatim rule, how to regenerate, and where placeholders are allowed. Gaps and judgements are in `docs/CONTENT-GAPS.md`.

## Module map

| Module                                 | Exports                                                                                                                                                                                                                                                                                  | Source in the client document                                                                          | Origin                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `brand.ts`                             | `BRAND`                                                                                                                                                                                                                                                                                  | Logo Concept PDF; home founder block (l.103–110)                                                       | Hand-written (Task 1)                     |
| `ui.ts`                                | `UI` (skip link, scroll cue), `UI_FOOTER`, `UI_INTERIOR`, `UI_INDEX`, `UI_TREATMENT`, `UI_PROFILE`, `UI_RESIDENCES`, `UI_STAGING`, `UI_HOME`, `UI_ASSESSMENT` — the chrome and template interface strings (landmark names, rail labels, the review flag, the scorer's tally and actions) | Scroll cue (l.18); everything else is ours (docs/01 voice)                                             | Hand-written (Tasks 1, 8, 11–18b)         |
| `enquiry.ts`                           | `ENQUIRY`, `ENQUIRING_FOR`, `PREFERRED_CONTACT`, `ENQUIRY_LIMITS` — the form's labels, options, errors, confirmation and failure line                                                                                                                                                    | Ours (docs/01 voice)                                                                                   | Hand-written (Task 15)                    |
| `seo.ts`                               | `SEO_DEFAULTS`, `ADDRESS`, `ROUTE_SEO`, `serviceSeo`, `teamSeo`, `assessmentSeo`, `excerpt` — titles, descriptions and the postal address for metadata and structured data                                                                                                               | Descriptions from the client's own opening sentences where they exist; the rest ours (CONTENT-GAPS G7) | Hand-written (Task 10)                    |
| `nav.ts`                               | `NAV`, `routes`, `serviceHref`, `teamHref`, `assessmentHref`                                                                                                                                                                                                                             | Derived from the page set                                                                              | Hand-written                              |
| `schemas.ts`                           | Zod schemas and inferred types                                                                                                                                                                                                                                                           | —                                                                                                      | Hand-written                              |
| `index.ts`                             | Everything above and below, plus `allRoutes()` for the sitemap                                                                                                                                                                                                                           | —                                                                                                      | Hand-written                              |
| `pages/home.ts`                        | `HOME` (`hero`, five sections, `contact`)                                                                                                                                                                                                                                                | Landing page (l.1–111)                                                                                 | Generated                                 |
| `pages/about.ts`                       | `ABOUT` (logo section + four numbered sections)                                                                                                                                                                                                                                          | About (l.112–247)                                                                                      | Generated                                 |
| `pages/process.ts`                     | `PROCESS` (intro + eleven sections, `lead`)                                                                                                                                                                                                                                              | Our Process (l.248–399)                                                                                | Generated                                 |
| `pages/personal-message.ts`            | `PERSONAL_MESSAGE` (letter + `signature`)                                                                                                                                                                                                                                                | A Personal Message (l.1251–1281)                                                                       | Generated                                 |
| `pages/fees.ts`                        | `FEES` (one statement, rendered as written)                                                                                                                                                                                                                                              | Cost (l.1283–1285)                                                                                     | Generated                                 |
| `pages/contact.ts`                     | `CONTACT` (intro + three sections, `lead`, `contact`)                                                                                                                                                                                                                                    | Contact (l.1197–1250)                                                                                  | Generated                                 |
| `pages/residences.ts`                  | `RESIDENCES`                                                                                                                                                                                                                                                                             | **None supplied**                                                                                      | Hand-written, all `PLACEHOLDER`           |
| `pages/legal.ts`                       | `PRIVACY`, `TERMS` (four headings each, one pending sentence)                                                                                                                                                                                                                            | **None supplied** (CONTENT-GAPS G3)                                                                    | Hand-written, all `PLACEHOLDER` (Task 18) |
| `services.ts`                          | `SERVICES_PAGE` (index intro), `SERVICES` (11)                                                                                                                                                                                                                                           | Clinical Services (l.400–718)                                                                          | Generated                                 |
| `team.ts`                              | `TEAM_PAGE` (intro + _One Client. One Team._), `TEAM` (11, document order)                                                                                                                                                                                                               | Our Team (l.719–949)                                                                                   | Generated                                 |
| `assessments.ts`                       | `ASSESSMENTS_PAGE` (intro, disclaimer, how-to, available, consultation), `ASSESSMENT_SERIES` (shared scoring strings, superseded scale), `ASSESSMENTS` (10 × 15)                                                                                                                         | Self-Assessment (l.950–1196)                                                                           | Generated                                 |
| `content.checks.ts`, `content.test.ts` | The invariants below, for Vitest and for `scripts/check-content.ts`                                                                                                                                                                                                                      | —                                                                                                      | Hand-written                              |

Every generated file opens with `// GENERATED by scripts/ingest-content.mjs from the client document — edit the source or the script, not this file.` and a `// Source:` line range.

## Schema rules

All shapes are in `schemas.ts`; every module calls `schema.parse(...)` at import, so a bad edit fails the build rather than reaching a template.

- **`text`** — every user-facing string: non-empty, trimmed, no `*`, no backslash, no tab, no zero-width or non-breaking character.
- **`pageSchema`** — `slug`, `title`, `eyebrow?`, `lead?`, `sections[]`. Page titles are ours; the client's headings are section titles.
- **`sectionSchema`** — `id`, `title?`, `subtitle?`, `header?`, `paragraphs`, `listHeading?`, `list?`, `outro?`, `definitions?`, `signature?`, `subsections?`. **Render order is fixed by the document:** paragraphs → listHeading → list → outro → definitions → subsections. `header` exists for the single `Header:` line in the document (About §1). `outro` is the prose that follows a list. `definitions` are term + description pairs (philosophy pillars, principles, trauma modalities).
- **`serviceSchema`** — `slug`, `order`, `title`, `intro`, `treatsHeading?`/`treats?`, `mayIncludeHeading?`/`mayInclude?`, `outro?`, `definitions?`, `subsections?`. Where a service has both lists (Addiction Treatment only) the document places _may include_ before _treats_; render it that way.
- **`teamMemberSchema`** — `slug`, `order`, `name`, `credentials?`, `role`, `paragraphs`. Names keep their honorific ("Dr."); slugs drop it and diacritics.
- **`assessmentSchema`** — `slug`, `order`, `title`, `questions` (exactly 15), `scoring` (`perYes: 1`, `max: 15`, three `bands` with keys `mild`/`moderate`/`severe`, the document's labels, and inclusive `min`/`max`), `interpretation`. This is the owner's resolution of the scoring contradiction; the intro's 0–3 scale survives only as `ASSESSMENT_SERIES.supersededScale` and must not render.
- **Page extensions** — `homePageSchema` adds `hero` (`title`, `subtitle`, `cue`, `audioScript`, `audioSrc: string | null`, `videoBrief`) and `contact`; `contactPageSchema` adds `contact` with `organisation` and `website`; `letterPageSchema` adds `signature`; `residencesPageSchema` adds six `plates` and `amenities`.
- **`navSchema`** — `primary`, `utility`, `footer[]` of `{ heading, items }`; every `href` must resolve to a route in `routes` or a collection href.

Contact values are never literals in a generated module: `HOME.contact` and `CONTACT.contact` reference `BRAND`, and the hero cue references `UI.scrollCue`. The generator asserts that the document still agrees with those values and fails if it does not.

## The rules

1. **Verbatim.** The client's wording is preserved exactly: British and North American spellings as they wrote them, their casing in section titles (_ABOUT THE NEW PRACTICE_), their punctuation, their paragraph breaks, their typographic quotes and dashes. Only markdown is removed: emphasis markers, pandoc escapes (`\-`, `\.`, `\+`, `\_`), link syntax, hard-break trailing spaces, and word-processor residue (zero-width characters, non-breaking spaces). Wrapped lines are rejoined only when a line stops mid-sentence. Six random paragraphs were diffed byte-for-byte against the source at ingestion; `content.checks.ts` keeps the residue rules enforced.
2. **Nothing clinical is invented.** No claim, statistic, credential, accreditation, outcome or named individual that is not in the document. Where the document is silent (nine assessment interpretations) the module carries the client's generic sentence, not ours.
3. **Structural copy we write is marked.** `PLACEHOLDER` is permitted in exactly three places, and `content.checks.ts` fails otherwise: `pages/residences.ts` and `pages/legal.ts` (every string prefixed `PLACEHOLDER — `) and `CONTACT.contact.website`. Form labels, errors and confirmation lines are interface, not content; they are ours and unmarked (Task 15).
4. **Components never contain literals.** Not a heading, a label, an `aria-label` or a `title`. Everything comes from a module; `alt` text for stock plates lives in `media.ts` or the page module.
5. **One source for contact details.** `brand.ts`. The contact page's blank fields resolve to it (owner decision, ledger).
6. **Contradictions are resolved by the owner, recorded in `CONTENT-GAPS.md`, and rendered one way.** Assessment scoring is the known case.
7. **The ™.** `BRAND.trademark` is separate from the name. Main-session rule: at most once per page, in the home hero wordmark and the footer lockup, never in the header or running text. Two client strings carry ™ verbatim (`ASSESSMENT_SERIES.seriesTitle`, one team biography); see `CONTENT-GAPS.md` §3.
8. **No meta-commentary on screen.** `PLACEHOLDER` is a marker for us; rendered structural copy reads as finished. Staging is protected by `noindex`, not by disclaimers.

## Regenerating

```
node scripts/ingest-content.mjs                          # rewrites the generated modules; prints created / updated / unchanged
node --experimental-strip-types scripts/check-content.ts # the content invariants, without Vitest
npm test                                                 # the same invariants under Vitest, once Task 4 lands
```

The generator is deterministic and idempotent, writes only files whose content changed, and emits Prettier-conformant source so `npm run format` is a no-op on it. It has no dependencies beyond Node built-ins and reads `brand.ts` and `ui.ts` directly (Node's type stripping) to assert agreement with the document.

Where the knowledge lives:

| File                                | Holds                                                                                                                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/ingest-content.config.mjs` | Everything the parser cannot infer: page identities and titles, which section's first paragraph becomes the page lead, signature line counts, expected slugs, the _may include_ heading pattern, which subsection is `Name: description` definitions, questionnaire slugs, join thresholds. |
| `scripts/ingest-content.parse.mjs`  | Line normalisation, markdown stripping, tokenisation, paragraph rules.                                                                                                                                                                                                                      |
| `scripts/ingest-content.emit.mjs`   | The TypeScript writer.                                                                                                                                                                                                                                                                      |
| `scripts/ingest-content.mjs`        | Page, service, team and assessment assembly; the targeted extractions (home hero, two founder blocks, assessment how-to scale, questionnaire block).                                                                                                                                        |

Corrections to the client's text go into the source document, then regenerate. Corrections to structure go into the config or the script. Hand edits to generated files are lost on the next run, by design.

## Invariants (`content.checks.ts`)

Every module parses against its schema; 11 services and 11 team members in document order; 10 assessments × 15 questions; no string carries markdown residue; no string starts or ends with whitespace; every nav `href` resolves; `PLACEHOLDER` only in the three permitted places; every residences string is prefixed; `allRoutes()` has no duplicates.

## What the concept site's deck taught, kept

- The hero carries the client's lockup or the client's title, never both competing.
- The last line of a statement may drop out of the display face into the text face; target it by class, never by `:last-child` (SplitText restructures the subtree).
- Headlines break where designed at every breakpoint. Widows are a bug.
- The enquiry form has no privacy checkbox, marketing consent, "how did you hear about us", or budget selector.

## Copy QA checklist

Before any template ships:

- [ ] Every string on screen traces to a module in `src/content/**`
- [ ] Client copy diffed against the document: zero edits beyond markdown stripping
- [ ] Spelling as the client wrote it; copy we wrote is British
- [ ] Zero exclamation marks or emoji in copy we wrote
- [ ] No claim about outcomes, success rates or clinical efficacy that the client did not write
- [ ] No named individual beyond the eleven team members and the founder
- [ ] `PLACEHOLDER` copy present only where `CONTENT-GAPS.md` says content is missing
- [ ] No meta-commentary on screen
- [ ] Contact details on every page equal `brand.ts`
- [ ] Sections render in schema order: paragraphs, list heading, list, outro, definitions, subsections
- [ ] Every headline breaks where designed at 390 / 768 / 1280 / 1920
- [ ] Metadata title and description read in the brand voice and carry no invented claim
