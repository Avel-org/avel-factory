# FENN: shell test-e2e

Frontend sprint-02 · step 1 · The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** FENN, as `.claude/agents/fenn.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-fenn-shell-test-e2e` (test), module `shell`.
- **Your branch:** `frontend/sprint-02/agent-fenn-shell-test-e2e-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-02-agent-fenn-shell-test-e2e-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** first; after `agent-brennan-layout-uic-review-spec` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/fenn.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-02/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/shell-layout.md`: this sprint's source
4. `docs/ui-contracts/kit-v1.9.md`: this sprint's source
5. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
6. `docs/design/AVEL Shell Layout brief v1.9.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: this sprint's source
8. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
9. `docs/agent-dispatch/avel/procedures.md`: this sprint's source
10. `docs/agent-dispatch/frontend/sprint-02/decisions.md`: this sprint's source
11. `docs/ui-contracts/shell-layout.md`: sections 1 to 5 and 9 (SH-20 to SH-24)
12. `docs/ui-contracts/kit-v1.9.md`: section 4, SH-25 (D16)
13. `docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md`: your a7: UC-32 (5abf046 on frontend/sprint-01/agent-fenn-decisions-test-e2e-a7)
14. `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e.md`: this task doc: follow it exactly

## 3. Domain

The shell end to end with Playwright on AVEL_API=mock at 1280, 900 and 390 (SH-20 to SH-25), UC-32 taken in from sprint-01, UC-29 to UC-31 kept.

**The rest of this sprint:**

- `agent-brennan-layout-uic-review-spec`: Review docs/ui-contracts/shell-layout.md and kit-v1.9.md, the one review before the build (procedures rule 2), against Int's brief, the design library v1.9 and the Frontend Map.
- `agent-fenn-shell-test-unit`: The unit and screen tests for the shell, the v1.9 kit, the nav model, the four pages, the approval page on the shell and the styles (SH-01 to SH-14).
- `agent-ghost-mock-build`: The contract mock serves route 19 (GET /api/missions) and route 8 (GET /api/clients), with fixtures that match fixtures.step1's decision rows (shell-layout.md section 4).
- `agent-fantem-shell-kit-build`: The kit's shell from v1.9: AppShell, ScreenHeader, SegmentedControl, the new icons, the canvas, and v1.9's changes to Button, DecisionTag, ReasonDialog and Dialog, plus D16 (shell-layout.md sections 1 to 3; kit-v1.9.md section 1).
- `agent-nemi-shell-styles-build`: The styles on v1.9: tokens.css copied again, base.css's hover gate, the new chrome.css, and the size-matched font fallbacks (kit-v1.9.md section 3).
- `agent-zero-shell-kit-review-frontend`: Review Fantem's shell kit against shell-layout.md sections 1 to 3 and kit-v1.9.md section 1.
- `agent-leon-missions-build`: The missions module's first cut: route 19's query options through index.ts, and the All projects and Progress screens through screens.ts (shell-layout.md sections 4 and 5). No route files: system writes them.
- `agent-ghost-clients-build`: The clients module's first cut: route 8's query options through index.ts, and the Clients screen through screens.ts (shell-layout.md sections 4 and 5). No route files: system writes them.
- `agent-zero-missions-review-frontend`: Review Leon's missions module against shell-layout.md sections 4 and 5.
- `agent-zero-clients-review-frontend`: Review Ghost's clients module against shell-layout.md sections 4 and 5.
- `agent-leon-system-build`: The shell route and the system module: _shell, ShellLayout (nav from routes, project rows, counts, tabs, crumbs, titles, cookies), Settings' Appearance section (the theme only), __root's theme cookie and fixed glass depth, and the sprint's route files (shell-layout.md sections 4 to 6).
- `agent-ghost-decisions-build`: The approval page on the shell and on v1.9: layout=desk with no viewport read, loadReasonDialog, ScreenHeader, padding and stylesheets (kit-v1.9.md section 2).
- `agent-zero-system-review-frontend`: Review Leon's shell route and system module against shell-layout.md sections 4 to 6.
- `agent-zero-decisions-review-frontend`: Review Ghost's approval page follow-up against kit-v1.9.md section 2 and the approval page's revision 15.
- `agent-brennan-login-uic-review-spec`: Review docs/ui-contracts/login.md, the one review before the build (procedures rule 2), against the Frontend Map, the Step 0 and Step 1 plan's Better Auth items and the design library v1.9.
- `agent-leah-shell-review-a11y-perf`: The shell and its pages on main once sprint-02 is merged: rule 7's size check, layout shift by shell-layout.md section 8, axe, the sheet, skip link, targets, and D16's focus order.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### FENN-01: UC-32 in (5abf046), the 900 project, and SH-20 to SH-25 (P0)

- **Required:** Each test carries its ID and is marked to fail until its build; UC-29 to UC-31 unchanged and passing; retries 0
- **Verify:** `pnpm --filter @avel/web exec playwright test 2>&1 | tail -25 && git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** the suite passes with the new tests as expected failures; only apps/web/e2e and playwright.config.ts changed

### FENN-02: Review evidence: a screenshot and a video per page at three sizes (P1)

- **Required:** evidence.spec.ts covers every nav page at 1280, 900 and 390; skipped unless AVEL_EVIDENCE is set; writes only under $AVEL_EVIDENCE; the default run is unchanged
- **Verify:** `d=$(mktemp -d) && AVEL_EVIDENCE=$d pnpm --filter @avel/web exec playwright test evidence 2>&1 | tail -5; ls $d | head -20; pnpm --filter @avel/web exec playwright test --list 2>&1 | grep -c evidence`
- **Expected:** a .png and a .webm per page and size in the folder (from the stand-in server until the shell is built); the default --list shows no evidence tests

**Notes:**

- First commit: cherry-pick 5abf046 (UC-32) unchanged.
- e2e/** and playwright.config.ts are locked (decisions-e2e). INT's decision in this plan: change them with AVEL_LOCK_OVERRIDE="shell e2e a1: <what> (INT, shell-layout.md)". Add a 900x1000 project beside phone and desk.
- Mark each new test test.fail() until its build lands (procedures rule 1). Retries 0, no fixed sleep. SH-24 waits for the AppShell element's data-hydrated.
- SH-25's harness is kit-v1.9.md section 4's. If it can't load the source files, stop and report it with another harness inside your territory.
- Review evidence (INT, 2026-11-08): e2e/evidence.spec.ts walks each page in the nav (shell-layout.md section 5, and Decisions) at 1280, 900 and 390, and saves one full-page screenshot and one video per page and size. It asserts nothing, so it isn't a fail-first test and never marks main red.
- It runs only when AVEL_EVIDENCE is set (playwright.config.ts: testIgnore evidence.spec.ts otherwise; video "on" and screenshot "on" only for that spec). The default suite and its speed are unchanged.
- Output goes to $AVEL_EVIDENCE (a folder outside the repo, given per attempt), never into git: <page>-<size>.png and <page>-<size>.webm. Any build or review dispatch can run AVEL_EVIDENCE=<dir> pnpm --filter @avel/web exec playwright test evidence and list the files in its completion report.

## 5. Territory

**You may change only:**

- `apps/web/e2e/**`
- `apps/web/playwright.config.ts`
- `docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md`

**You may not change:**

- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/modules/clients/**` (GHOST)
- `apps/web/src/modules/decisions/**` (GHOST)
- `apps/web/src/modules/missions/**` (LEON)
- `apps/web/src/modules/system/**` (LEON)
- `apps/web/src/routes/**` (LEON)
- `apps/web/src/styles/**` (NEMI)
- `apps/web/test/**` (FENN, locked tests)
- `packages/contract-mock/**` (GHOST)
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
| FENN-02 | DONE / PARKED / BLOCKED | |

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
You are FENN on avel-factory, frontend sprint-02 (step 1: The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9).
Dispatch: agent-fenn-shell-test-e2e. Branch: frontend/sprint-02/agent-fenn-shell-test-e2e-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: UC-32 in (5abf046), the 900 project, and SH-20 to SH-25
- FENN-02: Review evidence: a screenshot and a video per page at three sizes

You may change only: apps/web/e2e/**, apps/web/playwright.config.ts, docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
