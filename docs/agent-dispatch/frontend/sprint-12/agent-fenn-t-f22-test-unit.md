---
doc: agent-fenn-t-f22-test-unit
ticket: T-F22
lane: frontend
sprint: sprint-12
agent: fenn
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/F22-mock-mission-world
checkout: branch
after: []
depends_on: []
report: docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-test-unit-completion.md
---


# T-F22 · tests · Fenn: contract-mock walks a mission from draft to release (CR-W31 part a)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-12 · Step 1 |
| Ticket | T-F22 · rigor standard |
| Dispatch | test-unit · Fenn (checker) · model sonnet |
| Works on | `t/F22-mock-mission-world` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-12/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/login.md`: the sign-in UI contract: the wire, the guard, /login, sign-out, the mock, the LG scenarios
6. `docs/design/CR-W29 The control room from the design export.md`: E14 (sign-in first), E16 and decision 6 (/'s budget), E4 (new code is TypeScript)
7. `docs/design/CR-W30 The web's auth wire and a minified contract.md`: A: the auth mock this ticket builds against
8. `docs/design/Step 0 and Step 1 plan.md`: item 5 (Better Auth: one operator, sign-up off, lockout), Rate limits, test 7
9. `packages/contract-mock/src/mock.ts`: implement(contract) through OpenAPIHandler: idempotency, MockFailure, recorded requests, and T-B11's auth
10. `packages/contract-mock/src/world.ts`: the sample world the mock grows from
11. `packages/contract/src/routes`: each new route's input, output and errors
12. `docs/design/API routes.md`: routes 9, 10, 20, 21, 28, 29, 30, 40, 44, 104, 108 and 114
13. `docs/design/DATABASE.md`: the mission, checkpoint and proposal state machines the world follows
14. `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** contract-mock serves the routes Decisions and a mission's start use, over a world with one mission whose state moves the way the contract's state machine says, so sprint-13's first screens run against it.

**Refs:**
- CR-W31 part (a): Javaris, Nov 18, "approve T-F22"; built by the frontend lane on Axis's three conditions
- E2 (the web builds against contract-mock)
- docs/design/API routes.md

**Labels:** mock · implements CR-W31

**Notes from the lead:**
- Axis's conditions (Nov 18): the mock stays implement(contract) with output validation, and each new route's test checks its output against the contract; state moves follow the contract's value lists and state machines (422 with the allowed moves, stale is 409); anything the contract doesn't say is a CR-W, so stop with needs-cr rather than invent it
- Routes in part (a) (Axis's split, Nov 18: 8, 9, 10, 19, 20, 21, 28 to 30, 40, 44, 52 to 54, 104, 108, 114): 9 and 10 (create and read a client), 20 and 21 (create and read a mission), 108 (a module run), 104 (status), and the approve calls Decisions makes: 28 (finalize), 29 (pass approval), 30 (release), 40 (approve a checkpoint), 44 (answer a question), 114 (confirm the package commit). Routes 8, 19 and 52 to 54 are served already, and in part (a) they read the same world (Axis's split, Nov 18): a client made on 9 shows in 8, a mission made on 20 shows in 19, and an approval on 28 to 30, 40 or 44 removes its row from 52. The streams (34, 63, 64) and every other read stay out
- The world: one internal client and one mission, seeded at a state a test picks (draft, each checkpoint 0.1 to 0.4, finalized, building, at Gate 5, awaiting release, delivered). An approve call moves it on, and route 52's pending list follows. Every write keeps Idempotency-Key replay, rowVersion or the bound hash, and the contract's error body
- Axis reads the state module for fidelity before merge, as a check (not a G7 review); OSA asks him once the review is in
- Review: one round (CR-42); the full-diff rule applies as in T-F14
- Size: a full session (#45)

## 4. Tasks

### T-F22-01: a failing test for: unit (behaviour): a client made on route 9 is listed by route 8, a mission made on route 20 by route 19, and an approval on 28, 29, 30, 40 or 44 removes its row from route 52

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F22-02: a failing test for: unit (behaviour): each part (a) route answers with a body its contract output schema accepts, with X-Request-Id and X-Contract-Version

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F22-03: a failing test for: unit (behaviour): a mission seeded at checkpoint 0.1 moves through 0.4, finalization, pass approval and release only by the routes, and route 52's pending rows follow each move

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F22-04: a failing test for: unit (behaviour): a move the state machine doesn't allow is 422 with the allowed moves; a stale rowVersion or receipt hash is 409; a replayed Idempotency-Key returns the first response

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F22-05: a failing test for: unit (behaviour): MockFailure works on every part (a) route (any status and code, or a network failure), and recorded requests name the route by number

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/contract-mock/test/mission-world.test.ts`
- `packages/contract-mock/test/mission-routes.test.ts`
- `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-test-unit-completion.md` (your report)

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
| T-F12 | builds | `apps/web/src/auth/**`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/login.tsx`, `apps/web/src/routeTree.gen.ts`, `apps/web/control-room/src/pages/settings/SettingsPage.jsx`, `apps/web/control-room/SOURCE.md`, `apps/web/vite.config.ts` |
| T-F12 | tests | `apps/web/test/sign-in/**`, `apps/web/e2e/sign-in/**`, `apps/web/e2e/support/auth.setup.ts`, `apps/web/playwright.config.ts`, `apps/web/e2e/budget.spec.ts`, `apps/web/e2e/control-room/prod.spec.ts`, `apps/web/e2e/control-room-budget/**`, `apps/web/e2e/support/preview-auth.ts` |
| T-F14 | builds | `apps/web/src/data/**`, `apps/web/control-room/src/lib/api.js`, `apps/web/control-room/src/lib/stream.js`, `apps/web/control-room/src/sources/**`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/operations.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/changes/T-F14.md` |
| T-F14 | tests | `apps/web/test/data/**`, `apps/web/test/sources/**`, `apps/web/e2e/sources/**` |

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

**Your report:** `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F22
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F22: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F22, "contract-mock walks a mission from draft to release (CR-W31 part a)": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F22-mock-mission-world`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-test-unit-completion.md`, committed to the branch. Don't push.
