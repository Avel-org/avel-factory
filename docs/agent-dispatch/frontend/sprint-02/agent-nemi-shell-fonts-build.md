# NEMI: shell-fonts build

Frontend sprint-02 · step 1 · The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** NEMI, as `.claude/agents/nemi.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-nemi-shell-fonts-build` (build), module `shell-fonts`.
- **Your branch:** `frontend/sprint-02/agent-nemi-shell-fonts-build-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-02-agent-nemi-shell-fonts-build-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** at once (no test dispatch in this module); after `agent-brennan-shell-uic-review-spec` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/nemi.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-02/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/app-shell.md`: this sprint's source
4. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-02/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/ui-contracts/app-shell.md`: section 5, the values and the method
9. `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-04-one-method-fallbacks-and-recommendation.md`: how Leah worked the 107.50% and the three overrides
10. `docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build.md`: this task doc: follow it exactly

## 3. Domain

The size-matched font fallbacks, by one method for both files (app-shell.md section 5).

**The rest of this sprint:**

- `agent-brennan-shell-uic-review-spec`: Review docs/ui-contracts/app-shell.md (revision 2 from a2; revision 1 in a1), and the approval page contract's revision 15, as at your start commit, against the Frontend Map v0.6 and the design library, before anything is built on them.
- `agent-fenn-shell-test-unit`: The shell's unit and screen tests: AppShell and ScreenHeader in the kit, ShellLayout and PlannedScreen in system on the contract mock, and the approval page's header change (app-shell.md SH-01 to SH-14).
- `agent-fenn-shell-test-e2e`: The shell end to end with Playwright on AVEL_API=mock at 1280, 900 and 390 (SH-20 to SH-25), with UC-32 taken in from sprint-01 and UC-29 to UC-31 kept passing.
- `agent-fantem-shell-kit-build`: The kit's shell: AppShell and ScreenHeader from the design library's v1.6 layout layer, the menu icon, and D16 (app-shell.md section 2).
- `agent-leon-system-build`: The shell route and the system module: _shell, ShellLayout, the nav, the badge, the stub screens and focus mode's stub; / moved under _shell (app-shell.md section 3).
- `agent-ghost-decisions-build`: The approval page on the shell: revision 15 (layout=desk, no viewport read), loadReasonDialog instead of the deep import, ScreenHeader, and the page's padding and stylesheets (app-shell.md section 4).
- `agent-zero-shell-kit-review-frontend`: Review Fantem's shell kit against app-shell.md sections 1 and 2 and the approval page's D16.
- `agent-zero-system-review-frontend`: Review Leon's shell route and system module against app-shell.md section 3.
- `agent-zero-decisions-review-frontend`: Review Ghost's approval page follow-up against app-shell.md section 4 and the approval page's revision 15.
- `agent-leah-shell-review-a11y-perf`: The shell and / on main once everything in sprint-02 is merged: the 150 kB budget, layout shift by app-shell.md section 6, axe, the sheet, skip link and targets, and D16's focus order.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### NEMI-01: font-fallbacks.css (ac820a7) with the sans rule by one method: size-adjust 107.50%, ascent-override 90.12%, descent-override 22.44%, line-gap-override 0.00%, inputs in the comment; imported last in app.css (P1)

- **Required:** Only apps/web/src/styles changed; the values are section 5's to two decimals; the build passes
- **Verify:** `grep -nE 'size-adjust|ascent-override|descent-override|line-gap-override|local\(' apps/web/src/styles/font-fallbacks.css && tail -2 apps/web/src/styles/app.css && pnpm --filter "@avel/web..." build >/dev/null && git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** the eight descriptors (sans 107.50, 90.12, 22.44, 0.00; mono 99.98, 102.52, 27.50, 0.00) and both local() pairs; the import last; the build exits 0; only styles changed

**Notes:**

- Start from your ac820a7 (on frontend/sprint-01/agent-nemi-w0-fonts-build-a2): cherry-pick it, then change only the sans rule's four values and its comment to section 5's method and inputs. The mono rule stays as ac820a7 has it.
- No test covers this file. Leah's final measure does (app-shell.md section 6), so say in your report which local() face Chromium drew before the swap (CDP CSS.getPlatformFontsForNode), as in your w0-fonts a2.

## 5. Territory

**You may change only:**

- `apps/web/src/styles/**`
- `docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build-completion.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/modules/decisions/**` (GHOST)
- `apps/web/src/modules/system/**` (LEON)
- `apps/web/src/routes/**` (LEON)
- `apps/web/test/**` (FENN, locked tests)
- `packages/server/**` (the other team)
- `packages/db/**` (the other team)
- `packages/contract/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Before you change anything, for every chain or task:**
1. Read the vector end to end: what calls this, what it calls, what breaks if it changes.
2. Read 3 to 5 files beside the place you'll change. Match their naming, error handling, imports and signatures exactly. You match the codebase; the codebase doesn't match you.
3. Find every caller and callee of what you change. Know the blast radius first.
4. List the failure modes (empty input, concurrent access, timeouts, partial failure) and handle each one.

**While you work:**
- Keep changes surgical: the task, nothing around it. No refactors, no unassigned features, no TODO placeholders, no swallowed errors.
- Never edit a locked test. If a locked test looks wrong, stop and say so under Deviations in your report; don't change it.
- Run the build and the tests after each meaningful change.

**After each chain or task:** run every command in Part 7's verification. If one fails, fix it before you move on. If it still fails after 3 different approaches, **park** it: write what you tried under Parked chains, commit, and go to the next. Never pile up broken chains.

**A P0 you weren't asked about** (data loss, a security hole, a race, broken auth): stop, write it under P0 discoveries with the full trace, commit what you have. Don't fix anything outside your territory.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm --filter "@avel/web..." build
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
pnpm lint
pnpm --filter @avel/web test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# NEMI: shell-fonts build, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| NEMI-01 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "NEMI shell-fonts build a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are NEMI on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-nemi-shell-fonts-build. Branch: frontend/sprint-02/agent-nemi-shell-fonts-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- NEMI-01: font-fallbacks.css (ac820a7) with the sans rule by one method: size-adjust 107.50%, ascent-override 90.12%, descent-override 22.44%, line-gap-override 0.00%, inputs in the comment; imported last in app.css

You may change only: apps/web/src/styles/**, docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
