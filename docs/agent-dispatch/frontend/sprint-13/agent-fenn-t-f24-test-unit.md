---
doc: agent-fenn-t-f24-test-unit
ticket: T-F24
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/F24-mock-mission-reads
checkout: branch
after: []
depends_on: [T-F23]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-test-unit-completion.md
---


# T-F24 · tests · Fenn: contract-mock serves the rest of the mission: checkpoints, plan, package, gates, findings and receipt (CR-W31 part c)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F24 · rigor standard |
| Dispatch | test-unit · Fenn (checker) · model sonnet |
| Works on | `t/F24-mock-mission-reads` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-13/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/screens.md`: every screen: its routes by number, its states and their words
6. `docs/ui-reference/control-room-handoff/README.md`: the rules that aren't obvious: Decisions is home, approvals never ask for a password, no money, nothing polls
7. `docs/design/API routes.md`: each route by number
8. `docs/ui-contracts/decisions-approval-page.md`: the decision card, Undo and the stale state
9. `packages/contract-mock/src/mock.ts`: implement(contract) through OpenAPIHandler: idempotency, MockFailure, recorded requests, and T-B11's auth
10. `packages/contract-mock/src/world.ts`: the sample world the mock grows from
11. `packages/contract/src/routes`: each new route's input, output and errors
12. `docs/design/API routes.md`: the routes this ticket adds
13. `docs/design/DATABASE.md`: the mission, checkpoint and proposal state machines the world follows
14. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** contract-mock serves the checkpoints, the plan, the dispatch package, the gates, the findings and the receipt over the mission world, so the plan and release screens run against it.

**Refs:**
- CR-W31 part (c): routes 38 to 43, 46, 49, 55, 56, 58 to 61, 100 to 102, 107
- Javaris, Nov 18: "yes i approve" (the frontend lane builds CR-W31 (b) and (c) as sprint-13 tickets after T-F22), on Axis's three conditions
- E2 (the web builds against contract-mock)
- docs/design/API routes.md

**Merged before this starts:** T-F23

**Labels:** mock · implements CR-W31

**Notes from the lead:**
- Axis's conditions (Nov 18): the mock stays implement(contract) with output validation, and each new route's test checks its output against the contract; state moves follow the contract's value lists and state machines (422 with the allowed moves, stale is 409); anything the contract doesn't say is a CR-W, so stop with needs-cr rather than invent it
- Routes in part (c): 38 to 42 (a checkpoint's sections, generate, approve, ask for changes, reopen; 40 is part (a)'s, unchanged), 43 (a fact), 46 (the plan, ?version=), 49 (dispatches), 55 (gates), 56 (an integration commit), 58 to 60 (findings: list, confirm or dismiss, accept, which caps the verdict at pass), 61 (the receipt, ?verify=1), 100 to 102 (the package manifest, one file, the archive), 107 (one proof file, at most 2 MB). Every write keeps Idempotency-Key replay, rowVersion or the bound hash, and the contract's error body
- The world is T-F22's state module: this ticket adds its routes to it and changes a move only where a new route needs one, each change named in the report
- Axis reads the state module for fidelity before merge, as a check (not a G7 review); OSA asks him once the review is in
- Review: one round (CR-42); the full-diff rule applies as in T-F14
- Waits for T-F23: both change packages/contract-mock/src/** (CR-42 item 4: tickets in one sprint depend on each other only when they share a file)
- CR-W32 (proposed Nov 21, in the same brief as this re-plan): route 34's first turn on a draft mission starts onboarding in that call. The mission moves to onboarding, onboardingStartedAt is set, checkpoint 0.1 is drafted (the world's startOnboarding, seed-only today), and route 63 gets missions.mission.changed and onboarding.checkpoint.changed. Answering Q-0.1a on route 44 sets the kind and doesn't move the state. Route 34 keeps MISSION_NOT_IN_SCOPING for states after onboarding. If Javaris doesn't accept CR-W32, this note and its behaviour come out before the tests start
- Size: a full session (#45)

## 4. Tasks

### T-F24-01: a failing test for: unit (behaviour): each part (c) route answers with a body its contract output schema accepts, with X-Request-Id and X-Contract-Version

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F24-02: a failing test for: unit (behaviour): editing, generating, asking for changes on and reopening a checkpoint move it the way the state machine says, and a move it doesn't allow is 422 with the allowed moves

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F24-03: a failing test for: unit (behaviour): accepting a finding on route 60 caps the receipt's verdict at pass on route 61, and route 61 with ?verify=1 rechecks the hash

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F24-04: a failing test for: unit (behaviour): route 100's packageHash is the hash route 114 binds; a stale one is 409

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F24-05: a failing test for: unit (behaviour): MockFailure works on every part (c) route, and recorded requests name the route by number

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F24-06: a failing test for: unit (behaviour, CR-W32): a mission made on route 20 is draft; answering Q-0.1a on route 44 sets its kind and leaves it draft; its first turn on route 34 moves it to onboarding with checkpoint 0.1 drafted, and route 63 sends missions.mission.changed then onboarding.checkpoint.changed

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/contract-mock/test/mission-reads.test.ts`
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/contract/**`
- `packages/db/**`
- `apps/**`
- `pnpm-lock.yaml`
- `packages/contract-mock/package.json`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**` |
| T-F16 | builds | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` |
| T-F16 | tests | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F17 | builds | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` |
| T-F17 | tests | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
| T-F25 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/uploads.js`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/changes/T-F25.md` |
| T-F25 | tests | `apps/web/e2e/home-headroom/**`, `apps/web/test/sources/samples.test.ts` |

## 6. Execution protocol: tests

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Write one test per task in Part 4, in the test paths only. Real Postgres; `TestClock` and the Clock, Ids and Random services; never sleep on the wall clock (E10, F4).
5. Cover every state the screen names (loading, empty, error, ready) against `contract-mock`. Every end-to-end test runs the WCAG 2.2 AA check and records a screenshot (E17, F6).
6. No `.skip`, `.only` or `todo` (F3).
7. Run them and confirm **every one fails**, for the reason the behaviour isn't built yet. A test that passes now is your bug (B2).
8. Commit the tests and your report to the branch. The lead reviews them and writes the lock line.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/contract-mock test
pnpm build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F24
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F24: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F24, "contract-mock serves the rest of the mission: checkpoints, plan, package, gates, findings and receipt (CR-W31 part c)": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F24-mock-mission-reads`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-test-unit-completion.md`, committed to the branch. Don't push.
