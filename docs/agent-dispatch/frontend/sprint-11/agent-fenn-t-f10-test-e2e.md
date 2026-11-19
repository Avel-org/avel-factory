---
doc: agent-fenn-t-f10-test-e2e
ticket: T-F10
lane: frontend
sprint: sprint-11
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F10-control-room-rules
checkout: branch
after: []
depends_on: [T-F11]
report: docs/agent-dispatch/frontend/sprint-11/agent-fenn-t-f10-test-e2e-completion.md
---


# T-F10 · tests · Fenn: The control room keeps the rules that don't bend

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-11 · Step 1 |
| Ticket | T-F10 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F10-control-room-rules` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-11/codebase-analysis.md`: the codebase in short
5. `docs/design/CR-W29 The control room from the design export.md`: what this sprint does, and which rules change for how long
6. `docs/ui-reference/control-room-handoff/README.md`: the export's own handoff: port order, the rules that aren't obvious, what's mock and what's contract
7. `docs/ui-reference/control-room-handoff/screens.md`: every screen, its route and its states
8. `/mnt/c/Users/javar/Desktop/avel-control-room/tests/e2e/audit-contract-rules.cjs`: the export's rules audit, to port (read as data)
9. `apps/web/control-room/tools/check-contract.mjs`: refuses any route, procedure, query key or event not in contract 1.0.0
10. `apps/web/control-room/contract/contract-index.json`: the contract index check-contract reads
11. `docs/agent-dispatch/frontend/sprint-11/agent-fenn-t-f10-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** The tests prove the ported control room shows no money, renders untrusted text as text, names only contract 1.0.0 routes and events, and shows nothing of OSA unless its flag is on.

**Refs:**
- E15; CR-W29: what doesn't bend; the export's audit-contract-rules and tools/check-contract.mjs

**Merged before this starts:** T-F11

**Notes from the lead:**
- Every export file this ticket changes gets a line, with its reason, in SOURCE.md's "Changed for apps/web" section; its listed SHA-256 stays the one copied (T-F7-02)
- apps/web/package.json gains one script, "check:contract": "node control-room/tools/check-contract.mjs", and nothing else
- If contract-index.json disagrees with packages/contract (a route or event in one and not the other), stop with needs-cr: the index is the export's copy, and packages/contract wins (AGENTS.md, where the truth is)
- Review: the full-diff rule (kept after T-B7, because H6 still doesn't check the commits before the lock). Run `git diff main...HEAD --name-only`. Every file must be in this build's may-change list, this ticket's locked test files, this ticket's own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1 out-of-territory finding, even when CI's lock check passed
- Budget: / is 225,154 B gzipped of 225,280 B since T-F8. Copy budget.spec's figure into the report and the PR text as a number. Over the limit, stop with needs-cr

## 4. Tasks

### T-F10-01: a failing test for: unit: node control-room/tools/check-contract.mjs exits 0, and its contract-index.json names the same routes and event kinds as packages/contract

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F10-02: a failing test for: unit: no file under control-room/src/mock/ holds a '$' amount or a price, margin, invoice or payment field

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F10-03: a failing test for: e2e: on every route in the page registry, the rendered text holds no '$' (E15)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F10-04: a failing test for: e2e: a sample-world string holding <b>, <script> and a markdown link with javascript: renders as its literal text in an agent trail, a Canon message and a Library entry, and nothing executes

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F10-05: a failing test for: e2e: with ?osa=1 absent, no OSA bar or OSA text renders on any route; with it, the OSA bar shows

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/test/control-room-rules/**`
- `apps/web/e2e/control-room-rules/**`
- `docs/agent-dispatch/frontend/sprint-11/agent-fenn-t-f10-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
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

**Your report:** `docs/agent-dispatch/frontend/sprint-11/agent-fenn-t-f10-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F10
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F10: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F10, "The control room keeps the rules that don't bend": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-11/agent-fenn-t-f10-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F10-control-room-rules`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-11/agent-fenn-t-f10-test-e2e-completion.md`, committed to the branch. Don't push.
