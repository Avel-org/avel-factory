---
doc: agent-fenn-t-f24-review
ticket: T-F24
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F24-mock-mission-reads
checkout: detached
after: [agent-fantem-t-f24-build]
depends_on: [T-F23]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-review-completion.md
---


# T-F24 · review · Fenn: contract-mock serves the rest of the mission: checkpoints, plan, package, gates, findings and receipt (CR-W31 part c)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F24 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F24-mock-mission-reads`'s head |
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
14. `packages/contract-mock/test/mission-reads.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f24-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-review.md`: this document: follow it exactly

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

### T-F24-01: check: unit (behaviour): each part (c) route answers with a body its contract output schema accepts, with X-Request-Id and X-Contract-Version

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F24-02: check: unit (behaviour): editing, generating, asking for changes on and reopening a checkpoint move it the way the state machine says, and a move it doesn't allow is 422 with the allowed moves

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F24-03: check: unit (behaviour): accepting a finding on route 60 caps the receipt's verdict at pass on route 61, and route 61 with ?verify=1 rechecks the hash

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F24-04: check: unit (behaviour): route 100's packageHash is the hash route 114 binds; a stale one is 409

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F24-05: check: unit (behaviour): MockFailure works on every part (c) route, and recorded requests name the route by number

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F24-06: check: unit (behaviour, CR-W32): a mission made on route 20 is draft; answering Q-0.1a on route 44 sets its kind and leaves it draft; its first turn on route 34 moves it to onboarding with checkpoint 0.1 drafted, and route 63 sends missions.mission.changed then onboarding.checkpoint.changed

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F24-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-13/findings/t-f24-fenn-NN.md`, one per finding

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
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
| T-F25 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/uploads.js`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/changes/T-F25.md` |
| T-F25 | tests | `apps/web/e2e/home-headroom/**`, `apps/web/test/sources/samples.test.ts` |

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

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F24
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F24, "contract-mock serves the rest of the mission: checkpoints, plan, package, gates, findings and receipt (CR-W31 part c)": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f24-review-completion.md`, left uncommitted. Don't push.
