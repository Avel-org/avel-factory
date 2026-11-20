---
doc: agent-fantem-t-f23-build
ticket: T-F23
lane: frontend
sprint: sprint-13
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: opus
branch: t/F23-mock-streams
checkout: branch
after: [agent-fenn-t-f23-test-unit]
depends_on: [T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build-completion.md
---


# T-F23 · build · Fantem: contract-mock streams Canon, events and traces (CR-W31 part b)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F23 · rigor standard |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F23-mock-streams` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
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
14. `packages/contract-mock/test/mission-streams.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build.md`: this document: follow it exactly

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

## 4. Tasks

### T-F23-01: make it true: unit (behaviour): route 34 streams Canon's scripted reply as CanonStreamChunk values the contract accepts, and an aborted request stops the script

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`

### T-F23-02: make it true: unit (behaviour): route 105 re-attaches to a reply still streaming from where the client was, and answers STREAM_GONE once it has finished

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`

### T-F23-03: make it true: unit (behaviour): route 63 sends an event, with a contract event kind, for each state move a part (a) route makes, and a reconnect with Last-Event-ID sends only what came after

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`

### T-F23-04: make it true: unit (behaviour): route 64 with view=steps streams an attempt's steps, and route 109 returns the same steps oldest first, from ?after=

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`

### T-F23-05: make it true: unit (behaviour): MockFailure works on every part (b) route, and recorded requests name the route by number

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `packages/contract-mock/src/**`
- `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/contract-mock/test/mission-streams.test.ts`

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
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F23`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F23
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F23, "contract-mock streams Canon, events and traces (CR-W31 part b)": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F23-mock-streams`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build-completion.md`, committed to the branch. Don't push.
