---
doc: agent-fenn-t-f23-review
ticket: T-F23
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F23-mock-streams
checkout: detached
after: [agent-fantem-t-f23-build]
depends_on: [T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-review-completion.md
---


# T-F23 · review · Fenn: contract-mock streams Canon, events and traces (CR-W31 part b)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F23 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F23-mock-streams`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

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
14. `packages/contract-mock/test/mission-streams.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f23-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-review.md`: this document: follow it exactly

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

### T-F23-01: check: unit (behaviour): route 34 streams Canon's scripted reply as CanonStreamChunk values the contract accepts, and an aborted request stops the script

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F23-02: check: unit (behaviour): route 105 re-attaches to a reply still streaming from where the client was, and answers STREAM_GONE once it has finished

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F23-03: check: unit (behaviour): route 63 sends an event, with a contract event kind, for each state move a part (a) route makes, and a reconnect with Last-Event-ID sends only what came after

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F23-04: check: unit (behaviour): route 64 with view=steps streams an attempt's steps, and route 109 returns the same steps oldest first, from ?after=

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F23-05: check: unit (behaviour): MockFailure works on every part (b) route, and recorded requests name the route by number

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F23-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-13/findings/t-f23-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/contract-mock/src/**`

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

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F23
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F23, "contract-mock streams Canon, events and traces (CR-W31 part b)": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f23-review-completion.md`, left uncommitted. Don't push.
