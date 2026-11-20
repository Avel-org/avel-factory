---
doc: agent-fenn-t-f19-test-e2e
ticket: T-F19
lane: frontend
sprint: sprint-14
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F19-plan-dispatch-live
checkout: branch
after: []
depends_on: [T-F14, T-F24]
report: docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f19-test-e2e-completion.md
---


# T-F19 · tests · Fenn: Plan and dispatch live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-14 · Step 1 |
| Ticket | T-F19 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F19-plan-dispatch-live` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-14/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/screens.md`: every screen: its routes by number, its states and their words
6. `docs/ui-reference/control-room-handoff/README.md`: the rules that aren't obvious: untrusted text, nothing polls, motion
7. `docs/design/API routes.md`: each route by number
8. `apps/web/control-room/src/sources/plan.js`: the source this ticket switches to the API (T-F14)
9. `docs/ui-reference/control-room-handoff/screens.md`: Plan and Dispatch: routes and states
10. `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f19-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** You read the mission's plan by version, its dispatch package and each of its files, and confirm the package commit, all from the API.

**Refs:**
- CR-W31 part (c), T-F24: routes 46, 49, 100 to 102
- CR-W11 (the package commit)
- CR-16 (the dispatch package)

**Merged before this starts:** T-F14, T-F24

**Notes from the lead:**
- Reads: 46 (the plan, ?version=), 49 (the dispatches, with DISPATCH.md), 100 (the package manifest), 101 (one file, text/markdown, rendered as plain text with HTML off), 102 (the archive, a download link). Writes: 114 (confirm the package commit, bound to packageHash, with an Idempotency-Key)
- Plan and Dispatch render through operations.js and OpsPages.jsx, which this ticket doesn't change: the source gives them the values in the shapes they read today. If a page needs a change, stop with out-of-scope
- Review: one round (CR-42). The full-diff rule: every file in `git diff main...HEAD --name-only` is in this build's may-change list, this ticket's locked test files, its own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: a full session (#45). Run only this ticket's specs while you work

## 4. Tasks

### T-F19-01: a failing test for: e2e (behaviour): Plan shows route 46's plan, and choosing an older version reads it with ?version=

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F19-02: a failing test for: e2e (behaviour): Dispatch lists route 100's files, opening one reads route 101 and shows it as text, and the archive link is route 102

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F19-03: a failing test for: e2e (behaviour): confirming the package commit calls route 114 with the manifest's packageHash; a 409 (the package changed) shows its sentence and rereads 100

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F19-04: a failing test for: e2e (behaviour): loading, empty (no plan yet), error (404, 500, offline) render with their words

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F19-05: a failing test for: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/test/plan-dispatch-live/**`
- `apps/web/e2e/plan-dispatch-live/**`
- `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f19-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/**`
- `apps/web/control-room/src/app/logic.js`
- `apps/web/control-room/src/app/operations.js`
- `apps/web/control-room/src/mock/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F18 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/pages/project/CanonPage.jsx`, `apps/web/control-room/src/pages/project/CanonDock.jsx`, `apps/web/control-room/changes/T-F18.md` |
| T-F18 | tests | `apps/web/test/canon-live/**`, `apps/web/e2e/canon-live/**` |
| T-F20 | builds | `apps/web/control-room/src/sources/build.js`, `apps/web/control-room/src/pages/live/**`, `apps/web/control-room/src/pages/operations/ModulePage.jsx`, `apps/web/control-room/src/lib/live.js`, `apps/web/control-room/changes/T-F20.md` |
| T-F20 | tests | `apps/web/test/build-live/**`, `apps/web/e2e/build-live/**` |
| T-F21 | builds | `apps/web/control-room/src/sources/release.js`, `apps/web/control-room/src/pages/operations/ReceiptPage.jsx`, `apps/web/control-room/changes/T-F21.md` |
| T-F21 | tests | `apps/web/test/release-live/**`, `apps/web/e2e/release-live/**` |

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
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f19-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F19
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F19: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F19, "Plan and dispatch live": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f19-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F19-plan-dispatch-live`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f19-test-e2e-completion.md`, committed to the branch. Don't push.
