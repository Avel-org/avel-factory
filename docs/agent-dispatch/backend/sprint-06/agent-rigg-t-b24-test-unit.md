---
doc: agent-rigg-t-b24-test-unit
ticket: T-B24
lane: backend
sprint: sprint-06
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/B24-status-and-decisions
checkout: branch
after: []
depends_on: []
report: docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b24-test-unit-completion.md
---


# T-B24 · tests · Rigg: The top bar and Decisions, from real rows: routes 104, 52 and 53

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B24 · rigor standard |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B24-status-and-decisions` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-06/codebase-analysis.md`: the codebase in short
5. `docs/design/Backend modules and build plan.md`: section 1 (the build order and the critical path) and section 4 (compute, metering, events and factory: what each owns)
6. `docs/design/Design v0.6 Main.md`: Build order steps 2, 5, 7 and 8; Cost control (budgets, reserve before spending); API routes (four callers, the proxies are services on the host)
7. `docs/design/Sandbox - Docker now, boat or MIOSA next.md`: the trust boundaries: no model key in a room, one token per dispatch revoked on every exit, git over HTTP pushing only its own branch
8. `docs/design/DATABASE.md`: credentials, budget_reservations, price_table, attempts, missions, proposals, events and agent_traces; Ownership
9. `docs/design/API routes.md`: routes 19 to 21, 52, 53, 63, 64, 104 and 109, and the rules on every write
10. `docs/design/Build rules.md`: B7, B8, C4, E3, E5, E7, E8, E9, E10, E12, E13, F4, G5, G7, H6, I3
11. `packages/contract/src/dto/decisions.ts`: PendingDecisionDto's ten kinds, the shared base (ref, owner, asOfSeq, plain, evidence, reasonRequired, rejectable, unlocks, previous), the order, and ProposalViewDto
12. `packages/contract/src/dto/health.ts`: StatusDto and AlertDto: slots, needsYouCount, alerts, stallAfterMs, lastSeq
13. `packages/contract/src/plain-templates.ts`: the plain words each kind carries, written by the server
14. `docs/design/CR-W2 Pending decisions.md`: what each kind is, where its row comes from, and the ordering
15. `docs/design/CR-W5 Mission summary and status.md`: the status read: slots, what needs you, alerts
16. `packages/server/src/onboarding/clients`: the route pattern to follow: the mapper, the router entry, the 401 through errors.ts
17. `packages/server/src/platform/router.ts`: where a module's routes join the contract's tree
18. `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b24-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** The control room's top bar shows real slots, alerts and how many things need the operator, and Decisions lists every item waiting on the operator from the factory's own tables, in the server's order, each with its plain words.

**Refs:**
- API routes.md: route 104 (GET /api/status, CR-W5), route 52 (GET /api/pending-decisions, the 10-kind union, CR-W2) and route 53 (GET /api/proposals/{proposalId})
- CR-W5 Mission summary and status: the status read, its slots, needs-you count and alerts
- CR-W2 Pending decisions: the union, its ref, its ordering
- Design v0.6 Main, Build order step 5: the avel watch header reads this status (the CLI itself waits, Nov 18)
- Build rules E13: four tests per route

**Notes from the lead:**
- The pending-decisions query lives in packages/server/src/factory/decisions/ and is exported from its index.ts with a per-mission count, because T-B25's mission rows (needsYouCount, displayState) use it. It only reads: proposals, checkpoints, plans, questions, receipts and pass approvals, the dispatch package's commit, follow-ups. It writes nothing
- Route 52 serves nine kinds from the factory's tables. factory_change isn't served: open factory PRs live on GitHub, not in a table (the contract's dto/factory.ts), and come with routes 72 and 73. Say so in the report. A kind whose row the docs don't place, or whose fields no column holds, is a needs-cr, not a guess (E3)
- Ordering and paging as the contract says: items that came back first, then expiring soonest, then deadline risk, then oldest; the contract's cursor and limit. asOfSeq is the latest event seq the item reflects
- Route 104: slots.total is 6 (Design v0.6 Main: up to 6 dispatches at once) as one named constant citing it, until the scheduler reads it from factory.yaml (9b); slots.busy counts the dispatches running now. needsYouCount is route 52's count. alerts are the system.alert.raised events with no later system.alert.cleared for the same key. lastSeq is the latest committed seq. No money
- Agent, client and Canon text goes out as plain text, never HTML (AGENTS.md)
- The 401 without a session and the 404 for an unknown proposal go through errors.ts's table, with the contract's body and requestId (Writing Effect rule 3)

## 4. Tasks

### T-B24-01: a failing test for: route 52 returns one row for each open item it serves (an open proposal, a checkpoint waiting for approval, a plan waiting to be finalized, an unanswered question, a pass approval and a release due, a dispatch package commit due, a follow-up and an upkeep offer, inserted as rows), each valid against PendingDecisionDto, with a resolved or expired item absent

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B24-02: a failing test for: route 52 orders items that came back first, then expiring soonest, then oldest, and pages with the contract's cursor and limit without repeating or skipping a row

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B24-03: a failing test for: route 53 returns a proposal's ProposalViewDto, valid against the contract; an unknown proposal id is 404 with the contract's body and the request's requestId

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B24-04: a failing test for: route 104 returns slots { busy, total: 6 }, needsYouCount equal to route 52's count, the raised alerts that weren't cleared (a cleared one is absent), and lastSeq equal to the latest committed event's seq, valid against StatusDto

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B24-05: a failing test for: routes 52, 53 and 104 without a session are 401 with the contract's body and requestId

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B24-06: a failing test for: a proposal's text holding <script> comes back as the same plain characters

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B24-07: a failing test for: the per-mission count exported from factory/decisions counts only that mission's open items

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/server/test/decisions/**`
- `packages/server/test/status/**`
- `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b24-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/server.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/jobs/**`
- `packages/db/**`
- `packages/contract/**`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B21 | builds | `packages/server/src/compute/credentials/**`, `packages/server/src/server.ts` |
| T-B21 | tests | `packages/server/test/credentials/**` |
| T-B22 | builds | `packages/server/src/metering/**`, `docs/design/DATABASE.md`, `packages/db/src/owners.ts` |
| T-B22 | tests | `packages/server/test/metering/**` |
| T-B25 | builds | `packages/server/src/factory/missions/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B25 | tests | `packages/server/test/missions/**` |
| T-B26 | builds | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B26 | tests | `packages/server/test/streams/**` |
| T-B27 | builds | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` |
| T-B27 | tests | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |

## 6. Execution protocol: tests

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Write one test per task in Part 4, in the test paths only. Real Postgres; `TestClock` and the Clock, Ids and Random services; never sleep on the wall clock (E10, F4).
5. Every route gets the four from E13: the happy path with its DTO checked, the error body with `requestId`, the idempotent replay, the stale `rowVersion`.
6. No `.skip`, `.only` or `todo` (F3).
7. Run them and confirm **every one fails**, for the reason the behaviour isn't built yet. A test that passes now is your bug (B2).
8. Commit the tests and your report to the branch. The lead reviews them and writes the lock line.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter @avel/server test
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server check:effect
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b24-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B24
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B24: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B24, "The top bar and Decisions, from real rows: routes 104, 52 and 53": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b24-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B24-status-and-decisions`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b24-test-unit-completion.md`, committed to the branch. Don't push.
