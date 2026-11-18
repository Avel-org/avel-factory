---
doc: agent-fenn-t-f8-test-e2e
ticket: T-F8
lane: frontend
sprint: sprint-08
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F8-control-room-budget
checkout: branch
after: []
depends_on: [T-F7]
report: docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-test-e2e-completion.md
---


# T-F8 · tests · Fenn: The control room loads each page's code when it opens, and / holds to 220 KB of JavaScript

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-08 · Step 1 |
| Ticket | T-F8 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F8-control-room-budget` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-08/codebase-analysis.md`: the codebase in short
5. `docs/design/CR-W29 The control room from the design export.md`: what this sprint does, and which rules change for how long
6. `docs/ui-reference/control-room-handoff/README.md`: the export's own handoff: port order, the rules that aren't obvious, what's mock and what's contract
7. `docs/ui-reference/control-room-handoff/screens.md`: every screen, its route and its states
8. `apps/web/control-room/src/app/logic.js`: its static imports pull every page's values and the whole sample world into the first load
9. `apps/web/control-room/src/app/ControlRoomView.jsx`: which page shows, the seam for loading each page's view on demand
10. `apps/web/control-room/src/main.jsx`: since T-F7 it exports ControlRoom for src/routes/index.tsx to mount, and imports the 28 stylesheets (CSS, not JavaScript)
11. `apps/web/control-room/SOURCE.md`: what T-F7 already changed in the export, and where this ticket names its own changes
12. `apps/web/e2e/budget.spec.ts`: the measurement T-F7 set, now held to 220 KB. T-F7's build measured 354,051 B gzipped for /; attempt 1 measured the floor with every other page on demand at about 205 to 215 KB
13. `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** The Decisions home loads faster on a phone: / fetches at most 220 KB of JavaScript, gzipped, before it's interactive (down from about 355 KB), and every other page loads its own code when it opens.

**Refs:**
- E16; CR-W29 decision 6, as amended Nov 17: 220 KB from T-F8, only ever lowered; 150 KB returns as the wiring's done-when

**Merged before this starts:** T-F7

**Notes from the lead:**
- Every export file this ticket changes gets a line, with its reason, in SOURCE.md's "Changed for apps/web" section; its listed SHA-256 stays the one copied (T-F7-02)
- Split by page: each page's view, its values module (knowledge, operations, uploads, canon, history, crew) and its mock JSON load with a dynamic import when its #/ route first opens, and Decisions' stays in the first load. A page that's loading shows the export's PageSkeleton
- Don't change what any page shows or how it behaves; T-F7's tests and every earlier locked test must still pass
- Don't split logic.js's class or restructure it: the wiring moves each screen's values out of it (CR-W29 decision 6, as amended). Move imports behind dynamic imports, and move the values it computes per page only where that's a move, not a rewrite. If / can't reach 220 KB that way, stop with needs-cr and report what the first load holds, by module and size
- Attempt 1 (needs-cr, Fantem's report 2131a61) measured the first load by module; start from its breakdown

## 4. Tasks

### T-F8-01: a failing test for: e2e (budget.spec.ts, changed under CR-W29): everything / loads before the Decisions home is interactive is at most 220 KB gzipped, with a warning over 200 KB (CR-W29 decision 6, as amended)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F8-02: a failing test for: e2e: opening Library, Live and a project's Progress each fetches that page's own script the first time, and the page renders the same text as before the split

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F8-03: a failing test for: e2e: on a 390x844 phone with a slow-4G profile, the Decisions home's first decision card is visible within the first load (the same 220 KB)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F8-04: a failing test for: Attempt 2, under F2 and CR-W29 decision 6 as amended: in your own commit, change LIMIT to 220 × 1024 and the warning to 200 × 1024 in e2e/budget.spec.ts and e2e/control-room-budget/budget.spec.ts, and change nothing else in attempt 1's tests. If you think anything else in them is wrong, stop with test-dispute

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/e2e/control-room-budget/**`
- `apps/web/e2e/budget.spec.ts`
- `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/contract/**`
- `apps/web/control-room/tools/**`
- `apps/web/src/data/**`
- `apps/web/src/styles/**`
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
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F8
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F8: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F8, "The control room loads each page's code when it opens, and / holds to 220 KB of JavaScript": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F8-control-room-budget`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-test-e2e-completion.md`, committed to the branch. Don't push.
