# 06 — Copy Deck

> **Copy lives in `src/content/**` and is the client's text verbatim.** This document no longer holds strings; it holds the rules for the modules that do.

## Where the words are

| Module | Contents | Source in the client document |
| --- | --- | --- |
| `brand.ts` | Name, ™, tagline, location, founder, phone, email, mark story | Logo Concept PDF; home page founder block |
| `ui.ts` | Chrome strings that belong to no page: skip link, scroll cue | — (skip link ours; cue is the client's) |
| `nav.ts` | Primary, utility and footer navigation labels and routes | Derived from the page set |
| `pages/home.ts` | Hero title, subtitle, cue, voice-over script (for when audio exists), §1–§5 | Landing page |
| `pages/about.ts` | Four sections incl. *Our Logo — The Ceiba* | About |
| `pages/process.ts` | Eleven sections incl. *A Typical Day* | Our Process |
| `pages/personal-message.ts` | The letter | A Personal Message |
| `pages/fees.ts` | The fee statement (US$55,500 per week, all-inclusive — rendered as written) | Cost |
| `pages/contact.ts` | Three sections; contact values resolve to `brand.ts` | Contact |
| `pages/residences.ts` | Structural `PLACEHOLDER` copy | **None supplied** |
| `services.ts` | 11 entries: slug, title, intro, *treats* list, *may include* list or definitions, subtitled sub-sections | Clinical Services §1–§11 |
| `team.ts` | 11 entries: slug, name, credentials, role, paragraphs, order as in the document | Our Team §2 |
| `assessments.ts` | Intro, disclaimer, how-to, 10 questionnaires × 15 questions + per-questionnaire scoring text | Self-Assessment |
| `schemas.ts` | Zod schemas for every module; `content.test.ts` asserts counts (11 / 11 / 10 × 15) | — |

`scripts/ingest-content.mjs` (task 5) produces the modules from `Final Website Instructions_DRAFT Sept 1 2026 .docx.md`. It is re-runnable; hand edits to generated modules are lost, so corrections go into the script or into `docs/CONTENT-GAPS.md`.

## The rules

1. **Verbatim.** The client's wording is preserved exactly, including British spelling, their casing in titles (*A NEW APPROACH TO WELLBEING*), their punctuation and their paragraph breaks. Markdown emphasis is stripped; nothing else is.
2. **Nothing clinical is invented.** No claim, statistic, credential, accreditation, outcome or named individual that is not in the document. This is a regulated space.
3. **Structural copy we write is marked.** Where a template needs words the client did not supply (residences, legal stubs, form labels, confirmation lines, empty states, metadata descriptions), the module value is prefixed or flagged `PLACEHOLDER` where a reader could mistake it for the client's, and follows the voice rules in `docs/01`. Form labels and errors are ours and are not marked — they are interface, not content.
4. **Components never contain literals.** Not a heading, not a label, not an `aria-label`, not a `title`. Everything comes from a module. `alt` text for stock plates lives in `media.ts` / the page module, written in the brand voice.
5. **One source for contact details.** `brand.ts`. The contact page in the document left phone, email and website blank; the home page values are used everywhere (owner decision, ledger).
6. **Contradictions are resolved by the owner, recorded in `CONTENT-GAPS.md`, and rendered one way.** The self-assessment scoring is the known case: per-questionnaire scoring (1 point per *yes*, 0–15, bands 0–4 / 5–9 / 10–15) wins over the intro's 0–3 scale.
7. **The ™.** The client's page title carries it. It renders in the document `<title>`, the OG card and the footer legal line; not in the hero lockup or the header wordmark, where it would fight the letterspacing. Listed as a question for the client.
8. **No meta-commentary on screen.** No "demo", "staging", "placeholder", "coming soon" visible to a visitor. `PLACEHOLDER` is a marker in the module for us; the rendered structural copy reads as finished. Staging is protected by `noindex`, not by disclaimers.

## What the concept site's deck taught, kept

- The hero carries the client's lockup or the client's title — never both competing.
- The last line of a statement may drop out of the display face into the text face; target it by class, never by `:last-child` (SplitText restructures the subtree).
- Headlines break where designed at every breakpoint. Widows are a bug.
- The enquiry form has no privacy checkbox, marketing consent, "how did you hear about us", or budget selector.

## Copy QA checklist

Before any template ships:

- [ ] Every string on screen traces to a module in `src/content/**`
- [ ] Client copy diffed against the document: zero edits beyond emphasis stripping
- [ ] British spelling preserved; copy we wrote matches it
- [ ] Zero exclamation marks or emoji in copy we wrote
- [ ] No claim about outcomes, success rates or clinical efficacy that the client did not write
- [ ] No named individual beyond the eleven team members and the founder
- [ ] `PLACEHOLDER` copy present only where `CONTENT-GAPS.md` says content is missing
- [ ] No meta-commentary on screen
- [ ] Contact details on every page equal `brand.ts`
- [ ] Every headline breaks where designed — no widows at 390 / 768 / 1280 / 1920
- [ ] Metadata title and description read in the brand voice and carry no invented claim
