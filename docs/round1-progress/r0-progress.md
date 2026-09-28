# R0 — Foundation: progress notes (paused 2026-09-28)

Worktree `/home/kidus/projects/tnp-wt/r0-foundation`, branch `round1/r0-foundation`, pushed head **ed2f7cf**.
Setup is done: `npm ci` ran, and the Playwright chromium-headless-shell 1243 is installed in ~/.cache. The dev server (port 3401) is stopped.

## Done (ed2f7cf, wip commit)
Brief item 1, the title pages, CSS only:
- `src/sections/PageIntro.css`: `min-height: 100svh`, the flex column and the golden-section `padding-bottom` are gone. It now uses `main > section.page-intro { padding-block: var(--s-8) var(--s-6) }`, the eyebrow margin and lead margin are `--s-5`, and the grid row-gap is `--s-6`. I removed the Task 19 short-viewport media query (`max-height: 900px`) because it is redundant now.
- `src/templates/ProfileTemplate.css`: `.profile-intro` gets the same padding. The copy's padding-bottom is removed, and the eyebrow and lead margins are `--s-5`. The plate cap (50%, or 62% from 1024px) is unchanged.
- `src/templates/EnquiryTemplate.css`: `main > section.contact-open` loses its min-height and flex-end and gets the same padding.
- `src/app/sections.css`: new rule `main > :is(.page-intro, .profile-intro, .contact-open) + section, main > .page-intro + .interior__body > section:first-of-type { padding-top: var(--s-7) }`, so the title page and the first block sit `--s-8` apart at every width. It overrides `.content-section`'s restated rhythm by specificity.
- The Reveal variants are untouched: the h1 still uses `lines`, and the lead still uses `mask`. The home hero is untouched.

Measured with the scratch script `measure.mjs` (in this scratchpad; it runs `node measure.mjs` against :3401, and SIZES is an env var):
- At 1280×800 and 390×844, the next block's first text is inside the first viewport on every route except these four:
  - `/team/*` at 1280: next text at 830. The plate is 3:4 at 62% of 6 columns.
  - `/team/elena-vasquez-whitfield` at 390: next text at 880.
  - `/contact` at 1280 and 390: next text at 929 and 954. The lead and two opening paragraphs are long, and R4d will curate them.
- The h1 top is at 219 everywhere, with the header bottom at 75.

## Remaining
1. The title pages:
   - Decide on the profile. One option is to cap the plate lower (e.g. `max-width: 50%` from 1024px), or accept it and log it. The contact page depends on R4d's curation, so note it as a finding.
   - Read the screenshots (390/768/1280/1920 and reduced motion) for the first viewport of each template: interior (about, our-process, a-personal-message, fees), index (clinical-services, team, self-assessment), treatment, profile, residences, contact, assessment (alcohol).
   - Judge the asymmetric sand band where sand directly follows the title page (clinical-services and team): 104 top against 264 bottom.
   - Update the specs that assumed a full-viewport title page. The `viewports.spec.ts` comment says "The title page sits low in the frame" (line ~39); the assertion should still pass. Grep the specs for other assumptions and run the e2e specs listed in the brief.
2. The curation layer (not started). The plan is to create `src/content/curated/` with a helper, e.g. `pick(section, { paragraphs: [0, 2], list: [1, 3] })` plus `ours('summary text')` or a `SUMMARIES` module. It must pick by section id and index from the generated modules without editing them.
   - Add checks in `content.checks.ts`, applied to our strings: no em/en dash (the `PLACEHOLDER — ` prefix is excepted), no `!`, none of the docs/01 forbidden words (journey, transformative, bespoke, luxury, unparalleled, world-class, cutting-edge, oasis, sanctuary, elevate, curated, paradise, escape), trimmed.
   - A reference to a missing client paragraph or section fails the check.
   - Write unit tests for the helper. Do not curate any page (proof on nothing user-visible).
   - `content.checks.ts` already has the `MODULES` walker and the `DASHES` regex to reuse.
3. Rules and docs:
   - CLAUDE.md §1, §3 and §5: change "verbatim" to "curated client text plus our summaries, no dashes, no invented claims".
   - docs/01 Voice section, and docs/06 rules 1 and 3 plus the QA checklist.
   - docs/02: people are allowed in pictures (calm, adult, candid, no posed stock smiles). Also CLAUDE.md §3's "no faces" row.
   - docs/03 §3: the title-page padding exception and the step after a title page.
   - docs/05: the `PageIntro` row ("A full-viewport title page"), the T4 title-page row (`min-height: 100svh`), and the T7 layout ("min-height: 100svh", "The opening band is a full viewport so the transparent header only ever sits on canopy").
   - CLAUDE.md §6a: add a row for each override (the copy rule, people in images, short title pages, removal of the Task 19 short-viewport step).
   - Do not edit docs/BUILD-LEDGER.md.
4. Verify:
   - `npm run verify`.
   - `E2E_BASE_URL=http://localhost:3401 npm run e2e:route -- "about|interior-pages|treatment|profile|index|residences|contact|assessment|viewports"`. Check the grep syntax, because e2e:route is `playwright test --grep`, so pass the spec titles as a regex.
   - Commit in small steps and push after each.

## Gotchas
- This machine runs Node 24, and Playwright 1.63 needed browser build 1243. It is installed now.
- The header is fixed and about 75px tall. The title-page top padding is `--s-8` (168), which clears it with room to spare.
- `.content-section` restates the rhythm because the interior body sections are wrapped in `div.interior__body`. The sticky index is a `div` before the first section, which is why the rule uses `:first-of-type`.
- The residences full-bleed plate wrapper has no rhythm (`padding-block: 0`). The title page's `--s-6` bottom padding is its only gap.
- GateGuard wants a one-line statement before Bash calls.
