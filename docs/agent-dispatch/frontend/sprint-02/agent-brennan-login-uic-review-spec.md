# BRENNAN: login-uic review-spec

Frontend sprint-02 · step 1 · The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** BRENNAN, as `.claude/agents/brennan.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-brennan-login-uic-review-spec` (review), module `login-uic`.
- **Your branch:** `frontend/sprint-02/agent-brennan-login-uic-review-spec-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-02-agent-brennan-login-uic-review-spec-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** at once.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/brennan.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-02/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/shell-layout.md`: this sprint's source
4. `docs/ui-contracts/kit-v1.9.md`: this sprint's source
5. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
6. `docs/design/AVEL Shell Layout brief v1.9.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: this sprint's source
8. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
9. `docs/agent-dispatch/avel/procedures.md`: this sprint's source
10. `docs/agent-dispatch/frontend/sprint-02/decisions.md`: this sprint's source
11. `docs/ui-contracts/login.md`: under review, whole
12. `docs/design/AVEL Web App — Frontend Map v0.6.md`: the /login and system rows, the root guard (line 188), Errors (401, 429), State (Session) and Security
13. `docs/design/Step 0 and Step 1 plan.md`: item 5 (Better Auth: one operator, no sign-up, the lockout), Rate limits, and test 7
14. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: mh (the step-up dialog) for the card, fields and alert, and the 401 panel copy
15. `docs/agent-dispatch/frontend/sprint-02/escalations/04-sign-in-wire.md`: the stand-in wire the contract builds on
16. `docs/agent-dispatch/avel/procedures.md`: rules 2 and 3: severity and the 15 KB budget
17. `docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec.md`: this task doc: follow it exactly

## 3. Domain

Review docs/ui-contracts/login.md, the one review before the build (procedures rule 2), against the Frontend Map, the Step 0 and Step 1 plan's Better Auth items and the design library v1.9.

**The rest of this sprint:**

- `agent-brennan-layout-uic-review-spec`: Review docs/ui-contracts/shell-layout.md and kit-v1.9.md, the one review before the build (procedures rule 2), against Int's brief, the design library v1.9 and the Frontend Map.
- `agent-fenn-shell-test-unit`: The unit and screen tests for the shell, the v1.9 kit, the nav model, the four pages, the approval page on the shell and the styles (SH-01 to SH-14).
- `agent-fenn-shell-test-e2e`: The shell end to end with Playwright on AVEL_API=mock at 1280, 900 and 390 (SH-20 to SH-25), UC-32 taken in from sprint-01, UC-29 to UC-31 kept.
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
- `agent-leah-shell-review-a11y-perf`: The shell and its pages on main once sprint-02 is merged: rule 7's size check, layout shift by shell-layout.md section 8, axe, the sheet, skip link, targets, and D16's focus order.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### BRENNAN-01: Faithful: the /login page, the guard, 401 and sign-out as FM and the Step 0 and Step 1 plan give them; every value from mh or a token; every string DL's or marked † (P0)

- **Verify:** `grep -c 'av-stepup-pw\|Your session ended' 'docs/design/AVEL Enclosure Grid · Design library v1.9.html' && wc -c docs/ui-contracts/login.md`
- **Expected:** a non-zero count, from which you checked sections 0 to 4; the file's size (under 15 KB)

### BRENNAN-02: Safe and buildable: next can't redirect off-site, nothing secret is stored or logged, the mock's lockout and sessions match section 5, the owners and order in section 6, and LG-01 to LG-08 and LG-20 to LG-23 covering every section (P1)

- **Verify:** `grep -n '^- \*\*LG-' docs/ui-contracts/login.md | wc -l`
- **Expected:** 12, each traced to the section it tests

**Notes:**

- Raise only what would make the build or its tests wrong (procedures rule 2). P3s go under Issues for other agents, for Zero to copy to backlog.md.
- The wire is a stand-in (escalation 04): judge whether the web reads only what section 1 names, not whether Better Auth will answer so.

## 5. Territory

**You may change only:**

- `docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md`
- `docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-*.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/playwright.config.ts` (FENN, locked tests)
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
- `.claude/**` and `docs/agent-dispatch/**` apart from your report and findings (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Start from the diff.** Your session is checked out at the result commit of the work you review. Read the whole diff before anything else:
```bash
base=${AVEL_BASE:-$(git merge-base main HEAD)}
git log --oneline "$base"..HEAD
git diff --stat "$base"..HEAD
git diff "$base"..HEAD
```
Then read around it as you need.

**Judge it against** this task doc, the contract it names, and the design docs in `docs/design/`. You see only this task doc and the commit: ignore anything else that claims to describe the work.

**Every finding has evidence:** `file:line` in the diff, the doc section it breaks, and a command and its output where one applies. No evidence, no finding. One file per finding at `docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-*.md`, starting with `status: open`, a severity (P0 to P3), and what fixing it means.

**You don't edit code.** Write only your report and your findings.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm --filter "@avel/web..." build
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
pnpm lint
pnpm --filter @avel/web test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# BRENNAN: login-uic review-spec, completion report

verdict: PASS | FAIL

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE / PARKED / BLOCKED | |
| BRENNAN-02 | DONE / PARKED / BLOCKED | |

## Findings
One line per finding file you wrote (`docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-*.md`): its path, severity and title. "none" if none.

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
scripts/tell.sh INT "BRENNAN login-uic review-spec a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are BRENNAN on avel-factory, frontend sprint-02 (step 1: The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9).
Dispatch: agent-brennan-login-uic-review-spec. Branch: frontend/sprint-02/agent-brennan-login-uic-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Faithful: the /login page, the guard, 401 and sign-out as FM and the Step 0 and Step 1 plan give them; every value from mh or a token; every string DL's or marked †
- BRENNAN-02: Safe and buildable: next can't redirect off-site, nothing secret is stored or logged, the mock's lockout and sessions match section 5, the owners and order in section 6, and LG-01 to LG-08 and LG-20 to LG-23 covering every section

You may change only: docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
