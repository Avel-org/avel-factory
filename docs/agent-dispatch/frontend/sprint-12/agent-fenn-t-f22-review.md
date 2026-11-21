---
doc: agent-fenn-t-f22-review
ticket: T-F22
lane: frontend
sprint: sprint-12
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F22-mock-mission-world
checkout: detached
after: [agent-fantem-t-f22-build]
depends_on: []
report: docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-review-completion.md
---


# T-F22 · review · Fenn: contract-mock walks a mission from draft to release (CR-W31 part a)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-12 · Step 1 |
| Ticket | T-F22 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F22-mock-mission-world`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

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
14. `packages/contract-mock/test/mission-world.test.ts`: the locked acceptance tests: they define done
15. `packages/contract-mock/test/mission-routes.test.ts`: the locked acceptance tests: they define done
16. `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f22-build-completion.md`: the builder's completion report
17. `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-review.md`: this document: follow it exactly

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

### T-F22-01: check: unit (behaviour): a client made on route 9 is listed by route 8, a mission made on route 20 by route 19, and an approval on 28, 29, 30, 40 or 44 removes its row from route 52

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F22-02: check: unit (behaviour): each part (a) route answers with a body its contract output schema accepts, with X-Request-Id and X-Contract-Version

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F22-03: check: unit (behaviour): a mission seeded at checkpoint 0.1 moves through 0.4, finalization, pass approval and release only by the routes, and route 52's pending rows follow each move

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F22-04: check: unit (behaviour): a move the state machine doesn't allow is 422 with the allowed moves; a stale rowVersion or receipt hash is 409; a replayed Idempotency-Key returns the first response

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F22-05: check: unit (behaviour): MockFailure works on every part (a) route (any status and code, or a network failure), and recorded requests name the route by number

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F22-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-12/findings/t-f22-fenn-NN.md`, one per finding

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
| T-F12 | builds | `apps/web/src/auth/**`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/login.tsx`, `apps/web/src/routeTree.gen.ts`, `apps/web/control-room/src/pages/settings/SettingsPage.jsx`, `apps/web/control-room/SOURCE.md`, `apps/web/vite.config.ts` |
| T-F12 | tests | `apps/web/test/sign-in/**`, `apps/web/e2e/sign-in/**`, `apps/web/e2e/support/auth.setup.ts`, `apps/web/playwright.config.ts`, `apps/web/e2e/budget.spec.ts`, `apps/web/e2e/control-room/prod.spec.ts`, `apps/web/e2e/control-room-budget/**`, `apps/web/e2e/support/preview-auth.ts` |
| T-F14 | builds | `apps/web/src/data/**`, `apps/web/control-room/src/lib/api.js`, `apps/web/control-room/src/lib/stream.js`, `apps/web/control-room/src/sources/**`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/operations.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/app/crew.js`, `apps/web/control-room/changes/T-F14.md` |
| T-F14 | tests | `apps/web/test/data/**`, `apps/web/test/sources/**`, `apps/web/e2e/sources/**`, `apps/web/test/control-room/source.test.ts` |

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

**Your report:** `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F22
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F22, "contract-mock walks a mission from draft to release (CR-W31 part a)": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f22-review-completion.md`, left uncommitted. Don't push.
