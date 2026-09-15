# The New Practice — production website

The multi-page production site for **The New Practice**, a private behavioural health practice in Puerto Aventuras, Riviera Maya, that treats one client at a time. Next.js 16 App Router, seven templates plus global chrome, populated verbatim from the client's content document, deployed to a staging URL for review.

## Start here

| If you are… | Read |
| --- | --- |
| An AI coding agent | [`CLAUDE.md`](./CLAUDE.md) → [`docs/00-project-brief.md`](./docs/00-project-brief.md) → the doc governing your layer → your task in [`docs/BUILD-LEDGER.md`](./docs/BUILD-LEDGER.md) |
| A human joining the build | The same, in the same order |
| Looking for the plan | [`.claude/plans/two-week-templates.plan.md`](./.claude/plans/two-week-templates.plan.md) |
| Picking up the next task | [`docs/BUILD-LEDGER.md`](./docs/BUILD-LEDGER.md) — first `todo` whose dependencies are `done` |

## Commands

```
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run format     # prettier
npm run assets     # media pipeline
npm run og         # static Open Graph card
npm run verify     # lint && typecheck && build (task 4 adds tests)
```

Node 26, npm 11.

## Stack

Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · GSAP + ScrollTrigger + SplitText · Lenis · Motion · React Hook Form + Zod · Vercel

## Important

The identity, copy and contact details are the client's. Nothing clinical may be invented, and nothing a visitor submits is stored. See [`CLAUDE.md`](./CLAUDE.md) §3.
