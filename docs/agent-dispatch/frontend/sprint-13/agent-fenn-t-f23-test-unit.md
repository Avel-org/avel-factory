---
doc: agent-fenn-t-f23-test-unit
ticket: T-F23
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/F23-mock-streams
checkout: branch
after: []
depends_on: [T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-test-unit-completion.md
---


# T-F23 · tests · Fenn: contract-mock streams Canon, events and traces (CR-W31 part b)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F23 · rigor standard |
| Dispatch | test-unit · Fenn (checker) · model sonnet |
| Works on | `t/F23-mock-streams` |
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
14. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** contract-mock streams Canon's replies, the factory's events and an attempt's agent steps over the mission world, so the onboarding and build screens can run live against it.

**Refs:**
- CR-W31 part (b): routes 33, 34, 105, 63, 64, 109
- Javaris, Nov 18: "yes i approve" (the frontend lane builds CR-W31 (b) and (c) as sprint-13 tickets after T-F22), on Axis's three conditions
- E2 (the web builds against contract-mock)
- docs/design/API routes.md

**Merged before this starts:** T-F22

**Labels:** mock · implements CR-W31

**Notes from the lead:**
- Axis's conditions (Nov 18): the mock stays implement(contract) with output validation, and each new route's test checks its output against the contract; state moves follow the contract's value lists and state machines (422 with the allowed moves, stale is 409); anything the contract doesn't say is a CR-W, so stop with needs-cr rather than invent it
- Routes in part (b): 33 (the chat history), 34 (your turn: Canon's reply as CanonStreamChunk through oRPC's event iterator; aborting the request stops it), 105 (re-attach to a reply still streaming; STREAM_GONE once finished), 63 (events for all missions or one, ?missionId=, resuming from Last-Event-ID), 64 (traces, ?attemptId= with view=steps, resuming from Last-Event-ID), 109 (an attempt's steps, oldest first, ?after=). Each stream replays a fixed script whose timing the test controls through the mock's now(), never the wall clock (F4). A state move on another route emits its event on 63, with the contract's event kind
- The world is T-F22's state module: this ticket adds its routes to it and changes a move only where a new route needs one, each change named in the report
- Axis reads the state module for fidelity before merge, as a check (not a G7 review); OSA asks him once the review is in
- Review: one round (CR-42); the full-diff rule applies as in T-F14
- Size: a full session (#45)
- F2, Nov 21 (build a1's question; Zero's ruling): route 63 is a live stream. It replays the events the routes have made, oldest first, from seq 1, and then waits for more, as the locked tests' header says (ruling 5 at the lock). It doesn't end, and it doesn't serve world.sampleEvents(). Its stream stops when the request is aborted, so a client that stops reading leaves nothing running. world.test.ts's "GET /api/events/stream yields one event of every kind" (from the seed) reads route 63 to its end and expects the sample catalog. That's the seed's stub, which this ticket replaces, so the test fails on the branch until Fenn's tests a2 changes it. The catalog stays covered by world.test.ts's "has one sample of every kind" (world.sampleEvents() against EventDto), and T-F23-03 covers route 63's events. Fenn's tests a2 changes that one test, on the branch, to what route 63 now does, or removes it, saying which and why. Every other test in world.test.ts stays as it is. Then Zero relocks (F2), and Fantem's build a2 reruns Part 7 on a1's commits without redoing them

## 4. Tasks

### T-F23-01: a failing test for: unit (behaviour): route 34 streams Canon's scripted reply as CanonStreamChunk values the contract accepts, and an aborted request stops the script

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F23-02: a failing test for: unit (behaviour): route 105 re-attaches to a reply still streaming from where the client was, and answers STREAM_GONE once it has finished

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F23-03: a failing test for: unit (behaviour): route 63 sends an event, with a contract event kind, for each state move a part (a) route makes, and a reconnect with Last-Event-ID sends only what came after

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F23-04: a failing test for: unit (behaviour): route 64 with view=steps streams an attempt's steps, and route 109 returns the same steps oldest first, from ?after=

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F23-05: a failing test for: unit (behaviour): MockFailure works on every part (b) route, and recorded requests name the route by number

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F23-06: a failing test for: unit (F2, Nov 21): world.test.ts's route 63 check matches the live stream (replay, then wait) or is removed; the event catalog check ("has one sample of every kind") is unchanged

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/contract-mock/test/mission-streams.test.ts`
- `packages/contract-mock/test/world.test.ts`
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-test-unit-completion.md` (your report)

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
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md`, `apps/web/src/routes/__root.tsx`, `apps/web/src/auth/api.ts` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**`, `apps/web/test/sign-in/origin.test.ts`, `apps/web/e2e/sign-in/sign-out-failure.spec.ts`, `apps/web/e2e/support/preview-auth.ts` |
| T-F16 | builds | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` |
| T-F16 | tests | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F17 | builds | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` |
| T-F17 | tests | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |
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

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F23
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F23: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F23, "contract-mock streams Canon, events and traces (CR-W31 part b)": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F23-mock-streams`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-test-unit-completion.md`, committed to the branch. Don't push.
