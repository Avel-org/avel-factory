---
doc: agent-rigg-t-b25-test-unit
ticket: T-B25
lane: backend
sprint: sprint-06
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/B25-missions
checkout: branch
after: []
depends_on: [T-B24]
report: docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b25-test-unit-completion.md
---


# T-B25 · tests · Rigg: Missions: create a draft, list them and open one (routes 19, 20 and 21)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B25 · rigor standard |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B25-missions` |
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
11. `packages/contract/src/dto/missions.ts`: MissionDto (displayState, plain, deadline, clientMain), GateStripItem, MissionListRowDto, ListMissionsInput, CreateMissionInput, OnboardingJourneyDto and MissionDetailDto
12. `packages/contract/src/routes/missions.ts`: routes 19, 20 and 21: inputs, outputs and declared errors
13. `packages/db/src/schema/factory.ts`: missions: its state CHECK, kind, budget columns and row_version; mission_pauses for displayState
14. `packages/server/src/factory/decisions/index.ts`: T-B24's per-mission count: needsYouCount and blocked_on_you; read only
15. `packages/server/src/onboarding/clients`: the route pattern: idempotent write, the activity row and its event in one transaction, the mapper
16. `packages/server/src/audit/activity.ts`: the activity row an operator write leaves
17. `docs/design/Canon onboarding v0.5.md`: the journey's stages and progress, which route 21 computes from onboarding's rows; the opener is Canon's (Step 7), not route 20's
18. `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b25-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** A new mission made in the control room is saved as a draft, shows up in the missions list with its strip and counts, and opens on its own page with its onboarding journey, checkpoints and deliveries, all from real rows.

**Refs:**
- API routes.md: route 19 (MissionListRowDto, ?kind=), route 20 (a draft with a name and an optional client, CR-W22) and route 21 (MissionDetailDto)
- Contract response to CR-W1 to W22: route 19's row, route 20's input and route 21's shape
- CR-W5 Mission summary and status: the list's strip, counts and needs-you
- Design v0.6 Main, Build order step 7: a mission is a draft before Canon's first question (Canon himself is Step 7's)
- Build rules E13: four tests per route
- CR-W32 (accepted Nov 21): route 34's first turn on a draft mission starts onboarding; its contract half is this ticket's (I3)

**Merged before this starts:** T-B24

**Labels:** contract · implements CR-W32

**Notes from the lead:**
- CR-W32's contract half (labelled contract, I3): route 34's summary gains "on a draft mission, your first turn starts onboarding" and nothing else in the route changes. It's fix(contract): CONTRACT_VERSION and packages/contract/package.json go from 1.0.1 to 1.0.2, and pnpm --filter @avel/docs generate rewrites docs/generated/openapi.json. Zero signed CR-W32 as its author; route 34's server half is Step 7's (Canon), not this ticket's
- The factory module owns missions (packages/db/src/owners.ts); its routes live in packages/server/src/factory/missions/. One mapper per DTO (toMissionDto, toMissionListRowDto); no Drizzle row leaves the server
- Route 20 writes the mission as a draft with its name and optional client (kind unset: Canon's first question sets it, CR-W22), its activity row and missions.mission.created, in one transaction through the idempotency store. Its budget comes from the design's $150 mission budget as one named constant citing Design v0.6 Main, until finalize pins factory.yaml's (Step 7). It writes nothing of onboarding's: the session and the opener are Canon's (Step 7). An unknown clientId is the database's refusal mapped to 422, not a check in code alone
- Route 19 pages missions by the contract's cursor with ?kind= (unset lists missions whose kind isn't set) and ?clientId=. Each row's gates, modules, runningDispatches and lastEventAt come from their tables (gate evaluations, module runs, dispatches, events), and needsYouCount from T-B24's count. A draft has its strip at its first state and zero counts. No money on the row (CR-W5)
- Route 21 returns MissionDetailDto: the mission, its strip, the onboarding journey computed from onboarding's rows (empty session and zeros for a draft), checkpoints and deliveries. displayState follows the contract's rule (an open operator pause is paused; an open proposal or budget pause is blocked_on_you). Reading other modules' tables is allowed; writing them isn't (E12)
- Plain words come from the contract's plain templates. Client and agent text goes out as plain text
- Anything route 21's shape needs that no column holds is a needs-cr, not a placeholder of our own (E3)

## 4. Tasks

### T-B25-01: a failing test for: route 20 with a name (and with a client) returns the draft mission valid against MissionDto, writes one missions row, one activity row and one missions.mission.created event in the same transaction

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-02: a failing test for: route 20 replayed with the same Idempotency-Key and body returns the first response and writes nothing more; the same key with another body is 409

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-03: a failing test for: route 20 with an unknown clientId is 422 with the contract's body and requestId, and writes nothing; without an Idempotency-Key it's 400

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-04: a failing test for: route 19 lists the drafts as rows valid against MissionListRowDto, filters by ?kind=unset and ?clientId=, and pages by cursor without repeating or skipping a mission

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-05: a failing test for: a mission with an open proposal shows needsYouCount 1 and displayState blocked_on_you on route 19 and route 21; one with an open operator pause shows paused

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-06: a failing test for: route 21 returns MissionDetailDto for a draft (an empty journey, no checkpoints, no deliveries), valid against the contract; an unknown missionId is 404 with the contract's body and requestId

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-07: a failing test for: routes 19, 20 and 21 without a session are 401 with the contract's body and requestId

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B25-08: a failing test for: the contract (CR-W32): route 34's summary says that on a draft mission your first turn starts onboarding, and CONTRACT_VERSION and packages/contract/package.json are both 1.0.2 (fails on main: the summary lacks it and the version is 1.0.1)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/server/test/missions/**`
- `packages/contract/test/cr-w32.test.ts`
- `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b25-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/factory/decisions/**`
- `packages/server/src/onboarding/**`
- `packages/server/src/server.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/db/**`
- `packages/db/**`
- `packages/contract/src/dto/**`
- `packages/contract/src/errors.ts`
- `packages/contract/src/events.ts`
- `packages/contract/src/value-lists.ts`
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
| T-B24 | builds | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B24 | tests | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
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
pnpm --filter @avel/contract test
pnpm --filter @avel/docs generate && git diff --exit-code docs/generated
pnpm --filter @avel/docs drift
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server check:effect
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b25-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B25
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B25: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B25, "Missions: create a draft, list them and open one (routes 19, 20 and 21)": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b25-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B25-missions`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b25-test-unit-completion.md`, committed to the branch. Don't push.
