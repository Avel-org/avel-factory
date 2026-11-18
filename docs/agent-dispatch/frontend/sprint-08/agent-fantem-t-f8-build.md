---
doc: agent-fantem-t-f8-build
ticket: T-F8
lane: frontend
sprint: sprint-08
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/F8-control-room-budget
checkout: branch
after: [agent-fenn-t-f8-test-e2e]
depends_on: [T-F7]
report: docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build-completion.md
---


# T-F8 · build · Fantem: The control room's first load is back under 150 KB of JavaScript

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-08 · Step 1 |
| Ticket | T-F8 · rigor standard |
| Dispatch | build · Fantem (builder) · model sonnet |
| Works on | `t/F8-control-room-budget` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
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
12. `apps/web/e2e/budget.spec.ts`: the measurement T-F7 set, now held to 150 KB. T-F7's build measured 354,051 B gzipped for /, so this ticket cuts more than half
13. `apps/web/e2e/control-room-budget/**`: the locked acceptance tests: they define done
14. `apps/web/e2e/budget.spec.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The Decisions home loads fast on a phone again: / fetches at most 150 KB of JavaScript, gzipped, before it's interactive, and every other page loads its own code when it opens.

**Refs:**
- E16; CR-W29 decision 6
- control-room-handoff/README.md: under 150 KB of JavaScript on first load for Decisions

**Merged before this starts:** T-F7

**Notes from the lead:**
- Every export file this ticket changes gets a line, with its reason, in SOURCE.md's "Changed for apps/web" section; its listed SHA-256 stays the one copied (T-F7-02)
- Split by page: each page's view, its values module (knowledge, operations, uploads, canon, history, crew) and its mock JSON load with a dynamic import when its #/ route first opens, and Decisions' stays in the first load. A page that's loading shows the export's PageSkeleton
- Don't change what any page shows or how it behaves; T-F7's tests and every earlier locked test must still pass
- If / can't reach 150 KB without restructuring logic.js beyond moving imports behind dynamic imports and the values it computes per page, stop with needs-cr and report what the first load holds, by module and size

## 4. Tasks

### T-F8-01: make it true: e2e (budget.spec.ts, changed under CR-W29): everything / loads before the Decisions home is interactive is at most 150 KB gzipped, with a warning over 130 KB, as E16 says

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F8-02: make it true: e2e: opening Library, Live and a project's Progress each fetches that page's own script the first time, and the page renders the same text as before the split

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F8-03: make it true: e2e: on a 390x844 phone with a slow-4G profile, the Decisions home's first decision card is visible within the first load

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/control-room/src/**`
- `apps/web/control-room/SOURCE.md`
- `apps/web/src/routes/**`
- `apps/web/src/control-room.d.ts`
- `apps/web/vite.config.ts`
- `docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/e2e/control-room-budget/**`
- `apps/web/e2e/budget.spec.ts`

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/contract/**`
- `apps/web/control-room/tools/**`
- `apps/web/src/data/**`
- `apps/web/src/styles/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F8`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F8
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F8, "The control room's first load is back under 150 KB of JavaScript": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F8-control-room-budget`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build-completion.md`, committed to the branch. Don't push.
