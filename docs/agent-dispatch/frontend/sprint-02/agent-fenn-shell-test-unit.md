# FENN: shell test-unit

Frontend sprint-02 · step 1 · The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** FENN, as `.claude/agents/fenn.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-fenn-shell-test-unit` (test), module `shell`.
- **Your branch:** `frontend/sprint-02/agent-fenn-shell-test-unit-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-02-agent-fenn-shell-test-unit-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** first; after `agent-brennan-shell-uic-review-spec` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/fenn.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-02/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/app-shell.md`: this sprint's source
4. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-02/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/ui-contracts/app-shell.md`: sections 1 to 4 and 7 (SH-01 to SH-11)
9. `docs/ui-contracts/decisions-approval-page.md`: section 4 (D16, R7), section 5 ('Phone', the marker, the count) and section 7, for the page's tests
10. `docs/agent-dispatch/frontend/sprint-01/locks.md`: which test paths are locked, and so need the override
11. `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit.md`: this task doc: follow it exactly

## 3. Domain

The shell's unit and screen tests: AppShell and ScreenHeader in the kit, ShellLayout and PlannedScreen in system on the contract mock, and the approval page's header change (app-shell.md SH-01 to SH-11).

**The rest of this sprint:**

- `agent-brennan-shell-uic-review-spec`: Review docs/ui-contracts/app-shell.md (revision 1), and the approval page contract's revision 15, as at your start commit, against the Frontend Map v0.6 and the design library, before anything is built on them.
- `agent-fenn-shell-test-e2e`: The shell end to end with Playwright on AVEL_API=mock at 1280, 900 and 390 (SH-20 to SH-24), with UC-32 taken in from sprint-01 and UC-29 to UC-31 kept passing.
- `agent-nemi-shell-fonts-build`: The size-matched font fallbacks, by one method for both files (app-shell.md section 5).
- `agent-fantem-shell-kit-build`: The kit's shell: AppShell and ScreenHeader from the design library's v1.6 layout layer, the menu icon, and D16 (app-shell.md section 2).
- `agent-leon-system-build`: The shell route and the system module: _shell, ShellLayout, the nav, the badge, the stub screens and focus mode's stub; / moved under _shell (app-shell.md section 3).
- `agent-ghost-decisions-build`: The approval page on the shell: revision 15 (layout=desk, no viewport read), loadReasonDialog instead of the deep import, ScreenHeader, and the page's padding and stylesheets (app-shell.md section 4).
- `agent-zero-shell-kit-review-frontend`: Review Fantem's shell kit against app-shell.md sections 1 and 2 and the approval page's D16.
- `agent-zero-system-review-frontend`: Review Leon's shell route and system module against app-shell.md section 3.
- `agent-zero-decisions-review-frontend`: Review Ghost's approval page follow-up against app-shell.md section 4 and the approval page's revision 15.
- `agent-leah-shell-review-a11y-perf`: The shell and / on main once everything in sprint-02 is merged: the 150 kB budget, layout shift by app-shell.md section 6, axe, the sheet, skip link and targets, and D16's focus order.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### FENN-01: SH-01 to SH-07: AppShell (brand, nav, current item, badge, sheet focus and inert, focus mode, skip link, tab bar) and ScreenHeader, and SH-06's kit.css rules read as text (P0)

- **Required:** Each test carries its SH ID, renders the kit component with plain props and a test renderLink, and fails first on an assertion or the missing export
- **Verify:** `pnpm --filter @avel/web exec vitest run test/kit 2>&1 | tail -15`
- **Expected:** the SH-01 to SH-07 tests fail; the existing kit tests still pass

### FENN-02: SH-08 to SH-11: ShellLayout on the contract mock (section 3's table, tabs, badge rule with fixtures.step1, 50+ and failNext, current id, crumb and title by route) and PlannedScreen's copy (P0)

- **Required:** Run against packages/contract-mock as the decisions tests are; the badge cases match the approval page's count rule exactly
- **Verify:** `pnpm --filter @avel/web exec vitest run test/modules/system 2>&1 | tail -15`
- **Expected:** the SH-08 to SH-11 tests fail on a missing module or an assertion

### FENN-03: The approval page's tests for app-shell.md section 4: the header is ScreenHeader (data-ui, eyebrow Home, h1 Decisions, the lead), and nothing else in the decisions tests changes (P1)

- **Required:** Only what section 4 changes; every other decisions assertion untouched; one commit, with the override
- **Verify:** `pnpm --filter @avel/web exec vitest run test/modules/decisions 2>&1 | tail -8 && git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** the header assertions fail; the rest pass; only apps/web/test changed

**Notes:**

- New tests go in apps/web/test/kit/ (AppShell, ScreenHeader) and apps/web/test/modules/system/. jsdom applies no media queries: check breakpoints and focus-mode rules by reading kit.css as text (SH-06), as UC-08 does for D11.
- apps/web/test/kit/** is locked (w0-kit, locks.md), and so is apps/web/test/modules/decisions/**. Adding the kit's new test files, and any change the page's header needs in the decisions tests (ScreenHeader's data-ui, the dialog through loadReasonDialog), are INT's decision in this plan: make each such commit with AVEL_LOCK_OVERRIDE="shell tests a1: <what> (INT, app-shell.md revision 1)". Change nothing else under a lock.
- The tests fail first: none of AppShell, ScreenHeader, system or the stubs exists yet. Each fails on an assertion or a missing export, never on a typo.
- After the merge, INT adds locks.md lines for the new paths (apps/web/test/modules/system/**) and moves w0-kit's and decisions' lines.

## 5. Territory

**You may change only:**

- `apps/web/test/**`
- `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit-completion.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/modules/decisions/**` (GHOST)
- `apps/web/src/modules/system/**` (LEON)
- `apps/web/src/routes/**` (LEON)
- `apps/web/src/styles/**` (NEMI)
- `packages/server/**` (the other team)
- `packages/db/**` (the other team)
- `packages/contract/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Fail first, then lock.** A test counts only if:
1. it carries one scenario ID (the done-when number or the task ID) in its name;
2. it fails with an assertion, not a syntax, import or setup error;
3. it fails the same way 3 runs in a row.
A test that pins behaviour that already exists must pass instead, and says so in its name.

**While you work:**
- Write tests only, inside your territory. Never write application code to make a test pass or compile; stub through the test helpers instead.
- Test against real Postgres (`scripts/pg-local.sh`), never mocks of the database.
- Match the test patterns already in the repo: helpers, fixtures, naming.

**When the tests are written:** run them 3 times and keep the output. Commit them in one commit, and put its sha in your report: the operator locks your paths at that commit (`locks.md`) before the builder starts. After the lock, the paths are frozen for everyone, you included.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm --filter "@avel/web..." build
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
pnpm lint
pnpm --filter @avel/web test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# FENN: shell test-unit, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE / PARKED / BLOCKED | |
| FENN-02 | DONE / PARKED / BLOCKED | |
| FENN-03 | DONE / PARKED / BLOCKED | |

## Tests
Each test: its scenario ID, its file and name, and its failure line (or "pins existing behaviour: passes").

## Lock
The tests commit, and the line for `locks.md`: `- shell · <sha> · <your test paths>`.

## Contract to files
Each contract item, done-when test or task you covered, and the files that cover it.

## Deviations
Everything you did differently from this task doc, and why.

## Limitations
What doesn't work yet, or works only in part.

## Parked chains
Each one: what you tried, three times, and why it failed.

## P0 discoveries
Anything critical outside your tasks, with the trace.

## Issues for other agents
Who needs to know what.

## Files changed
`git diff --name-only main...HEAD`.

## Verification
Each Part 7 command and its output.
```

**Then tell INT, and stop.** Send the operator one message, so the next dispatch can start:

```bash
scripts/tell.sh INT "FENN shell test-unit a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are FENN on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-fenn-shell-test-unit. Branch: frontend/sprint-02/agent-fenn-shell-test-unit-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: SH-01 to SH-07: AppShell (brand, nav, current item, badge, sheet focus and inert, focus mode, skip link, tab bar) and ScreenHeader, and SH-06's kit.css rules read as text
- FENN-02: SH-08 to SH-11: ShellLayout on the contract mock (section 3's table, tabs, badge rule with fixtures.step1, 50+ and failNext, current id, crumb and title by route) and PlannedScreen's copy
- FENN-03: The approval page's tests for app-shell.md section 4: the header is ScreenHeader (data-ui, eyebrow Home, h1 Decisions, the lead), and nothing else in the decisions tests changes

You may change only: apps/web/test/**, docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
