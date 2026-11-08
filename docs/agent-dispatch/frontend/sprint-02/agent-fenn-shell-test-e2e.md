# FENN: shell test-e2e

Frontend sprint-02 · step 1 · The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** FENN, as `.claude/agents/fenn.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-fenn-shell-test-e2e` (test), module `shell`.
- **Your branch:** `frontend/sprint-02/agent-fenn-shell-test-e2e-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-02-agent-fenn-shell-test-e2e-a<attempt>`, made by `scripts/agent.sh`.
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
8. `docs/ui-contracts/app-shell.md`: sections 1, 3 and 7 (SH-20 to SH-25)
9. `docs/ui-contracts/decisions-approval-page.md`: section 7 (UC-29 to UC-32) and section 6's measure
10. `docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md`: your a7 report on frontend/sprint-01/agent-fenn-decisions-test-e2e-a7 (git show that branch's copy): UC-32 and its failing line
11. `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e.md`: this task doc: follow it exactly

## 3. Domain

The shell end to end with Playwright on AVEL_API=mock at 1280, 900 and 390 (SH-20 to SH-25), with UC-32 taken in from sprint-01 and UC-29 to UC-31 kept passing.

**The rest of this sprint:**

- `agent-brennan-shell-uic-review-spec`: Review docs/ui-contracts/app-shell.md (revision 2 from a2; revision 1 in a1), and the approval page contract's revision 15, as at your start commit, against the Frontend Map v0.6 and the design library, before anything is built on them.
- `agent-fenn-shell-test-unit`: The shell's unit and screen tests: AppShell and ScreenHeader in the kit, ShellLayout and PlannedScreen in system on the contract mock, and the approval page's header change (app-shell.md SH-01 to SH-14).
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

### FENN-01: UC-32 in (5abf046), the 900 project, and SH-20 to SH-25 (P0)

- **Required:** Each test carries its SH or UC ID and fails first on main with an assertion or a wait; UC-29 to UC-31 unchanged; retries 0
- **Verify:** `pnpm --filter @avel/web exec playwright test 2>&1 | tail -25 && git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** the SH tests and UC-32 fail; UC-29 to UC-31 pass; only apps/web/e2e and playwright.config.ts changed

**Notes:**

- First commit: cherry-pick 5abf046 (UC-32, from frontend/sprint-01/agent-fenn-decisions-test-e2e-a7) unchanged.
- apps/web/e2e/** and playwright.config.ts are locked (decisions-e2e, locks.md). This dispatch changes them by INT's decision in this plan: make each commit with AVEL_LOCK_OVERRIDE="shell e2e a1: <what> (INT, app-shell.md revision 1)". After the merge, INT moves the decisions-e2e line.
- Add a 900x1000 project (no touch) beside phone and desk, as section 7 says. SH-20 and SH-23 run on desk, SH-21 on the 900 project, SH-22 on phone; SH-24 runs on all three. Skip the rest per project, as UC-31 is skipped on desk.
- SH-24 waits for the AppShell element's data-hydrated (app-shell.md section 2) on the stub, and the page root's on /. The tests fail first on main: there's no shell. Keep retries at 0, no fixed sleep, no reducedMotion.
- SH-25 (D16) uses the harness section 7 names: renderToStaticMarkup of a desk and a phone DecisionTag from their source files, set into a page that links the dev server's app.css and kit.css. It fails first on main at 390, where the desk tag still draws the desk layout. If the harness can't load the source files, stop and report it with another harness to propose.

## 5. Territory

**You may change only:**

- `apps/web/e2e/**`
- `apps/web/playwright.config.ts`
- `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md`

**You may not change:**

- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/modules/decisions/**` (GHOST)
- `apps/web/src/modules/system/**` (LEON)
- `apps/web/src/routes/**` (LEON)
- `apps/web/src/styles/**` (NEMI)
- `apps/web/test/**` (FENN, locked tests)
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

**Report.** Write `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# FENN: shell test-e2e, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "FENN shell test-e2e a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are FENN on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-fenn-shell-test-e2e. Branch: frontend/sprint-02/agent-fenn-shell-test-e2e-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: UC-32 in (5abf046), the 900 project, and SH-20 to SH-25

You may change only: apps/web/e2e/**, apps/web/playwright.config.ts, docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
