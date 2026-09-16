# Handoff — The New Practice production website

> Paste-able context for a new session, human or agent. For _how to build_, read
> [`CLAUDE.md`](./CLAUDE.md) and [`docs/`](./docs). For _what was built, in what
> order, and what was found_, read [`docs/BUILD-LEDGER.md`](./docs/BUILD-LEDGER.md).
> This file is _where things stand_.
>
> Last updated at the deploy that closed the two-week template milestone (Task 21).

---

## In one paragraph

This is the production site for **The New Practice**, a private behavioural health
practice in Puerto Aventuras on Mexico's Riviera Maya that treats one client at a
time. The contract's first milestone is the seven templates the whole site is built
from — home, interior, treatment, profile, residences, index, enquiry — plus the
global chrome (header, desktop and mobile navigation, footer, route transitions),
populated with the client's own content document and deployed to a staging URL for
their review. That milestone is delivered: every template is live on staging with
the client's copy where it exists and marked placeholders where it does not, the
enquiry form works end to end (logging, not mailing, until the client's mail
account exists), the ten self-assessments score in the browser, and the whole site
passes its own gates (`npm run verify`; the Playwright suite on five browser
projects; axe at serious; reduced motion; keyboard). Approval is against the design
direction, not final content. The concept site that won the work is a separate
repository and deployment (`thenewpractice-demo`) and is untouched.

## Live

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URL**         | https://thenewpractice-staging.kidusder.com (also answers on `thenewpractice-staging.vercel.app`, same headers)                                                                                                                                                                                                                                                                                                  |
| **Host**        | Vercel, project `thenewpractice-staging` (`prj_u6aBqX42pJiMJFH41FDW1eEK1kKv`), scope `kidus-projects-8964b022`, Node 24, framework preset Next.js                                                                                                                                                                                                                                                                |
| **Domain**      | Subdomain of `kidusder.com`, registered through Vercel with Vercel nameservers; the existing wildcard ALIAS routes it, so no DNS record was added. The hostname is claimed on the project and the edge routes by `Host`.                                                                                                                                                                                         |
| **Indexing**    | `noindex, nofollow` on every response, `robots.txt` disallows all, `sitemap.xml` is empty. All three follow the `SITE_ENV=staging` environment variable on the Vercel production target (`src/lib/env.ts`); nothing in code names the staging host. **Load-bearing:** the pages carry no on-screen disclaimer, so this is the only thing stopping the review URL being found and mistaken for the live practice. |
| **Protection**  | None. Vercel Hobby cannot password-protect. Anyone with the link can open it.                                                                                                                                                                                                                                                                                                                                    |
| **Auto-deploy** | **Connected.** `vercel link` attached the GitHub repository `kidus-der/thenewpractice-website` to the project, so a push to `main` builds and deploys to the staging URL (ledger, Task 6). This differs from the concept site. To turn it off: `npx vercel git disconnect --scope kidus-projects-8964b022`.                                                                                                      |
| **CLI deploy**  | From a clean checkout of `main` in the linked directory: `npx vercel deploy --prod --yes --scope kidus-projects-8964b022`. Deploys upload the working tree, not a commit, so the tree must be clean.                                                                                                                                                                                                             |
| **Environment** | Production target: `SITE_ENV=staging`, `NEXT_PUBLIC_SITE_URL=https://thenewpractice-staging.kidusder.com`. No mail variables, so the enquiry form logs. The preview target has no variables at all (a plain `npx vercel deploy` builds as `development` with a localhost `metadataBase`); set the same two before using previews for review.                                                                     |
| **Last deploy** | See the _Deploys_ table in `docs/BUILD-LEDGER.md` for the deployment id and the live-check evidence.                                                                                                                                                                                                                                                                                                             |

## What the client's is and what is ours

This distinction matters for every conversation about the work.

**Theirs**, from `design/brand/The New Practice - Logo Concept.pdf` and
`Final Website Instructions_DRAFT Sept 1 2026 .docx.md` (both in the repository):

- The name, the ™, the tagline _Private treatment without compromise_
- The **ceiba mark** — Maya world tree, three branches, three roots, six strokes
  meeting at one point, one gold point marking it. Geometry lifted from the PDF's
  vector (`src/components/Mark.tsx`). The point is the only accent in the identity.
- The palette (canopy, bone, brass) and the type direction (high-contrast Didone
  plus a plain geometric sans)
- **Every word of prose on the site.** Every page, service, biography and
  questionnaire is rendered verbatim from the content document through typed
  modules under `src/content/**`, British spelling and all. A build-time check
  (`content.checks.ts`) fails `npm run verify` if a metadata description is neither
  a sentence of the document nor a marked placeholder. Where the document has no
  content (residences, privacy, terms) the module carries structural copy prefixed
  `PLACEHOLDER — ` and the page is unlinked and `noindex` on production.
- The contact details — founder, telephone, email, location — from one source,
  `src/content/brand.ts`, matching the document's home page.

**Ours:**

- The architecture, the seven templates, the motion, the tests, the search surface
- **Every photograph and the hero loop.** Licence-free stock from Pexels, graded
  into one look; each file, its source URL, author, licence and what it stands in
  for is in [`design/ASSETS.md`](./design/ASSETS.md). None of it was shot for the
  practice. Team pages show a generated placeholder frame, not a portrait.
- The interface copy: navigation labels, form labels and errors, the confirmation's
  first and third lines, the _Copy pending client review_ flag, the scroll cue.
  Listed and accepted in `docs/CONTENT-PROVENANCE-AUDIT.md` §8.
- The fonts as stand-ins: Bodoni Moda and Jost for the Didone and geometric-sans
  pairing their identity specifies. One swap point in `src/app/layout.tsx`.

**Framing rule:** we set their identity and their words in a house built for them.
We did not design their brand and we did not write their copy.

## The seven templates

| Template      | Route(s)                                                                           | What to look at                                                                                                                                                | The moment                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| T1 Home       | `/`                                                                                | Poster-first video hero with the lockup; the twelve conditions with the pointer-following plate; the five pillars on a sticky index; the founder block         | §1 **One**: the ceiba draws from its centre behind _One Client. / One Team. / One Purpose._ and the gold point lands between the lines |
| T2 Interior   | `/about`, `/our-process`, `/a-personal-message`, `/fees` (and the two legal stubs) | The title page; the reading column at 62ch; the sticky section index on the long pages; the ceiba figure on About; the day timeline on Our Process             | Our Process: the brass rule climbs the day with the reading line and lights each paragraph as it is reached                            |
| T3 Treatment  | `/clinical-services/[slug]` × 11, e.g. `/clinical-services/addiction-treatment`    | The service's own numeral on the title page; the hairline lists; the definitions rendered open; _Other services_; the enquire band                             | The _Treatment may include_ index arriving row by row under its masks                                                                  |
| T4 Profile    | `/team/[slug]` × 11, e.g. `/team/lowell-monkhouse`                                 | The portrait placeholder (sand frame, one hairline, the gold point); the name in the Didone; the biography; _Also on the team_; the rail back to Team          | The name arriving line by line beside an empty frame that is waiting for a photograph                                                  |
| T5 Residences | `/residences` (staging only; unlinked on production)                               | The full-bleed plate; the drifting carousel that slows under the pointer and pauses offscreen; the amenities table; the discretion statement                   | The carousel: six frames drifting without a seam, native scroll-snap under reduced motion                                              |
| T6 Index      | `/clinical-services`, `/team`, `/self-assessment`                                  | The numbered list at the standing placement; the single travelling glow; the hover plate on desktop, static thumbnails on touch                                | The glow moving from row to row as the pointer or the focus ring does                                                                  |
| T7 Enquiry    | `/contact`                                                                         | The letter on canopy, the form on the bone sheet; blur validation; the radios drawn as line actions; the founder block; the confirmation revealed line by line | The rows fading out in sequence and _Thank you._ arriving in their place                                                               |
| T2 variant    | `/self-assessment/[slug]` × 10, e.g. `/self-assessment/alcohol`                    | Fifteen yes/no questions as a printed form; the score and band announced; nothing sent anywhere                                                                | The result panel reading the client's own scoring line back                                                                            |
| Chrome        | every route                                                                        | Header settle and recolour over every ground; the full-viewport menu; the footer marquee; the route curtain with the mark drawing outward                      | The curtain: a canopy wipe with the ceiba growing from its point, then the next page                                                   |

## Review-call walkthrough

In this order. It shows the work best and surfaces the gaps early rather than late.

1. **Open `/` on the laptop and say nothing for ten seconds.** The preloader plays
   once, the poster is complete at first paint, the loop fades in over it, the
   ambient gradient breathes behind the media on desktop. Scroll to the **One**
   moment and let the pin run. This is the pitch.
2. **Keep scrolling the home page**: the long read and its pull line, the twelve
   conditions with the plate following the pointer, the pillars on the sticky index,
   the manifesto scrubbing line by line, the founder block at the foot.
3. **Open the menu** (the _Menu_ line action on a narrow window; the primary links on
   a wide one) and go to **Clinical Services**. Watch the route curtain. On the index,
   move the pointer down the list: the glow, the plate.
4. **Open a service** — Addiction Treatment has every block the template has. Point
   out that every word is theirs and that the numerals are the document's own order.
5. **Go to Team and open Lowell's profile.** Say out loud that the frame is waiting
   for a portrait; show how the template will take one without changing.
6. **Open `/our-process`** and scroll the day: the timeline rule. Then `/about` for
   the ceiba figure and the founder's message.
7. **Open `/contact` and complete the form on staging**, with the client watching.
   Blur a field empty to show the error; submit. The confirmation renders and the
   rows leave in sequence. Say that on staging nothing is mailed: the server logs one
   structured line without the message text, and nothing is stored anywhere. Mail
   starts when their Resend account exists (see _Before production_).
8. **Open a questionnaire** (`/self-assessment/alcohol`), answer it, read the result.
   Then open a second one and show that nine of the ten carry the same generic
   interpretation sentence — that is theirs to write (gap G6).
9. **Open `/residences`.** Every sentence is a marked placeholder restating a line of
   their document; there is no photography of the property. On production the page
   is unlinked until they supply both.
10. **Turn on reduced motion** (macOS: System Settings → Accessibility → Display →
    Reduce motion) and reload `/`. The site is a second finished design: no video, no
    pins, no gradient, a fade for the curtain, everything visible.
11. **Open the site on a phone** — the client's own, in Safari. The hero, the menu
    overlay, a service page, the form. iOS Low Power Mode leaves the poster in place
    of the loop by design.
12. **Close on the decisions** listed below, in order.

## Known gaps — say these out loud, do not let them be discovered

The authoritative list, with line references into the document, is
[`docs/CONTENT-GAPS.md`](./docs/CONTENT-GAPS.md). In brief:

1. **Residences has no copy and no photography** (G1). Every string on `/residences`
   is `PLACEHOLDER — ` prefixed and restates a cited line of the document; the
   plates are stock. The page is `noindex`, out of the sitemap and, on production,
   unlinked from the header, the footer and the previous/next rail.
2. **No portraits** (G4). All eleven team pages show the generated placeholder frame.
   A portrait per member is one media key and one prop.
3. **No hero film and no voice-over** (G4, G5). The hero runs a licence-free surf
   loop with a graded poster; the _Listen_ toggle does not render until an audio
   file exists (`HOME.hero.audioSrc` is `null`). The document's 15-second
   surf-to-jungle brief and the voice-over script are in the content module.
4. **No legal pages** (G3). `/privacy` and `/terms` are four-heading stubs, every
   string a marked placeholder, `noindex`, unlinked on production. Counsel replaces
   them wholesale.
5. **Nine questionnaires share one interpretation line** (G6). Only the alcohol
   questionnaire has its own sentence; the other nine carry the generic second
   sentence. Nine sentences from the client close it.
6. **The contact website domain is a placeholder** (G2): `thenewpractice.health`,
   taken from the founder's email host. The document left it blank.
7. **Founder role wording and years figure** (C2, C4). _Founder & Clinical Director_
   beside _Founder and Clinical Director_; twenty-five, twenty and four decades of
   experience in different places. Rendered verbatim; the client picks.
8. **Spelling drift** (C5). _individualized_ and _Individualised_, _program_,
   _counsellor_ and _counselors_, _recognize_ and _recognise_ all appear. Verbatim;
   the client chooses a convention and we apply it in the source document.
9. **The ™** (§3). Rendered at most once per page, in the hero wordmark and the
   footer lockup. Two verbatim client strings carry it inside running text
   (the assessment series title, _Intuitive Reconnection Massage™_) and are left as
   written. The owner confirms the once-per-page rule or exempts client copy.
10. **Placeholder gating on production.** With `SITE_ENV=production` the three
    placeholder routes vanish from every navigation surface, the footer's _Legal_
    column disappears with them, and the _Copy pending client review_ flag stops
    rendering. Staging shows all of it on purpose, so the client is reviewing more
    than a production visitor would see.
11. **Also noted while walking every page** (`CONTENT-GAPS.md` §6): mixed title
    casing between pages (_ABOUT THE NEW PRACTICE_ beside _Our principles_), the
    hyphen in _Our Logo - The Ceiba_, role lines up to ten words long, _Cost_ on the
    page and _Fees_ in the navigation.

## Decisions the client must make

Each with the default we shipped.

1. **Residences**: supply copy and photography, or drop the page from the first
   release. _Shipped: placeholder page, unlinked on production._
2. **Portraits**: commission or supply eleven. _Shipped: the placeholder frame._
3. **Hero film and voice-over**: commission per the document's brief, or keep the
   stock loop. _Shipped: the surf loop, no audio toggle._
4. **Legal text**: supply privacy and terms, or name the jurisdiction and counsel.
   _Shipped: stubs, unlinked on production._
5. **Nine interpretation lines** for the questionnaires. _Shipped: the generic
   sentence on nine of ten._
6. **Assessment scoring**: confirm the per-questionnaire yes/no scoring (0–15,
   three bands) over the document's own 0–3 how-to section, and reword the how-to
   if the 0–3 scale is retired. _Shipped: yes/no scoring; the how-to's first
   sentence only._
7. **The website domain** for the contact block and, later, production.
   _Shipped: `thenewpractice.health`, marked placeholder._
8. **Founder role wording** (_&_ or _and_) and **the years figure**. _Shipped:
   verbatim, unreconciled._
9. **British or North American spelling.** _Shipped: verbatim, mixed._
10. **The ™ rule**: once per page, or exempt client copy. _Shipped: once per page;
    the two client strings left as written._
11. **Title casing convention** across section titles. _Shipped: verbatim, mixed;
    the site's own rule is sentence case._
12. **_Cost_ or _Fees_.** _Shipped: the page heading is their_ Cost_, the
    navigation says_ Fees_._
13. **Typeface licensing**: license the Didone and geometric sans their identity
    specifies (the client buys and holds the licences per the contract), or accept
    the stand-ins. _Shipped: Bodoni Moda and Jost._
14. **Auto-deploy from `main`**: keep the GitHub connection, or disconnect it and
    deploy by hand. _Shipped: connected._
15. **The preloader veil on slow devices** (see _Performance state_): keep it as
    the entry moment, or shorten or skip it under a slow-CPU heuristic. _Shipped:
    as designed._
16. **The `index-01` canopy plate**: keep it at the cost of one oversized image
    above 640 px, or swap it for the misty-valley canopy alternate
    (`design/STOCK-SOURCES.md` §I1 option 3, Alfin Auzikri, Pexels). _Shipped:
    kept, at quality 60._

## Before production

None of this is code. Every item is an account or a value on the Vercel project.

1. **Mail.** The client creates the Resend account in the practice's name, verifies
   a sending domain, and the project gets `RESEND_API_KEY`, `ENQUIRY_TO_EMAIL` (the
   mailbox that receives enquiries) and `ENQUIRY_FROM_EMAIL` (an address on the
   verified domain). Without the key the adapter logs and never mails; with the key
   and no recipient it warns `enquiry.mail.misconfigured` and logs. Nothing a
   visitor submits is stored, on any setting.
2. **Environment.** `SITE_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://<the
real domain>` on the production target. That alone flips `robots.txt` to allow,
   fills the sitemap, removes `noindex`, hides the placeholder routes from the
   navigation and stops the review flag rendering. If preview deployments will be
   used for review, set both variables on the preview target as well.
3. **Domain.** The client's domain on the client's account (contract §8), pointed at
   the Vercel project; the staging hostname stays or goes as the owner prefers.
4. **Analytics.** One tool, on the client's own account, after approval, with basic
   enquiry-form goal tracking (contract §1). Nothing is installed today and the
   Content-Security-Policy in `vercel.json` will need the tool's hosts added in the
   same change.
5. **Fonts.** The client buys and holds the licences for the production typefaces
   (contract §3); the swap is one file, `src/app/layout.tsx`, plus the fallback
   metrics.
6. **Accounts.** Hosting, domain, analytics and any CMS are created in the
   practice's name and on the practice's billing, with admin access granted to the
   developer; primary ownership transfers on approval of the templates and access is
   removed at practical completion (contract §8).
7. **Rebuild in January.** The footer's year is read at build time, so a site that
   has not been redeployed since December shows the old year until it is.
8. **Real-device pass** (docs/11 Gate 3): iPhone and iPad in Safari, a Mac in Safari
   and Chrome, Windows in Chrome and Edge, Firefox anywhere. Playwright's WebKit
   project covers the engine, not the devices. Walk the enquiry form and a
   questionnaire in Safari with the keyboard preference both ways.

## Performance state

Measured method, tables and causes are in `docs/09-performance-accessibility.md`
§1 _Measured budgets_; the CI configuration is `lighthouserc.json` (mobile,
devtools throttling with a real 4× CPU slowdown, eight URLs, median of three runs,
Performance ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1). Thresholds were never lowered.

**What passes everywhere.** Accessibility 100 and Best Practices 100 on every route.
CLS 0.004–0.010. Zero long tasks over 50 ms on the 4× CPU scroll traces of `/`,
`/our-process` and `/clinical-services`. All 52 pages prerendered; `/og` is the only
server function; the live edge serves `/` from the prerender.

**What the gate says after the LCP fix (this milestone's last change).** Lead
paragraphs on the title pages and the enquiry letter's opening now reveal through a
clip mask instead of opacity, so Chromium credits them at first paint as it does the
title's line masks. The devtools table, median of three, mobile:

| Route                                    | Perf (Task 20 → 21) | FCP  | LCP (Task 20 → 21) | LCP element                                         | CLS   | TBT | SI   |
| ---------------------------------------- | ------------------- | ---- | ------------------ | --------------------------------------------------- | ----- | --- | ---- |
| `/`                                      | 82 → 81             | 2118 | 2117 → 2118        | `h1#home-title`                                     | 0.005 | 343 | 8003 |
| `/about`                                 | 87 → 86             | 2040 | 2045 → 2040        | preloader wordmark                                  | 0.005 | 223 | 7818 |
| `/clinical-services`                     | 90 → **90**         | 2012 | 2029 → 2012        | `h1`                                                | 0.005 | 74  | 7836 |
| `/clinical-services/addiction-treatment` | 75 → 89             | 2029 | **4428 → 2029**    | `h1` (was `p.t-lead`)                               | 0.005 | 98  | 7788 |
| `/team/lowell-monkhouse`                 | 90 → **90**         | 2000 | 2007 → 2000        | `h1`                                                | 0.005 | 99  | 7792 |
| `/residences`                            | 87 → 85             | 2026 | 2131 → 2026        | `h1`                                                | 0.005 | 211 | 9162 |
| `/contact`                               | 74 → **90**         | 1820 | **4742 → 1824**    | `h1` / `p.t-body` (masked, credited at first paint) | 0.005 | 72  | 7811 |
| `/self-assessment/alcohol`               | 90 → **90**         | 2016 | 2015 → 2016        | `h1`                                                | 0.004 | 79  | 7739 |

Five of eight routes are at or over the 90 gate; both LCP assertions pass (the two
routes that failed them went from 4.4–4.7 s to 1.8–2.0 s). `/` (81), `/about` (86),
the treatment page (89) and `/residences` (85) still miss the score.

**What misses, and why.** Two causes, both design decisions rather than defects:

1. **Speed Index of roughly 8 s on every route** is the preloader veil at 4× CPU.
   Speed Index is a tenth of the score and costs each route several points. The
   owner's options: keep the veil as the entry moment (shipped), shorten it, or skip
   it under a slow-CPU heuristic.
2. **First-load JavaScript is about 250 kB gzip** on every route (`/contact` about
   350 kB with its route-scoped form chunk), against a 160 kB intent. The floor is
   React, the router, GSAP and Motion; the remaining lever is Motion's `LazyMotion`
   (about 25–30 kB), which touches the curtain, the overlay, the form and the scorer
   and is a post-launch option.

Also for the owner: the `index-01` canopy plate serves at 136–372 kB above 640 px
(decision 16 above); the ambient gradient is a separate lazy chunk requested only on
`/` on an eligible desktop and never on mobile.

## Repo map

```
CLAUDE.md                    agent operating manual — read first
HANDOFF.md                   this file
README.md                    start-here table and commands
AGENTS.md                    the same manual for other agent runners
docs/00–11                   the specification set; docs are the contract, code is the bug
docs/BUILD-LEDGER.md         the task queue, every finding, the deploy log
docs/CONTENT-GAPS.md         what the client did not supply, and every contradiction
docs/CONTENT-PROVENANCE-AUDIT.md  every string on the site traced to its source
.claude/plans/               the approved milestone plan
design/ASSETS.md             every image and clip, its source and licence
design/brand/                the client's logo PDF
design/media.manifest.json   what the media pipeline fetches, crops and grades
Final Website Instructions_DRAFT Sept 1 2026 .docx.md   the client's content document
thenewpractice-website_signed.pdf                       the contract
src/content/                 the only place words live; generated from the document by scripts/ingest-content.mjs
src/templates/               the seven templates (plus the assessment variant and the legal stub)
src/sections/                the section blocks the templates compose
src/components/              chrome and primitives; Mark.tsx is the client's ceiba
src/motion/                  GSAP and Motion configuration, the Reveal primitive, tokens
src/webgl/                   the gated ambient gradient
src/lib/                     pure, unit-tested helpers (SEO, JSON-LD, env, compositions)
src/server/                  the enquiry action, schema, handler and mail adapter
src/app/                     routes, globals.css and sections.css, robots, sitemap, llms.txt, OG
tests/e2e/                   Playwright specs, one per route or chrome piece
tests/lighthouse/            the Lighthouse CI runner
scripts/                     content ingestion, content check, media pipeline
public/media, public/video   the graded stills and loops
```

## Commands

```
npm run dev            # dev server (Turbopack)
npm run verify         # lint, typecheck, unit tests with coverage, production build — the gate every commit passes
npm run e2e            # Playwright on five projects (390, 768, 1280, 1920, reduced motion) against a dev server it starts
npm run e2e:webkit     # the same specs on WebKit at 1280, on request
npm run lighthouse     # Lighthouse CI against a production build (npm run build first)
npm run content:check  # the content-layer checks alone, including the provenance guard
npm run media          # re-fetch, grade and encode every still and loop from design/media.manifest.json
npx vercel deploy --prod --yes --scope kidus-projects-8964b022   # deploy a clean checkout of main to staging
```

Point the e2e suite at a running server with `E2E_BASE_URL=<origin>`; start the
test process with `SITE_ENV=production` when that server runs in production mode,
so the navigation and robots assertions match it. Node 26, npm 11.

To close a content gap: edit the client document, run
`node scripts/ingest-content.mjs`, then `npm run content:check`. Never edit the
modules by hand; the generator asserts its own assumptions and names the line
when the document changes shape.
