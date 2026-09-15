# 00 — Project Brief

## The situation

The New Practice is a private behavioural health practice based in Puerto Aventuras, in Mexico's Riviera Maya. They treat **one client at a time**: addiction, trauma, eating disorders, mental health conditions, executive burnout and complex family issues, with a dedicated multidisciplinary team working exclusively with one client and their family. The founder and clinical director is Lowell Monkhouse.

They approached us by referral with a brief for a substantial website in the register of https://kusnachtpractice.com. We built a one-page concept site in their identity (`/Volumes/main-storage-2tb/projects/luxury-spa-website-demo`), they approved the direction, and a contract was signed in August 2026 (`thenewpractice-website_signed.pdf`). This repository is the production build.

## What the client has supplied

| | Where | Status |
| --- | --- | --- |
| **Identity** — name, tagline, ceiba mark, palette, type direction | `design/brand/The New Practice - Logo Concept.pdf` → `src/content/brand.ts`, `src/components/Mark.tsx`, `src/app/globals.css` | Authoritative |
| **Content** — landing page, about, process, personal message, fees, 11 clinical services, 11 team biographies, 10 self-assessment questionnaires, contact | `Final Website Instructions_DRAFT Sept 1 2026 .docx.md` → `src/content/**` (task 5) | Authoritative, rendered verbatim, British spelling kept |
| **Contact details** — founder, phone, email, location | Home page of the content document → `src/content/brand.ts` | Authoritative; the contact page uses the same values where the document left blanks |
| **Residences / hospitality copy** | — | **Not supplied.** Structural `PLACEHOLDER` copy until it is. |
| **Photography, video, voice-over, team portraits** | — | **Not supplied.** Licence-free stock and generated placeholders, all logged in `design/ASSETS.md`. |
| **Legal pages** | — | Not supplied. Stubs marked `PLACEHOLDER`. |

`docs/CONTENT-GAPS.md` (task 5) is the running list of what the client still owes and what we resolved on their behalf.

## What this repo produces

The contract's first milestone: **seven templates** plus site-wide header, primary navigation (desktop and mobile) and footer, **deployed to a staging URL**, working at desktop, tablet and mobile.

| # | Template | Routes |
| --- | --- | --- |
| T1 | Home | `/` |
| T2 | Interior | `/about`, `/our-process`, `/a-personal-message`, `/fees`, `/privacy`, `/terms` |
| T3 | Treatment | `/clinical-services/[slug]` × 11 |
| T4 | Profile | `/team/[slug]` × 11 |
| T5 | Residences | `/residences` |
| T6 | Index | `/clinical-services`, `/team`, `/self-assessment` |
| T7 | Enquiry | `/contact` |
| — | Interactive self-assessment | `/self-assessment/[slug]` × 10 |

Client approval is against the design direction; final content in place is not required for approval, but every template renders the real content that exists.

The full specification is `.claude/plans/two-week-templates.plan.md`; the task queue is `docs/BUILD-LEDGER.md`. Together with this doc set they are the contract between agents.

## Success criteria

The milestone succeeds if, on the staging URL, the client:

1. Recognises their own words and identity on every page, arranged better than they imagined them
2. Feels the quality difference between this and the Küsnacht reference immediately
3. Can navigate every template on a phone, a tablet and a laptop without a single broken moment
4. Sees the gaps (residences, photography, video) as their next decisions, not as our omissions

## Success criteria, measured

| Metric | Target | Where it is checked |
| --- | --- | --- |
| Lighthouse Performance (mobile) | ≥ 90 on `/` and one URL per template | Lighthouse CI, task 4 / 20 |
| LCP | < 2.5s (CI gate); < 1.8s aspiration | Lighthouse CI |
| CLS | < 0.1 (CI gate); < 0.02 aspiration | Lighthouse CI |
| Lighthouse Accessibility | 100; axe reports no serious violation on any template | Playwright + axe |
| Sustained scroll framerate, 4× CPU throttle | 60fps, zero long tasks > 50ms | DevTools traces, task 19 |
| Unit test coverage | ≥ 80% on `src/lib`, `src/content`, `src/server` | Vitest, task 4 |
| Works with JS disabled | Content readable, layout intact, motion absent | Manual, task 19 |
| Reduced motion | A complete second design on every template | Playwright `reduced-motion` project |

## What is explicitly out of scope for this milestone

- The remaining page build-out beyond the templates (the contract's later milestones)
- CMS integration — the content layer is shaped so one can replace the module source later without touching templates
- Multi-language
- Analytics — none on staging; one tool on the client's account after approval
- Client-supplied photography, video, voice-over and portraits — the templates are built to receive them
- WebGL as a deliverable — the ambient gradient is a voluntary, gated, removable enhancement (contract §3 excludes WebGL from the fee)

## Constraints on tone

This is a practice that people come to at the worst moment of their lives, with a great deal to lose. The site must feel **calm, private, and adult**. It must never feel like it is selling. Warmth is permitted; enthusiasm is not. The client's copy already carries this register; our job is not to add to it.
