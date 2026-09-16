# The New Practice — production website

The multi-page production site for **The New Practice**, a private behavioural health practice in Puerto Aventuras, Riviera Maya, that treats one client at a time. Next.js 16 App Router, seven templates plus global chrome, populated verbatim from the client's content document, deployed to a staging URL for review.

## Start here

| If you are… | Read |
| --- | --- |
| Asking where things stand | [`HANDOFF.md`](./HANDOFF.md) — the live URL, what is the client's and what is ours, the review-call walkthrough, known gaps, the decisions the client must make, what happens before production |
| An AI coding agent | [`CLAUDE.md`](./CLAUDE.md) → [`docs/00-project-brief.md`](./docs/00-project-brief.md) → the doc governing your layer → your task in [`docs/BUILD-LEDGER.md`](./docs/BUILD-LEDGER.md) |
| A human joining the build | [`HANDOFF.md`](./HANDOFF.md) first, then the same as the agent, in the same order |
| Looking for the plan | [`.claude/plans/two-week-templates.plan.md`](./.claude/plans/two-week-templates.plan.md) |
| Picking up the next task | [`docs/BUILD-LEDGER.md`](./docs/BUILD-LEDGER.md) — first `todo` whose dependencies are `done`; the template milestone (Tasks 1–21) is delivered |

## Commands

```
npm run dev            # dev server
npm run build          # production build
npm run start          # serve the production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run format         # prettier
npm run test           # unit tests (Vitest); test:coverage adds the report
npm run e2e            # Playwright on five projects; e2e:webkit adds WebKit on request
npm run lighthouse     # Lighthouse CI against a production build
npm run content:check  # content-layer checks, including the provenance guard
npm run media          # media pipeline: video, then stills
npm run verify         # lint && typecheck && test:coverage && build
```

Deploy: `npx vercel deploy --prod --yes --scope kidus-projects-8964b022` from a clean checkout of `main` (see `HANDOFF.md` §Live).

Node 26, npm 11.

## Stack

Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · GSAP + ScrollTrigger + SplitText · Lenis · Motion · React Hook Form + Zod · Vercel

## Important

The identity, copy and contact details are the client's. Nothing clinical may be invented, and nothing a visitor submits is stored. See [`CLAUDE.md`](./CLAUDE.md) §3.
