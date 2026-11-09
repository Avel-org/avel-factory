# GHOST: decisions build

Frontend sprint-02 · step 1 · The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** GHOST, as `.claude/agents/ghost.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-ghost-decisions-build` (build), module `decisions`.
- **Your branch:** `frontend/sprint-02/agent-ghost-decisions-build-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-02-agent-ghost-decisions-build-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** at once (no test dispatch in this module); after `agent-fantem-shell-kit-build`, `agent-ghost-clients-build` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/ghost.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-02/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/shell-layout.md`: this sprint's source
4. `docs/ui-contracts/kit-v1.9.md`: this sprint's source
5. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
6. `docs/design/AVEL Shell Layout brief v1.9.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: this sprint's source
8. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
9. `docs/agent-dispatch/avel/procedures.md`: this sprint's source
10. `docs/agent-dispatch/frontend/sprint-02/decisions.md`: this sprint's source
11. `docs/ui-contracts/kit-v1.9.md`: section 2, the whole task
12. `docs/ui-contracts/decisions-approval-page.md`: sections 4 (D16, R7), 5 ('Phone', the marker) and 7 (UC-32)
13. `docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md`: Leon's a3: how the marker waits for the final layout
14. `docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build.md`: this task doc: follow it exactly

## 3. Domain

The approval page on the shell and on v1.9: layout=desk with no viewport read, loadReasonDialog, ScreenHeader, padding and stylesheets (kit-v1.9.md section 2).

**The rest of this sprint:**

- `agent-brennan-layout-uic-review-spec`: Review docs/ui-contracts/shell-layout.md and kit-v1.9.md, the one review before the build (procedures rule 2), against Int's brief, the design library v1.9 and the Frontend Map.
- `agent-fenn-shell-test-unit`: The unit and screen tests for the shell, the v1.9 kit, the nav model, the four pages, the approval page on the shell and the styles (SH-01 to SH-14).
- `agent-fenn-shell-test-e2e`: The shell end to end with Playwright on AVEL_API=mock at 1280, 900 and 390 (SH-20 to SH-26), UC-32 taken in from sprint-01, UC-29 to UC-31 kept.
- `agent-ghost-mock-build`: The contract mock serves route 19 (GET /api/missions) and route 8 (GET /api/clients), with fixtures that match fixtures.step1's decision rows (shell-layout.md section 4).
- `agent-fantem-shell-kit-build`: The kit's shell from v1.9: AppShell, ScreenHeader, SegmentedControl, the new icons, the canvas, and v1.9's changes to Button, DecisionTag, ReasonDialog and Dialog, plus D16 (shell-layout.md sections 1 to 3; kit-v1.9.md section 1).
- `agent-nemi-shell-styles-build`: The styles on v1.9: tokens.css copied again, base.css's hover gate, the new chrome.css, and the size-matched font fallbacks (kit-v1.9.md section 3).
- `agent-zero-shell-kit-review-frontend`: Review Fantem's shell kit against shell-layout.md sections 1 to 3 and kit-v1.9.md section 1.
- `agent-leon-missions-build`: The missions module's first cut: route 19's query options through index.ts, and the All projects and Progress screens through screens.ts (shell-layout.md sections 4 and 5). No route files: system writes them.
- `agent-ghost-clients-build`: The clients module's first cut: route 8's query options through index.ts, and the Clients screen through screens.ts (shell-layout.md sections 4 and 5). No route files: system writes them.
- `agent-zero-missions-review-frontend`: Review Leon's missions module against shell-layout.md sections 4 and 5.
- `agent-zero-clients-review-frontend`: Review Ghost's clients module against shell-layout.md sections 4 and 5.
- `agent-leon-system-build`: The shell route and the system module: _shell, ShellLayout (nav from routes, project rows, counts, tabs, crumbs, titles, cookies), Settings with Theme and Depth, __root's depth cookie, and the sprint's route files (shell-layout.md sections 4 to 6).
- `agent-zero-system-review-frontend`: Review Leon's shell route and system module against shell-layout.md sections 4 to 6.
- `agent-zero-decisions-review-frontend`: Review Ghost's approval page follow-up against kit-v1.9.md section 2 and the approval page's revision 15.
- `agent-leah-shell-review-a11y-perf`: The shell and its pages on main once sprint-02 is merged: rule 7's size check, layout shift by shell-layout.md section 8, axe, the sheet, skip link, targets, and D16's focus order.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### GHOST-01: Every DecisionTag with layout="desk", no viewport read, loadReasonDialog, ScreenHeader, .dec-head rules and .dec-page padding gone, the stylesheet list the module's own (P0)

- **Required:** SH-12 passes; UC-29 to UC-32 pass on the shell (scratch merge if needed); every locked decisions test passes
- **Verify:** `! grep -rnE 'matchMedia|useIsPhone|kit/[A-Z]' apps/web/src/modules/decisions && pnpm --filter @avel/web test && git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** no line listed; the tests pass; only apps/web/src/modules/decisions changed

**Notes:**

- INT names you as this module's builder here. Read Leon's a3 report before you change the marker.
- Your branch merges after Leon's system build (procedures rule 1: nothing merges until green on the merged tree). Check your work on a scratch merge with his branch, and say so.
- Remove useIsPhone, PHONE_QUERY and every matchMedia read. Report /'s first load.

## 5. Territory

**You may change only:**

- `apps/web/src/modules/decisions/**`
- `docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build-completion.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/modules/clients/**` (GHOST)
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

**Report.** Write `docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# GHOST: decisions build, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| GHOST-01 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "GHOST decisions build a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are GHOST on avel-factory, frontend sprint-02 (step 1: The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9).
Dispatch: agent-ghost-decisions-build. Branch: frontend/sprint-02/agent-ghost-decisions-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- GHOST-01: Every DecisionTag with layout="desk", no viewport read, loadReasonDialog, ScreenHeader, .dec-head rules and .dec-page padding gone, the stylesheet list the module's own

You may change only: apps/web/src/modules/decisions/**, docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
