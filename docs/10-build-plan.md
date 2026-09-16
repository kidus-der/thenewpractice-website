# 10 — Build Plan

> **Status.** The two-week template milestone (Tasks 1–21) is delivered: the seven templates and the global chrome are deployed to the staging URL, smoke-tested live, and handed over in [`HANDOFF.md`](../HANDOFF.md). The ledger's status table and _Deploys_ table are the record; nothing below is a queue any more, it is how the milestone was run.

## The plan and the ledger

This build is run from two files. This document only points at them.

| File | Role |
| --- | --- |
| `.claude/plans/two-week-templates.plan.md` | The approved plan. §6 lists the phases; §7 describes the looped agent run; §8 the risks. |
| `docs/BUILD-LEDGER.md` | **The task queue.** Owner decisions that override the plan text, the rules every agent follows, the status table with dependencies, one brief per task, the deploy log, and the findings agents append for the main session to triage. |

**How work is picked up:** the main session reads the ledger, takes the first `todo` task whose `depends_on` are all `done`, spawns one fresh agent with that brief, verifies the result itself (`npm run verify`, screenshots read), commits, and updates the status table. Tasks are sized to fit one agent context. Two tasks with no shared files may run in parallel.

**How a task is done:** the agent reads `CLAUDE.md`, the governing docs, the brief and the plan section it cites; builds the whole task; runs the verification the brief names; reports files, evidence, deviations, findings and open questions; and stops.

## The phases, in one screen

| Phase | Tasks | Ends with |
| --- | --- | --- |
| 0 — Foundation | 1 scaffold · 2a/2b media · 3 motion + gradient · 4 test harness · 5 content ingestion · 6 staging | A deployed scaffold with tokens, chrome primitives, the content layer, tests and a staging URL |
| 1 — Global chrome | 7 header + nav · 8 footer · 9 route curtain · 10 SEO baseline | Every route dressed, navigable, transitioning, indexable-when-allowed |
| 2 — Templates | 11 interior → 12 index → 13 treatment · 14 profile · 15 enquiry · 16 home · 17 residences · 18 remaining interiors · 18b self-assessment scorer | Seven templates live on staging with real content |
| 3 — Hardening | 19 cross-template · 20 performance budgets · 21 deliver | Staging smoke-tested; `HANDOFF.md` written |

Deploy checkpoints after tasks 6, 12, 15, 16 and 21.

## Notes for parallel agents

- Two agents must never edit `globals.css` or `sections.css` in the same pass. Token changes go through one agent, or serially.
- Two agents must never edit `layout.tsx` simultaneously. Its chrome slots are claimed by tasks 7, 8 and 9 in that order.
- An agent that finds a missing token **adds it to `globals.css` and to `docs/03-design-system.md` in the same change.** Doc drift is the thing that quietly destroys a build like this.
- Before starting a template, read its spec in `docs/05` *and* its choreography in `docs/04` *and* the plan §3.3 entry. Templates built from only one of the three consistently come out wrong.
- Findings about another task's files go under *Findings* in the ledger, not into a fix.
