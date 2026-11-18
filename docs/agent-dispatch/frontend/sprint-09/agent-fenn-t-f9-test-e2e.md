---
doc: agent-fenn-t-f9-test-e2e
ticket: T-F9
lane: frontend
sprint: sprint-09
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F9-control-room-every-screen
checkout: branch
after: []
depends_on: [T-F7]
report: docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-test-e2e-completion.md
---


# T-F9 · tests · Fenn: Every screen of the control room opens and passes WCAG 2.2 AA

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-09 · Step 1 |
| Ticket | T-F9 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F9-control-room-every-screen` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-09/codebase-analysis.md`: the codebase in short
5. `docs/design/CR-W29 The control room from the design export.md`: what this sprint does, and which rules change for how long
6. `docs/ui-reference/control-room-handoff/README.md`: the export's own handoff: port order, the rules that aren't obvious, what's mock and what's contract
7. `docs/ui-reference/control-room-handoff/screens.md`: every screen, its route and its states
8. `docs/ui-reference/control-room-handoff/screens.md`: the 25 screens, their routes and their states
9. `/mnt/c/Users/javar/Desktop/avel-control-room/tests/e2e/flow-smoke-every-page.cjs`: the export's own every-page check, to port (read as data)
10. `/mnt/c/Users/javar/Desktop/avel-control-room/tests/e2e/audit-axe-routes.cjs`: the export's axe audit, to port (read as data)
11. `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** Every page in the export's registry opens at its route in light and night, on desktop and phone, with no error and no accessibility violation.

**Refs:**
- E17; control-room-handoff/screens.md; the export's flow-smoke-every-page and audit-axe-routes

**Merged before this starts:** T-F7

**Notes from the lead:**
- Javaris (Nov 17): T-F9's tests run while T-F8 is built, so depends_on names T-F7 and not T-F8. T-F9's build starts only after T-F8 has merged and the lead has rebuilt t/F9 on that main, with the lock line after every tests-phase commit (F2). OSA starts the build by hand at that point
- T-F8 makes every page but Decisions load its code when its #/ route first opens, behind the export's PageSkeleton (data-ui="Skeleton"). The tests wait for each page's title and for no skeleton, never for a synchronous render, so they hold before and after T-F8
- Every export file this ticket changes gets a line, with its reason, in SOURCE.md's "Changed for apps/web" section; its listed SHA-256 stays the one copied (T-F7-02)
- Fix only what the tests find, in the export's own files, each fix small and named in the report. A fix that would change the design (a colour, a size, a layout) beyond what WCAG 2.2 AA needs: stop with out-of-scope and name it

## 4. Tasks

### T-F9-01: a failing test for: e2e: every route in the export's page registry (PAGES, with a sample id for each $param from the sample world) renders its page's title, with no page error and no console error, at 1280x800 and 390x844

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F9-02: a failing test for: e2e: axe, through T-F7's expectNoViolationsSettled (reduced motion), finds no WCAG 2.2 AA violation on every one of those routes at 1280 and 390, in light and night (E17)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F9-03: a failing test for: e2e: an unknown #/ route shows the export's Not found page

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/e2e/control-room-screens/**`
- `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/contract/**`
- `apps/web/control-room/tools/**`
- `apps/web/src/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

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
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F9
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F9: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F9, "Every screen of the control room opens and passes WCAG 2.2 AA": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F9-control-room-every-screen`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-test-e2e-completion.md`, committed to the branch. Don't push.
